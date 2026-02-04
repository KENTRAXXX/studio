'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Gem,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendActionRequiredEmail } from '@/ai/flows/send-action-required-email';

type CurationProduct = {
  id: string;
  name: string;
  description: string;
  masterCost: number;
  retailPrice: number;
  status: 'pending_review' | 'active' | 'rejected';
  imageUrls?: string[];
  imageUrl?: string;
  vendorId: string;
  submittedAt: any;
  categories: string[];
};

export default function ProductCurationPage() {
  const firestore = useFirestore();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { toast } = useToast();

  // State
  const [selectedProduct, setSelectedProduct] = useState<CurationProduct | null>(null);
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Data Fetching
  const curationQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'Master_Catalog'),
      where('status', '==', 'pending_review'),
      orderBy('submittedAt', 'desc')
    );
  }, [firestore]);

  const { data: pendingItems, loading: dataLoading } = useCollection<CurationProduct>(curationQuery);

  // Calculations
  const getMargin = (retail: number, wholesale: number) => {
    if (retail <= 0) return 0;
    return ((retail - wholesale) / retail) * 100;
  };

  const handleApprove = async (product: CurationProduct) => {
    if (!firestore) return;
    setProcessingId(product.id);

    try {
      const productRef = doc(firestore, 'Master_Catalog', product.id);
      await updateDoc(productRef, {
        status: 'active',
        isActive: true,
        approvedAt: serverTimestamp(),
      });

      toast({
        title: 'Product Activated',
        description: `${product.name} is now visible to all Moguls.`,
      });
      setIsQuickLookOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!firestore || !selectedProduct || !rejectionReason.trim()) return;
    setProcessingId(selectedProduct.id);

    try {
      const productRef = doc(firestore, 'Master_Catalog', selectedProduct.id);
      await updateDoc(productRef, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        rejectedAt: serverTimestamp(),
      });

      // Notification logic
      await sendActionRequiredEmail({
        to: selectedProduct.vendorId, // Assuming vendorId is the email or linked to one
        name: 'SOMA Supplier',
        feedback: rejectionReason.trim(),
      }).catch(console.error);

      toast({
        title: 'Product Rejected',
        description: 'The seller has been notified of the quality concerns.',
      });
      
      setIsRejectModalOpen(false);
      setIsQuickLookOpen(false);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error.message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openQuickLook = (product: CurationProduct) => {
    setSelectedProduct(product);
    setIsQuickLookOpen(true);
  };

  if (profileLoading || dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Analytics */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold font-headline text-primary">
            <Gem className="h-8 w-8" />
            Master Catalog Curation
          </h1>
          <p className="text-muted-foreground mt-1">Review and verify elite product submissions.</p>
        </div>
        <Card className="border-primary/20 bg-primary/5 min-w-[200px]">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary/60">Waiting Review</p>
            <p className="text-4xl font-bold font-mono text-primary mt-1">{pendingItems?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Curation Queue</CardTitle>
          <CardDescription>Click any row to inspect assets and full description.</CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingItems || pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold font-headline">Curation Clear</h3>
              <p className="text-muted-foreground">All pending products have been processed.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Asset</TableHead>
                  <TableHead>Product Details</TableHead>
                  <TableHead>Brand (Vendor)</TableHead>
                  <TableHead className="text-right">Wholesale</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-center">Margin</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.map((product) => {
                  const margin = getMargin(product.retailPrice, product.masterCost);
                  return (
                    <TableRow 
                      key={product.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openQuickLook(product)}
                    >
                      <TableCell>
                        <div className="relative h-14 w-14 rounded-md overflow-hidden border border-border">
                          <Image 
                            src={product.imageUrl || (product.imageUrls && product.imageUrls[0]) || ''} 
                            alt={product.name} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-base">{product.name}</div>
                        <div className="flex gap-1 mt-1">
                          {product.categories?.slice(0, 2).map(cat => (
                            <Badge key={cat} variant="outline" className="text-[10px] py-0">{cat}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">{product.vendorId}</code>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">${product.masterCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">${product.retailPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-mono font-bold text-sm",
                          margin < 20 ? "text-orange-500" : margin > 40 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {margin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Look Modal */}
      <Dialog open={isQuickLookOpen} onOpenChange={setIsQuickLookOpen}>
        <DialogContent className="max-w-4xl bg-card border-primary p-0 overflow-hidden">
          {selectedProduct && (
            <div className="grid md:grid-cols-2">
              {/* Asset Gallery */}
              <div className="bg-muted/30 p-6 space-y-4 border-r border-border">
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20">
                  <Image 
                    src={selectedProduct.imageUrl || (selectedProduct.imageUrls && selectedProduct.imageUrls[0]) || ''} 
                    alt="Primary asset" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.imageUrls?.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border">
                      <Image src={url} alt={`View ${i+1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Panel */}
              <div className="p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <DialogHeader className="p-0">
                    <DialogTitle className="text-3xl font-headline font-bold text-primary">{selectedProduct.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">Vendor: {selectedProduct.vendorId.slice(0, 8)}...</Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {getMargin(selectedProduct.retailPrice, selectedProduct.masterCost).toFixed(1)}% Margin
                      </Badge>
                    </div>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                    <p className="text-sm leading-relaxed text-foreground/80">{selectedProduct.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                    <div>
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Wholesale</Label>
                      <p className="text-xl font-mono font-bold">${selectedProduct.masterCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Retail</Label>
                      <p className="text-xl font-mono font-bold text-primary">${selectedProduct.retailPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-8">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={processingId !== null}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject Submission
                  </Button>
                  <Button 
                    className="flex-1 btn-gold-glow bg-primary hover:bg-primary/90"
                    onClick={() => handleApprove(selectedProduct)}
                    disabled={processingId !== null}
                  >
                    {processingId === selectedProduct.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve & Go Live
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="bg-card border-destructive">
          <DialogHeader>
            <DialogTitle className="text-destructive font-headline">Provide Rejection Reason</DialogTitle>
            <DialogDescription>
              Explain to the seller why this product does not meet SOMA standards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea 
                id="reason"
                placeholder="e.g., 'Hero image quality is below luxury standards. Please provide high-res 1:1 photography.'"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId !== null}
            >
              {processingId ? <Loader2 className="animate-spin" /> : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
