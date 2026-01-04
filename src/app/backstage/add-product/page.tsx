'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackagePlus, CheckCircle2, UploadCloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SomaLogo from '@/components/logo';

export default function AddProductPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a product.' });
      return;
    }
    
    if (parseFloat(wholesalePrice) >= parseFloat(suggestedRetailPrice)) {
      toast({ variant: 'destructive', title: 'Pricing Error', description: 'Suggested Retail Price must be greater than Wholesale Price.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const pendingCatalogRef = collection(firestore, 'Pending_Master_Catalog');
      await addDoc(pendingCatalogRef, {
        productName,
        description,
        imageUrl,
        wholesalePrice: parseFloat(wholesalePrice),
        suggestedRetailPrice: parseFloat(suggestedRetailPrice),
        vendorId: user.uid,
        isApproved: false,
        submittedAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (userLoading) {
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
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Supplier Submission</h1>
        <p className="mt-2 text-lg text-muted-foreground">Add a new product to the SOMA Master Catalog.</p>
      </div>

      <Card className="w-full max-w-3xl border-primary/50">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 text-center"
            >
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold font-headline text-primary">Product Submitted</h2>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                    Product submitted for luxury review. Our team will notify you once it is live in the Master Catalog.
                </p>
                <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-8">Submit Another Product</Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PackagePlus className="h-6 w-6"/>
                    New Product Details
                </CardTitle>
                <CardDescription>
                  Your product will be reviewed by our curation team before being added to the global catalog.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} required placeholder="e.g., 'The Olympian Chronograph'"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Product Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe the key features and luxury appeal of your product."/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="image-url">Product Image URL</Label>
                        <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required placeholder="https://your-cdn.com/path/to/high-quality-image.jpg"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="wholesale-price">Your Wholesale Price ($)</Label>
                            <Input id="wholesale-price" type="number" step="0.01" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} required placeholder="250.00"/>
                             <p className="text-xs text-muted-foreground">The amount you receive per sale.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="retail-price">Suggested Retail Price ($)</Label>
                            <Input id="retail-price" type="number" step="0.01" value={suggestedRetailPrice} onChange={(e) => setSuggestedRetailPrice(e.target.value)} required placeholder="650.00"/>
                            <p className="text-xs text-muted-foreground">The price store owners will list it for.</p>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting} size="lg" className="h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit for Review'}
                        </Button>
                    </div>
                </form>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
