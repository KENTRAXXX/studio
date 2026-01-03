'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { masterCatalog } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Gem } from "lucide-react";

export default function ProductCatalogPage() {
  const { toast } = useToast();

  const handleClone = (productName: string) => {
    toast({
      title: "Product Synced!",
      description: `${productName} successfully synced to your custom domain.`,
    });
  };

  const getPlaceholderImage = (id: string) => {
    return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400';
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Gem className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Master Product Catalog</h1>
      </div>
      <p className="text-muted-foreground">
        Select products from the master catalog to add to your personal storefront.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {masterCatalog.map((product) => (
          <Card key={product.id} className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all duration-300 group flex flex-col">
            <CardHeader className="p-0">
              <div className="relative w-full aspect-square">
                <Image
                  src={getPlaceholderImage(product.imageId)}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint="product photo"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-lg font-semibold line-clamp-2">{product.name}</CardTitle>
              <p className="text-muted-foreground mt-2 font-mono">
                Wholesale: ${product.masterCost.toFixed(2)}
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button 
                className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleClone(product.name)}
              >
                Clone to My Store
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
