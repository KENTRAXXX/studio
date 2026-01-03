'use client';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { masterCatalog } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ProductCatalogPage() {

  const handleClone = (productName: string) => {
    toast({
      title: 'Success!',
      description: `${productName} successfully synced to your custom domain.`,
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Product Catalog</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {masterCatalog.map((product) => {
          const productImage = PlaceHolderImages.find(img => img.id === product.imageId);
          return (
            <Card key={product.id} className="flex flex-col border-primary/50">
              <CardHeader>
                <div className="aspect-square relative w-full overflow-hidden rounded-md">
                  {productImage && (
                    <Image
                      src={productImage.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      data-ai-hint={productImage.imageHint}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-muted-foreground mt-2">Wholesale Price: <span className="font-semibold text-primary">${product.masterCost.toFixed(2)}</span></p>
              </CardContent>
              <CardFooter>
                <Button className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleClone(product.name)}>
                  Clone to My Store
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
