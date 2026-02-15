'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/app/store/[storeId]/layout';
import { Warehouse } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';

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

const ProductSkeletonCard = () => (
    <Card className="overflow-hidden rounded-lg">
        <Skeleton className="w-full aspect-square bg-muted" />
        <CardContent className="p-4 text-center">
            <Skeleton className="h-6 w-3/4 mx-auto bg-muted" />
            <Skeleton className="h-5 w-1/2 mx-auto mt-2 bg-muted" />
            <Skeleton className="h-10 w-full mt-4 bg-muted" />
        </CardContent>
    </Card>
);


export function ProductGrid({ products, storeId }: ProductGridProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const params = useParams();

  // Multi-tenancy aware path generation: Pluralized /products/ for Next.js 15 standards
  const getProductPath = (productId: string) => {
      const isSubdomain = !!params.domain || !!params.site;
      return isSubdomain ? `/products/${productId}` : `/store/${storeId}/products/${productId}`;
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
                <ProductSkeletonCard key={index} />
            ))}
        </div>
    )
  }

  if (products.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg p-8">
            <Warehouse className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
            <h3 className="text-xl font-bold font-headline text-primary">A Collection in the Making</h3>
            <p className="text-muted-foreground mt-2">This boutique is currently curating its collection. Check back soon.</p>
        </div>
    )
  }
  
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" aria-label="Product collection">
      {products.map((product) => (
        <li key={product.id}>
            <Card className="group overflow-hidden rounded-lg border-primary/20 bg-card hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-2">
            <Link href={getProductPath(product.id)} className="block">
                <div className="relative w-full aspect-square">
                <Image
                    src={getPlaceholderImage(product.imageUrl)}
                    alt={`View details for ${product.name}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    data-ai-hint="product photo"
                />
                </div>
            </Link>
            <CardContent className="p-4 text-center">
                <Link href={getProductPath(product.id)} className="block">
                <h3 className="text-lg font-semibold truncate group-hover:text-primary">{product.name}</h3>
                </Link>
                <div className="flex justify-center items-baseline gap-2 mt-1">
                    <p className="font-bold text-lg text-foreground">{formatCurrency(Math.round(product.suggestedRetailPrice * 100))}</p>
                    {product.compareAtPrice && product.compareAtPrice > product.suggestedRetailPrice && (
                        <p className="text-md text-muted-foreground line-through" aria-label="Original price">
                            {formatCurrency(Math.round(product.compareAtPrice * 100))}
                        </p>
                    )}
                </div>
                <Button 
                className="mt-4 w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleAddToCart(product)}
                aria-label={`Add ${product.name} to cart`}
                >
                Add to Cart
                </Button>
            </CardContent>
            </Card>
        </li>
      ))}
    </ul>
  );
}
