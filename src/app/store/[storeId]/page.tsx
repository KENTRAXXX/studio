
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from './layout';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function StorefrontPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const heroImage = PlaceHolderImages.find(img => img.id === 'storefront-hero');
  const { toast } = useToast();
  const { addToCart } = useCart();
  const firestore = useFirestore();

  const productsRef = firestore ? collection(firestore, 'stores', storeId, 'products') : null;
  const { data: storefrontData, loading: productsLoading } = useCollection(productsRef);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  const getPlaceholderImage = (id: string) => {
    return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400';
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full flex items-center justify-center text-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt="Luxury storefront hero image"
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold font-headline text-primary animate-gold-pulse">
            Elegance Redefined
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
            Discover curated collections of timeless luxury.
          </p>
          <Button size="lg" className="mt-8 h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
            Shop Now
          </Button>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center font-headline mb-10">Featured Products</h2>
        {productsLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {storefrontData?.map((product: any) => (
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
                    <p className="text-muted-foreground font-bold text-lg">${product.suggestedRetailPrice.toFixed(2)}</p>
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
