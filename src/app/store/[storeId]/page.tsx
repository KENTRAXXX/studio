'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from './layout';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Loader2, Warehouse } from 'lucide-react';
import { useParams } from 'next/navigation';
import { demoProducts } from '@/lib/demo-data';

type StorefrontProduct = {
    id: string;
    name: string;
    description: string;
    suggestedRetailPrice: number;
    wholesalePrice: number;
    imageUrl: string;
    productType: 'INTERNAL' | 'EXTERNAL';
    vendorId: string;
    isManagedBySoma: boolean;
};

export default function StorefrontPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const isDemoMode = storeId === 'demo';
  
  const { toast } = useToast();
  const { addToCart } = useCart();
  const firestore = useFirestore();

  // Firestore hooks
  const storeRef = !isDemoMode && firestore ? doc(firestore, 'stores', storeId) : null;
  const { data: storeData, loading: storeLoading } = useDoc(storeRef);
  const productsRef = !isDemoMode && firestore ? collection(firestore, 'stores', storeId, 'products') : null;
  const { data: liveProducts, loading: productsLoading } = useCollection<StorefrontProduct>(productsRef);

  // Determine which data source to use
  const products = isDemoMode ? demoProducts.map(p => ({ ...p, price: p.retailPrice, suggestedRetailPrice: p.retailPrice })) : liveProducts;
  const isLoading = isDemoMode ? false : (storeLoading || productsLoading);

  const productsSectionRef = useRef<HTMLDivElement>(null);

  // Hero section data
  const heroTitle = isDemoMode ? 'The SOMA Experience' : storeData?.heroTitle || 'Elegance Redefined';
  const heroSubtitle = isDemoMode ? 'This is a preview of a live SOMA storefront.' : storeData?.heroSubtitle || 'Discover curated collections of timeless luxury.';
  const heroImageUrl = storeData?.heroImageUrl || PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl;

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  const getPlaceholderImage = (imageIdentifier: string) => {
    if (imageIdentifier?.startsWith('https')) return imageIdentifier;
    return PlaceHolderImages.find(img => img.id === imageIdentifier)?.imageUrl || `https://picsum.photos/seed/${imageIdentifier}/600/400`;
  }
  
  const handleShopNowClick = () => {
    productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full flex items-center justify-center text-center text-white">
        {heroImageUrl && (
          <Image
            src={heroImageUrl}
            alt="Luxury storefront hero image"
            fill
            className="object-cover"
            data-ai-hint="luxury abstract"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 p-4">
          <h1 className="text-5xl md:text-7xl font-extrabold font-headline text-primary animate-gold-pulse">
            {heroTitle}
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
          <Button size="lg" className="mt-8 h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleShopNowClick}>
            Shop Now
          </Button>
        </div>
      </section>

      {/* Product Grid */}
      <section ref={productsSectionRef} className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center font-headline mb-10">Featured Products</h2>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : !products || products.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg p-8">
                <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold font-headline text-primary">A Collection in the Making</h3>
                <p className="text-muted-foreground mt-2">This boutique is currently curating its collection. Check back soon.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
                <Card key={product.id} className="group overflow-hidden rounded-lg border-primary/20 bg-card hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-2">
                <Link href={`/store/${storeId}/product/${product.id}`} className="block">
                    <div className="relative w-full aspect-square">
                    <Image
                        src={getPlaceholderImage(product.imageUrl)}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        data-ai-hint="product photo"
                    />
                    </div>
                </Link>
                <CardContent className="p-4 text-center">
                    <Link href={`/store/${storeId}/product/${product.id}`} className="block">
                    <h3 className="text-lg font-semibold truncate group-hover:text-primary">{product.name}</h3>
                    </Link>
                    <p className="text-muted-foreground font-bold text-lg">${(product.suggestedRetailPrice).toFixed(2)}</p>
                    <Button 
                        className="mt-4 w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => handleAddToCart(product)}
                    >
                    Add to Cart
                    </Button>
                </CardContent>
                </Card>
            ))}
            </div>
        )}
      </section>
    </div>
  );
}
