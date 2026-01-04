'use client';

import {
  collection,
  query,
  where,
  writeBatch,
  doc,
  addDoc,
} from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { PendingProduct } from '@/lib/types';
import SomaLogo from '@/components/logo';

export default function ApprovalQueuePage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const pendingProductsRef = firestore ? collection(firestore, 'Pending_Master_Catalog') : null;
  const q = pendingProductsRef ? query(pendingProductsRef, where('isApproved', '==', false)) : null;
  const { data: pendingProducts, loading: productsLoading } = useCollection<PendingProduct>(q);

  const handleDecision = async (product: PendingProduct, decision: 'approve' | 'reject') => {
    if (!firestore) return;

    const batch = writeBatch(firestore);
    const pendingDocRef = doc(firestore, 'Pending_Master_Catalog', product.id);

    if (decision === 'approve') {
      const masterCatalogRef = collection(firestore, 'Master_Catalog');
      
      // We create a new doc in Master_Catalog
      const newMasterProductRef = doc(masterCatalogRef); 
      batch.set(newMasterProductRef, {
        name: product.productName,
        masterCost: product.wholesalePrice,
        retailPrice: product.suggestedRetailPrice,
        stockLevel: 100, // Default stock level
        imageId: product.imageUrl, // Assuming imageId can be derived from imageUrl or stored directly
        vendorId: product.vendorId,
        productType: 'EXTERNAL',
      });
      
      batch.update(pendingDocRef, { isApproved: 'approved' });

      toast({
        title: 'Product Approved',
        description: `${product.productName} has been synced to the Master Catalog.`,
      });

    } else { // Reject
      batch.update(pendingDocRef, { isApproved: 'rejected' });
       toast({
        variant: 'destructive',
        title: 'Product Rejected',
        description: `${product.productName} has been rejected and will not be listed.`,
      });
    }

    try {
      await batch.commit();
      // The onSnapshot listener in useCollection will auto-update the UI
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

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
                                <TableHead>Product Name</TableHead>
                                <TableHead>Seller ID</TableHead>
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
                                    <TableCell className="font-medium">{product.productName}</TableCell>
                                    <TableCell className="font-mono text-xs">{product.vendorId}</TableCell>
                                    <TableCell className="text-right font-mono">${product.wholesalePrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">${product.suggestedRetailPrice.toFixed(2)}</TableCell>
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
