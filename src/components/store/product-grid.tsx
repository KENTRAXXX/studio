'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/app/store/[...slug]/layout';
import { Loader2, Warehouse } from 'lucide-react';

type StorefrontProduct = {
    id: string;
    name: string;
    description: string;
    suggestedRetailPrice: number;
    imageUrl: string;
    compareAtPrice?: number;
};

interface ProductGridProps {
  products: StorefrontProduct[];
  storeId: string;
}

export function ProductGrid({ products, storeId }: ProductGridProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();

  const handleAddToCart = (product: StorefrontProduct) => {
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

  if (!products) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (products.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg p-8">
            <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold font-headline text-primary">A Collection in the Making</h3>
            <p className="text-muted-foreground mt-2">This boutique is currently curating its collection. Check back soon.</p>
        </div>
    )
  }
  
  return (
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
             <div className="flex justify-center items-baseline gap-2 mt-1">
                <p className="font-bold text-lg text-foreground">${(product.suggestedRetailPrice).toFixed(2)}</p>
                {product.compareAtPrice && product.compareAtPrice > product.suggestedRetailPrice && (
                    <p className="text-md text-muted-foreground line-through">
                        ${(product.compareAtPrice).toFixed(2)}
                    </p>
                )}
            </div>
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
  );
}
