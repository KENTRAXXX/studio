'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { masterCatalog } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Gem, PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ProductCatalogPage() {
  const { toast } = useToast();

  const handleSync = (productName: string) => {
    toast({
      title: "Syncing Product...",
      description: `${productName} is being synced across all stores.`,
    });
  };

  const getPlaceholderImage = (id: string) => {
    return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/100/100';
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Gem className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Master Product Catalog</h1>
        </div>
        <Button className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5"/>
            Add New Product
        </Button>
      </div>

      <Card className="border-primary/50">
          <CardHeader>
              <CardTitle>All Products</CardTitle>
              <CardDescription>This is the master list of all products available for dropshipping.</CardDescription>
          </CardHeader>
          <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Wholesale Cost</TableHead>
                        <TableHead className="text-right">Suggested Retail</TableHead>
                        <TableHead className="text-center">Stock Level</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {masterCatalog.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                                    <Image 
                                        src={getPlaceholderImage(product.imageId)} 
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        data-ai-hint="product photo"
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{product.id}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right font-mono">${product.masterCost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">${product.retailPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={product.stockLevel > 20 ? 'default' : 'destructive'} className={product.stockLevel > 20 ? 'bg-green-600/20 text-green-400 border-green-600/50' : ''}>
                                    {product.stockLevel}
                                </Badge>
                            </TableCell>
                             <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleSync(product.name)}>
                                    Sync
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  );
}
