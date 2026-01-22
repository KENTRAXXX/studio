'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound, useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Check, Loader2, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { useCart } from '../../layout';
import { useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/firebase/user-profile-provider';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, productId } = params;
  const storeId = Array.isArray(slug) ? slug[0] : slug;
  const { toast } = useToast();
  const { addToCart } = useCart();
  const firestore = useFirestore();
  const { userProfile, loading: profileLoading } = useUserProfile();

  const productRef = firestore ? doc(firestore, `stores/${storeId}/products/${productId}`) : null;
  const { data: product, loading: productLoading } = useDoc(productRef);
  
  const [currentPrice, setCurrentPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);


  useEffect(() => {
    if (product) {
      setCurrentPrice(product.suggestedRetailPrice);
      setCompareAtPrice(product.compareAtPrice || 0);
    }
  }, [product]);

  const isLoading = productLoading || profileLoading;

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
  
  const wholesalePrice = product.wholesalePrice || 0;
  const somaFee = wholesalePrice * 0.03;
  const floorPrice = wholesalePrice + somaFee;
  const profit = currentPrice - wholesalePrice;
  const isPriceInvalid = currentPrice < floorPrice;

  const productImage = PlaceHolderImages.find(img => img.id === product.imageUrl);

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
    // No toast needed for instant redirect
    router.push(`/store/${storeId}/checkout`);
    // No need to setIsBuyingNow(false) as the user is navigated away
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
              description: `${product.name} is now priced at $${currentPrice.toFixed(2)}.`,
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Image Gallery */}
        <div className="space-y-8">
            <div className="relative aspect-square rounded-lg overflow-hidden border border-primary/20">
            {productImage && (
                <Image
                src={productImage.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint={productImage.imageHint}
                />
            )}
            </div>
            
            {/* Mogul Pricing Box */}
            {(userProfile?.planTier === 'MOGUL' || userProfile?.planTier === 'SCALER' || userProfile?.planTier === 'ENTERPRISE') && (
              <Card className="border-primary/50 bg-card">
                  <CardHeader>
                      <CardTitle className="font-headline text-primary">Mogul Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                          <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-muted-foreground"/>
                              <span className="font-medium text-muted-foreground">Wholesale Cost</span>
                          </div>
                          <span className="font-bold font-mono text-lg">${wholesalePrice.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-price">Your Retail Price</Label>
                            <Input 
                                id="current-price"
                                type="number"
                                value={currentPrice}
                                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                                className="text-lg font-bold h-12"
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
                       {isPriceInvalid && (
                            <p className="text-sm text-destructive font-medium">Retail price cannot be lower than floor price of ${floorPrice.toFixed(2)} (Wholesale + 3% Fee).</p>
                        )}
                       <div className="flex justify-between items-center p-3 rounded-md bg-green-600/10 border border-green-600/30">
                          <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-green-400"/>
                              <span className="font-medium text-green-400">Projected Profit</span>
                          </div>
                          <span className="font-bold font-mono text-lg text-green-400">${profit.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between items-center p-3 rounded-md bg-red-600/10 border border-red-600/30">
                          <div className="flex items-center gap-2">
                              <Percent className="h-5 w-5 text-red-400"/>
                              <span className="font-medium text-red-400">SOMA Fee (3%)</span>
                          </div>
                          <span className="font-bold font-mono text-lg text-red-400">-${somaFee.toFixed(2)}</span>
                      </div>
                      <Button onClick={handlePriceSave} disabled={isPriceInvalid || isSaving} className="w-full">
                          {isSaving ? <Loader2 className="animate-spin" /> : 'Save Price'}
                      </Button>
                  </CardContent>
              </Card>
            )}
        </div>


        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold font-headline text-primary">{product.name}</h1>
          <div className="flex items-baseline gap-4">
            <p className="text-3xl font-bold">${currentPrice.toFixed(2)}</p>
            {compareAtPrice > currentPrice && (
                <p className="text-2xl font-bold text-muted-foreground line-through">
                    ${compareAtPrice.toFixed(2)}
                </p>
            )}
          </div>
          <p className="text-muted-foreground text-lg">{product.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="h-12 text-lg flex-1" variant="outline" onClick={handleAddToCart}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button size="lg" className="h-12 text-lg flex-1 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleBuyNow} disabled={isBuyingNow}>
              {isBuyingNow ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Securing Item...</> : "Buy Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
