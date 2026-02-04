'use client';

import { useState, useRef, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Download, Image as ImageIcon, Sparkles, Share2 } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import SomaLogo from '@/components/logo';
import { cn } from '@/lib/utils';

type Product = {
  id: string;
  name: string;
  suggestedRetailPrice: number;
  imageUrl: string;
};

type StoreData = {
  storeName: string;
};

export default function MarketingToolkitPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isGoldTheme, setIsGoldTheme] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch Synced Products
  const productsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'stores', user.uid, 'products');
  }, [user, firestore]);

  const { data: products, loading: productsLoading } = useCollection<Product>(productsRef);

  // 2. Fetch Store Name
  const storeRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'stores', user.uid);
  }, [user, firestore]);

  const { data: storeData } = useDoc<StoreData>(storeRef);

  const selectedProduct = useMemo(() => {
    return products?.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const getProductImage = (imageId: string) => {
    if (imageId?.startsWith('http')) return imageId;
    return PlaceHolderImages.find((img) => img.id === imageId)?.imageUrl || '';
  };

  const handleDownload = async () => {
    if (!canvasRef.current || !selectedProduct) return;

    setIsExporting(true);
    try {
      const dataUrl = await toJpeg(canvasRef.current, {
        quality: 0.95,
        width: 1080,
        height: 1920,
        cacheBust: true,
        // skipFonts: true prevents the SecurityError when accessing cross-origin stylesheets
        skipFonts: true,
      });

      const link = document.createElement('a');
      link.download = `SOMA-Poster-${selectedProduct.name.replace(/\s+/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();

      toast({
        title: 'Poster Exported',
        description: 'Your high-res marketing asset is ready for social media.',
      });
    } catch (err) {
      console.error('Export failed', err);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not generate poster. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <ImageIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Marketing Toolkit</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls Panel */}
        <div className="space-y-8">
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Poster Configuration
              </CardTitle>
              <CardDescription>
                Select a product from your boutique to generate a story-sized marketing poster.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-12 border-primary/20">
                    <SelectValue placeholder={productsLoading ? 'Loading products...' : 'Choose a synced product'} />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Luxury Theme</Label>
                  <p className="text-xs text-muted-foreground italic">Toggle for Minimalist White</p>
                </div>
                <Switch checked={isGoldTheme} onCheckedChange={setIsGoldTheme} />
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                onClick={handleDownload}
                disabled={!selectedProductId || isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Rendering Poster...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" /> Download Story Poster
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-headline flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Use high-contrast product photography for the best results.</p>
              <p>• The "Dark Luxury" theme is optimized for Instagram and TikTok Stories.</p>
              <p>• Ensure your store name is updated in Settings for correct branding.</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Canvas Preview */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live Poster Preview
          </p>
          
          <div className="relative w-full max-w-[360px] aspect-[9/16] shadow-2xl overflow-hidden rounded-xl border-4 border-black/10">
            {/* The actual 1080x1920 canvas (scaled down via CSS for preview) */}
            <div
              ref={canvasRef}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-between py-24 px-12 transition-colors duration-500",
                isGoldTheme ? "bg-black text-white" : "bg-white text-black"
              )}
              style={{ width: '1080px', height: '1920px', transform: 'scale(0.333333)', transformOrigin: 'top left' }}
            >
              {/* Gold Border overlay for Dark Theme */}
              {isGoldTheme && (
                <div className="absolute inset-8 border-4 border-primary/40 pointer-events-none" />
              )}

              {/* Header: Store Identity */}
              <div className="text-center space-y-4 z-10">
                <div className="flex items-center justify-center gap-4">
                  <SomaLogo className={cn("h-16 w-16", isGoldTheme ? "text-primary" : "text-black")} />
                  <span className="h-px w-24 bg-current opacity-30" />
                </div>
                <h2 className="text-5xl font-headline font-bold uppercase tracking-[0.2em] pt-4">
                  {storeData?.storeName || 'SOMA BOUTIQUE'}
                </h2>
              </div>

              {/* Center: Product Asset */}
              <div className="relative w-full aspect-square flex items-center justify-center">
                {selectedProduct ? (
                  <div className="relative w-full h-full shadow-2xl">
                    <img
                      src={getProductImage(selectedProduct.imageUrl)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover rounded-sm"
                    />
                    <div className="absolute inset-0 border-8 border-white/5" />
                  </div>
                ) : (
                  <div className="text-center opacity-20">
                    <ImageIcon className="h-48 w-48 mx-auto" />
                    <p className="text-2xl mt-4 font-headline uppercase tracking-widest">Select Product</p>
                  </div>
                )}
              </div>

              {/* Footer: Price & Collection */}
              <div className="text-center space-y-8 z-10 w-full">
                <div className="space-y-2">
                  <p className="text-2xl font-headline uppercase tracking-[0.4em] opacity-60">
                    Exclusive Collection
                  </p>
                  <h3 className="text-7xl font-headline font-bold uppercase tracking-tight truncate px-4">
                    {selectedProduct?.name || 'Your Product'}
                  </h3>
                </div>
                
                <div className="flex items-center justify-center gap-6">
                  <span className="h-px flex-1 bg-current opacity-20" />
                  <div className={cn(
                    "px-10 py-4 border-2 rounded-full text-5xl font-mono font-bold",
                    isGoldTheme ? "border-primary text-primary" : "border-black text-black"
                  )}>
                    ${selectedProduct?.suggestedRetailPrice.toFixed(2) || '0.00'}
                  </div>
                  <span className="h-px flex-1 bg-current opacity-20" />
                </div>

                <p className="text-xl uppercase tracking-[0.5em] pt-12 opacity-40">
                  Secure yours at {storeData?.storeName || 'our shop'}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground italic">Preview scaled to 33% of final resolution.</p>
        </div>
      </div>
    </div>
  );
}
