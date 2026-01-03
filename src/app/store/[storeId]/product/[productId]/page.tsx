'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { storefrontData } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../layout';

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  const product = storefrontData.find(p => p.id === params.productId);

  if (!product) {
    notFound();
  }

  const productImage = PlaceHolderImages.find(img => img.id === product.imageId);

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
      action: <Check className="h-5 w-5 text-green-500" />,
    });
  };

  const handleBuyNow = () => {
    addToCart(product);
    // In a real app, you would redirect to checkout here.
    toast({
      title: 'Proceeding to Checkout',
      description: 'Redirecting you to the checkout page...',
    });
  };


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Image Gallery */}
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

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold font-headline text-primary">{product.name}</h1>
          <p className="text-3xl font-bold">${product.price.toFixed(2)}</p>
          <p className="text-muted-foreground text-lg">{product.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="h-12 text-lg flex-1" variant="outline" onClick={handleAddToCart}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button size="lg" className="h-12 text-lg flex-1 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleBuyNow}>
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
