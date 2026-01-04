'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Gem, PlusCircle, Loader2, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

type Product = {
  id: string;
  name: string;
  masterCost: number;
  retailPrice: number;
  stockLevel: number;
  imageId: string;
  productType: 'INTERNAL' | 'EXTERNAL';
  vendorId: string;
};

export default function GlobalProductCatalogPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [syncedProducts, setSyncedProducts] = useState<Set<string>>(new Set());
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());

  const masterCatalogRef = firestore ? collection(firestore, 'Master_Catalog') : null;
  const { data: masterCatalog, loading: catalogLoading } = useCollection<Product>(masterCatalogRef);
  
  const userProductsRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'stores', user.uid, 'products');
  }, [firestore, user]);

  useEffect(() => {
    if (userProductsRef) {
      getDocs(userProductsRef).then(snapshot => {
        const productIds = new Set(snapshot.docs.map(d => d.id));
        setSyncedProducts(productIds);
      });
    }
  }, [userProductsRef]);

  const handleSync = async (product: Product) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    if (syncedProducts.has(product.id)) {
      toast({ title: 'Already Synced', description: `${product.name} is already in your boutique.`});
      return;
    }

    setSyncingProducts(prev => new Set(prev).add(product.id));

    try {
      const newProductRef = doc(firestore, 'stores', user.uid, 'products', product.id);
      
      const productDataToSync = {
        name: product.name,
        suggestedRetailPrice: product.retailPrice,
        wholesalePrice: product.masterCost,
        description: `A high-quality ${product.name.toLowerCase()} from our master collection.`,
        imageUrl: product.imageId,
        productType: product.productType,
        vendorId: product.vendorId,
        isManagedBySoma: true,
      };

      await setDoc(newProductRef, productDataToSync);

      setSyncedProducts(prev => new Set(prev).add(product.id));
      
      toast({
        title: 'Product Synced!',
        description: `${product.name} has been added to your boutique.`,
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message || 'Could not add product to your store.',
      });
    } finally {
        setSyncingProducts(prev => {
            const newSet = new Set(prev);
            newSet.delete(product.id);
            return newSet;
        });
    }
  };

  const getPlaceholderImage = (id: string) => {
    return (
      PlaceHolderImages.find((img) => img.id === id)?.imageUrl ||
      'https://picsum.photos/seed/placeholder/100/100'
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Gem className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">
            Global Product Catalog
          </h1>
        </div>
        <Button className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add to Global Catalog
        </Button>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            This is the master list of all products available for dropshipping.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {catalogLoading ? (
                 <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
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
                    {masterCatalog && masterCatalog.map((product) => {
                      const isSynced = syncedProducts.has(product.id);
                      const isSyncing = syncingProducts.has(product.id);
                      return (
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
                        <TableCell className="font-mono text-xs">
                            {product.id}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right font-mono">
                            ${product.masterCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            ${product.retailPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge
                            variant={
                                product.stockLevel > 20 ? 'default' : 'destructive'
                            }
                            className={
                                product.stockLevel > 20
                                ? 'bg-green-600/20 text-green-400 border-green-600/50'
                                : ''
                            }
                            >
                            {product.stockLevel}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           {isSynced ? (
                             <Button variant="ghost" size="sm" disabled className="text-green-500">
                                <Check className="mr-2 h-4 w-4" /> Synced
                             </Button>
                           ) : (
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSync(product)}
                                disabled={isSyncing}
                              >
                                {isSyncing ? <Loader2 className="animate-spin" /> : 'Sync'}
                              </Button>
                           )}
                        </TableCell>
                        </TableRow>
                      )
                    })}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
