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
import { Gem, Loader2, Check, Warehouse, Sparkles, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

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
  status?: string;
  approvedAt?: any;
  categories?: string[];
  tags?: string[];
};

const ITEMS_PER_PAGE = 20;

// A unified function to get an image URL
const getProductImage = (product: Product) => {
    const placeholder = PlaceHolderImages.find(p => p.id === product.imageId);
    if (placeholder) {
        return placeholder.imageUrl;
    }
    if (product.imageId?.startsWith('https')) {
        return product.imageId;
    }
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Firestore logic - Only pull 'active' products
  const masterCatalogRef = useMemoFirebase(() => {
    if (!firestore || isDemo) return null;
    return query(
        collection(firestore, 'Master_Catalog'), 
        where('status', '==', 'active')
    );
  }, [firestore, isDemo]);
  
  const { data: liveCatalog, loading: catalogLoading } = useCollection<Product>(masterCatalogRef);
  
  const userProductsRef = useMemoFirebase(() => {
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

  const filteredCatalog = useMemo(() => {
    if (!masterCatalog) return [];
    return masterCatalog.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [masterCatalog, searchTerm]);

  const totalPages = Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE);
  const paginatedCatalog = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCatalog.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCatalog, currentPage]);

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
        categories: product.categories || [],
        tags: product.tags || []
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

  const checkIfNew = (approvedAt: any) => {
    if (!approvedAt) return false;
    const approvalDate = approvedAt.toDate ? approvedAt.toDate() : new Date(approvedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - approvalDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 48;
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          < Gem className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">
            Global Product Catalog
          </h1>
        </div>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <CardTitle>Discovery Engine</CardTitle>
                <CardDescription>
                    Browse the SOMA Master Catalog for your next best-selling luxury items.
                </CardDescription>
            </div>
            <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search name or category..." 
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="pl-10 h-10 border-primary/20"
                />
            </div>
          </div>
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
                <div className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Wholesale Cost</TableHead>
                                <TableHead className="text-right">Retail</TableHead>
                                <TableHead className="text-center">Margin</TableHead>
                                <TableHead className="text-center">Stock Level</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {paginatedCatalog.map((product) => {
                            const isSynced = syncedProducts.has(product.id);
                            const isSyncing = syncingProducts.has(product.id);
                            const isNew = checkIfNew(product.approvedAt);
                            const wholesale = product.masterCost || 0;
                            const retail = product.retailPrice || 0;
                            const margin = retail > 0 ? ((retail - wholesale) / retail) * 100 : 0;

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
                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{product.name}</span>
                                            {isNew && (
                                                <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5 animate-pulse">
                                                    <Sparkles className="h-3 w-3 mr-1" /> NEW
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tighter mt-0.5">SKU: {product.id.slice(0, 8)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary/80">
                                        {product.categories?.[0] || 'Luxury'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    ${wholesale.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    ${retail.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className={cn(
                                        "font-bold font-mono text-sm",
                                        margin < 20 ? "text-orange-500" : margin > 40 ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {margin.toFixed(0)}%
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                    variant={
                                        product.stockLevel > 20 ? 'outline' : 'destructive'
                                    }
                                    className={cn(
                                        "text-[10px]",
                                        product.stockLevel > 20 && 'bg-green-600/10 text-green-400 border-green-600/20'
                                    )}
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
                                        className="border-primary/20 hover:border-primary/50"
                                    >
                                        {isSyncing ? <Loader2 className="animate-spin" /> : 'Sync Item'}
                                    </Button>
                                )}
                                </TableCell>
                                </TableRow>
                            )
                            })}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-4">
                            <p className="text-sm text-muted-foreground">
                                Page <span className="font-bold text-foreground">{currentPage}</span> of <span className="font-bold text-foreground">{totalPages}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
