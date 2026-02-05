'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound, useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Check, Loader2, DollarSign, TrendingUp, ArrowLeft } from 'lucide-react';
import { useCart } from '../../layout';
import { useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import { ProductViewTracker } from '@/components/store/product-view-tracker';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { storeId, productId } = params;
  const { toast } = useToast();
  const { addToCart } = useCart();
  const firestore = useFirestore();
  const { userProfile, loading: profileLoading } = useUserProfile();

  const productRef = firestore ? doc(firestore, `stores/${storeId}/products/${productId}`) : null;
  const { data: product, loading: productLoading } = useDoc<any>(productRef);
  
  const [currentPrice, setCurrentPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);


  useEffect(() => {
    if (product) {
      setCurrentPrice(product.suggestedRetailPrice || product.price);
      setCompareAtPrice(product.compareAtPrice || 0);
    }
  }, [product]);

  const isLoading = productLoading || profileLoading;

  const wholesalePrice = product?.wholesalePrice || 0;
  
  const margin = useMemo(() => {
    if (currentPrice <= 0) return 0;
    return ((currentPrice - wholesalePrice) / currentPrice) * 100;
  }, [currentPrice, wholesalePrice]);

  if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  if (!product) {
    notFound();
  }
  
  const somaFee = wholesalePrice * 0.03;
  const floorPrice = wholesalePrice + somaFee;
  const profit = currentPrice - wholesalePrice;
  const isPriceInvalid = currentPrice < floorPrice;

  const getProductAssetUrl = (assetId: string) => {
    if (assetId?.startsWith('http')) return assetId;
    return PlaceHolderImages.find(img => img.id === assetId)?.imageUrl || `https://picsum.photos/seed/${assetId}/800/800`;
  };

  const gallery = product.imageGallery || (product.imageUrl ? [product.imageUrl] : []);

  const handleAddToCart = () => {
    const productWithCurrentPrice = { ...product, suggestedRetailPrice: currentPrice };
    addToCart(productWithCurrentPrice);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
      action: <Check className="h-5 w-5 text-green-500" />,
    });
  };

  const handleBuyNow = async () => {
    setIsBuyingNow(true);
    const productWithCurrentPrice = { ...product, suggestedRetailPrice: currentPrice };
    addToCart(productWithCurrentPrice);
    router.push(`/store/${storeId}/checkout`);
  };
  
  const handlePriceSave = async () => {
      if (isPriceInvalid || !productRef) return;
      setIsSaving(true);
      try {
          await updateDoc(productRef, {
              suggestedRetailPrice: currentPrice,
              compareAtPrice: compareAtPrice
          });
          toast({
              title: 'Price Updated',
              description: `${product.name} is now priced at ${formatCurrency(Math.round(currentPrice * 100))}.`,
          });
      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: 'Update Failed',
              description: error.message || 'Could not save the new price.',
          })
      } finally {
          setIsSaving(false);
      }
  }


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <ProductViewTracker storeId={storeId as string} productId={productId as string} />
      <Link href={`/store/${storeId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
      </Link>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Gallery Carousel */}
        <div className="space-y-8">
            <div className="relative w-full rounded-3xl overflow-hidden border-2 border-primary/10 bg-slate-950 shadow-2xl group">
                {gallery.length > 0 ? (
                    <Carousel className="w-full">
                        <CarouselContent>
                            {gallery.map((asset, index) => (
                                <CarouselItem key={index}>
                                    <div className="relative aspect-square">
                                        <Image
                                            src={getProductAssetUrl(asset)}
                                            alt={`${product.name} View ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            priority={index === 0}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {gallery.length > 1 && (
                            <>
                                <CarouselPrevious className="left-4 bg-black/40 border-white/10 text-white hover:bg-black/60" />
                                <CarouselNext className="right-4 bg-black/40 border-white/10 text-white hover:bg-black/60" />
                            </>
                        )}
                    </Carousel>
                ) : (
                    <div className="aspect-square flex items-center justify-center text-slate-700">
                        <ShoppingBag className="h-20 w-20 opacity-20" />
                    </div>
                )}
            </div>
            
            {/* Store Owner Pricing Box */}
            {(userProfile?.planTier === 'MERCHANT' || userProfile?.planTier === 'SCALER' || userProfile?.planTier === 'ENTERPRISE' || userProfile?.userRole === 'ADMIN') && (
              <Card className="border-primary/50 bg-card shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline text-primary flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Owner Pricing & Strategy
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {product.isManagedBySoma && (
                        <div className="flex justify-between items-center p-4 rounded-md bg-muted/50 border border-border/50">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-muted-foreground"/>
                                <span className="font-medium text-muted-foreground">Wholesale Cost</span>
                            </div>
                            <span className="font-bold font-mono text-lg">{formatCurrency(Math.round(wholesalePrice * 100))}</span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-price">Your Retail Price</Label>
                            <Input 
                                id="current-price"
                                type="number"
                                value={currentPrice}
                                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                                className="text-lg font-bold h-12 border-primary/20 focus:border-primary"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="compare-at-price">Compare at Price</Label>
                            <Input 
                                id="compare-at-price"
                                type="number"
                                value={compareAtPrice}
                                onChange={(e) => setCompareAtPrice(parseFloat(e.target.value) || 0)}
                                className="text-lg h-12"
                                placeholder="e.g., 900.00"
                            />
                        </div>
                      </div>

                      {/* Calculated Margin Display */}
                      <div className="p-4 rounded-lg border border-border bg-muted/30 flex justify-between items-center">
                        <div className="space-y-0.5">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calculated Margin</span>
                            <p className="text-[10px] text-muted-foreground/60 italic">Profit percentage based on retail</p>
                        </div>
                        <span className={cn(
                            "text-3xl font-bold font-mono",
                            margin < 20 ? "text-orange-500" : margin > 40 ? "text-primary" : "text-foreground"
                        )}>
                            {margin.toFixed(1)}%
                        </span>
                      </div>

                       {product.isManagedBySoma && isPriceInvalid && (
                            <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 rounded-md border border-destructive/20">Retail price cannot be lower than floor price of {formatCurrency(Math.round(floorPrice * 100))} (Wholesale + 3% Fee).</p>
                        )}
                       {product.isManagedBySoma && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col p-3 rounded-md bg-green-600/5 border border-green-600/20">
                                <span className="text-[10px] text-green-400 font-bold uppercase mb-1">Projected Profit</span>
                                <span className="font-bold font-mono text-xl text-green-400">{formatCurrency(Math.round(profit * 100))}</span>
                            </div>
                            <div className="flex flex-col p-3 rounded-md bg-red-600/5 border border-red-600/20 text-right">
                                <span className="text-[10px] text-red-400 font-bold uppercase mb-1">SOMA Fee (3%)</span>
                                <span className="font-bold font-mono text-xl text-red-400">-{formatCurrency(Math.round(somaFee * 100))}</span>
                            </div>
                         </div>
                       )}
                      <Button onClick={handlePriceSave} disabled={(product.isManagedBySoma && isPriceInvalid) || isSaving} className="w-full h-12 btn-gold-glow">
                          {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 h-4 w-4" />}
                          Save Pricing Strategy
                      </Button>
                  </CardContent>
              </Card>
            )}
        </div>


        {/* Product Info */}
        <div className="space-y-8 pt-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary leading-tight">{product.name}</h1>
            <div className="flex items-baseline gap-4 mt-4">
                <p className="text-4xl font-bold">{formatCurrency(Math.round(currentPrice * 100))}</p>
                {compareAtPrice > currentPrice && (
                    <p className="text-2xl font-bold text-muted-foreground line-through opacity-50">
                        {formatCurrency(Math.round(compareAtPrice * 100))}
                    </p>
                )}
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="h-14 text-lg flex-1 border-primary/20 hover:border-primary/50" variant="outline" onClick={handleAddToCart}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button size="lg" className="h-14 text-lg flex-1 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={handleBuyNow} disabled={isBuyingNow}>
              {isBuyingNow ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Securing Item...</> : "Buy It Now"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border/50">
            <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Availability</p>
                <p className="text-sm font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    In Stock & Ready to Ship
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Shipping</p>
                <p className="text-sm font-medium">Global Express Insured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
