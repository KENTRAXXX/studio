'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Gem, PlusCircle, Loader2, Check, Warehouse } from 'lucide-react';
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
import { useUserProfile } from '@/firebase/user-profile-provider';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Product = {
  id: string;
  name: string;
  masterCost: number;
  retailPrice: number;
  stockLevel: number;
  imageId: string;
  imageSrc?: string; // For demo data
  productType: 'INTERNAL' | 'EXTERNAL';
  vendorId: string;
  isActive?: boolean;
};

// A unified function to get an image URL
const getProductImage = (product: Product) => {
    // For demo products, imageId is the key to find the URL in PlaceHolderImages
    const placeholder = PlaceHolderImages.find(p => p.id === product.imageId);
    if (placeholder) {
        return placeholder.imageUrl;
    }
    // Fallback for live products that might have full URLs (though less common now)
    if (product.imageId?.startsWith('https')) {
        return product.imageId;
    }
    // Final fallback
    return `https://picsum.photos/seed/${product.id}/100/100`;
}

export default function GlobalProductCatalogPage({ isDemo = false }: { isDemo?: boolean }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { userProfile } = useUserProfile();

  const [syncedProducts, setSyncedProducts] = useState<Set<string>>(new Set());
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());

  // Firestore logic
  const masterCatalogRef = useMemo(() => {
    if (!firestore || isDemo) return null;
    return query(collection(firestore, 'Master_Catalog'), where('isActive', '==', true));
  }, [firestore, isDemo]);
  
  const { data: liveCatalog, loading: catalogLoading } = useCollection<Product>(masterCatalogRef);
  
  const userProductsRef = useMemo(() => {
    if (!firestore || !user || isDemo) return null;
    return collection(firestore, 'stores', user.uid, 'products');
  }, [firestore, user, isDemo]);

  // Determine which data to use
  const masterCatalog = isDemo ? [] : liveCatalog;
  const isLoading = isDemo ? false : catalogLoading;

  useEffect(() => {
    if (userProductsRef) {
      getDocs(userProductsRef).then(snapshot => {
        const productIds = new Set(snapshot.docs.map(d => d.id));
        setSyncedProducts(productIds);
      });
    }
  }, [userProductsRef]);

  const handleAddToCatalog = () => {
    if (userProfile?.planTier === 'SELLER') {
      router.push('/backstage/add-product');
    } else {
      toast({
        title: 'Redirecting to Seller Onboarding...',
        description: 'You need to be a verified seller to add products.',
      });
      router.push('/backstage');
    }
  };

  const handleSync = async (product: Product) => {
    if (isDemo) {
        toast({ title: 'Demo Action', description: 'This is a demo. Syncing is disabled.'});
        return;
    }

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


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Gem className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">
            Global Product Catalog
          </h1>
        </div>
        <Button onClick={handleAddToCatalog} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
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
            {isLoading ? (
                 <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : !masterCatalog || masterCatalog.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg">
                    <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold font-headline text-primary">No Products Available</h3>
                    <p className="text-muted-foreground mt-2">There are currently no active products in the master catalog.</p>
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
                    {masterCatalog.map((product) => {
                      const isSynced = syncedProducts.has(product.id);
                      const isSyncing = syncingProducts.has(product.id);
                      return (
                        <TableRow key={product.id}>
                        <TableCell>
                            <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                            <Image
                                src={getProductImage(product)}
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
                            ${(product.masterCost || 0).toFixed(2)}
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
