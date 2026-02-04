
'use client';

import {
  collection,
  query,
  where,
  writeBatch,
  doc,
  addDoc,
} from 'firebase/firestore';
import { useCollection, useFirestore, useUserProfile } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, X, Tags, Layers, Package } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { PendingProduct } from '@/lib/types';
import SomaLogo from '@/components/logo';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApprovalQueuePage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  
  const pendingProductsRef = firestore ? collection(firestore, 'Pending_Master_Catalog') : null;
  const q = pendingProductsRef ? query(pendingProductsRef, where('isApproved', '==', false)) : null;
  const { data: pendingProducts, loading: productsLoading } = useCollection<PendingProduct>(q);

  useEffect(() => {
    if (!profileLoading) {
      if (!userProfile || userProfile.userRole !== 'ADMIN') {
        router.push('/access-denied');
      }
    }
  }, [userProfile, profileLoading, router]);

  const handleDecision = async (product: PendingProduct, decision: 'approve' | 'reject') => {
    if (!firestore) return;

    const batch = writeBatch(firestore);
    const pendingDocRef = doc(firestore, 'Pending_Master_Catalog', product.id);

    if (decision === 'approve') {
      const masterCatalogRef = collection(firestore, 'Master_Catalog');
      const newMasterProductRef = doc(masterCatalogRef); 
      
      batch.set(newMasterProductRef, {
        name: product.productName,
        description: product.description,
        masterCost: product.wholesalePrice,
        retailPrice: product.suggestedRetailPrice,
        stockLevel: product.stockLevel || 0, 
        imageId: product.imageUrl, 
        vendorId: product.vendorId,
        productType: 'EXTERNAL',
        categories: product.categories || [],
        tags: product.tags || [],
        isActive: true,
        createdAt: new Date().toISOString()
      });
      
      batch.update(pendingDocRef, { isApproved: 'approved' });

      toast({
        title: 'Product Approved',
        description: `${product.productName} has been synced to the Master Catalog.`,
      });

    } else { 
      batch.update(pendingDocRef, { isApproved: 'rejected' });
       toast({
        variant: 'destructive',
        title: 'Product Rejected',
        description: `${product.productName} has been rejected and will not be listed.`,
      });
    }

    try {
      await batch.commit();
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };
  
  const isLoading = productsLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
        <div className="text-center mb-10">
            <SomaLogo className="h-12 w-12 mx-auto" />
            <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Admin Approval Queue</h1>
            <p className="mt-2 text-lg text-muted-foreground">Review and approve new supplier products.</p>
        </div>

        <Card className="w-full max-w-6xl border-primary/50">
            <CardHeader>
                <CardTitle>Pending Submissions</CardTitle>
                <CardDescription>
                    {productsLoading ? 'Loading products...' : `There are ${pendingProducts?.length || 0} products awaiting your review.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {productsLoading ? (
                    <div className="flex h-64 w-full items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : !pendingProducts || pendingProducts.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-center">
                        <p className="text-muted-foreground">The approval queue is empty.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Image</TableHead>
                                <TableHead>Product Details</TableHead>
                                <TableHead>Categories & Tags</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Wholesale</TableHead>
                                <TableHead className="text-right">Retail</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                                            <Image 
                                                src={product.imageUrl} 
                                                alt={product.productName}
                                                fill
                                                className="object-cover"
                                                data-ai-hint="product photo"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-lg">{product.productName}</div>
                                        <div className="text-xs text-muted-foreground font-mono mt-1">Vendor: {product.vendorId}</div>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{product.description}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {product.categories?.map(cat => (
                                                <Badge key={cat} variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20">
                                                    <Layers className="h-3 w-3 mr-1" /> {cat}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {product.tags?.map(tag => (
                                                <Badge key={tag} variant="outline" className="text-[10px] h-5">
                                                    <Tags className="h-3 w-3 mr-1" /> {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="font-mono">
                                            <Package className="h-3 w-3 mr-1" />
                                            {product.stockLevel || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">${product.wholesalePrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">${product.suggestedRetailPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-center space-x-2">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision(product, 'approve')}>
                                            <Check className="mr-2 h-4 w-4"/> Approve
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDecision(product, 'reject')}>
                                            <X className="mr-2 h-4 w-4"/> Reject
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
