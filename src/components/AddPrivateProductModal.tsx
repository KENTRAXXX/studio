'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { analyzeProductImage } from '@/ai/flows/analyze-product-image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackagePlus, Sparkles, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  stock: z.coerce.number().int().min(0, { message: 'Stock cannot be negative.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddPrivateProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPrivateProductModal({ isOpen, onOpenChange }: AddPrivateProductModalProps) {
  const { user } = useUser();
  const { userProfile } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
    },
  });

  const handleEnrichment = async () => {
    const imageUrl = form.getValues('imageUrl');
    if (!imageUrl || !imageUrl.startsWith('http')) {
        toast({ variant: 'destructive', title: 'Asset Missing', description: 'Enter a valid image URL first to use AI enrichment.' });
        return;
    }

    if (!user) return;

    setIsAnalyzing(true);
    try {
        const result = await analyzeProductImage({ 
            imageUrl, 
            userId: user.uid,
            tier: userProfile?.planTier 
        });
        form.setValue('name', result.suggestedName, { shouldValidate: true });
        form.setValue('description', result.description, { shouldValidate: true });
        toast({ title: 'AI ENRICHMENT COMPLETE', description: 'Product metadata enriched from visual analysis.' });
    } catch (e: any) {
        if (e.message.includes('exhausted') || e.message.includes('INSUFFICIENT_CREDITS')) {
            setShowCreditModal(true);
        } else {
            toast({ variant: 'destructive', title: 'AI Error', description: e.message });
        }
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (data: FormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add a product.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const productsRef = collection(firestore, 'stores', user.uid, 'products');
      await addDoc(productsRef, {
        name: data.name,
        description: data.description,
        suggestedRetailPrice: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        isManagedBySoma: false,
        wholesalePrice: 0, 
        vendorId: user.uid,
        productType: 'INTERNAL',
      });

      toast({
        title: 'Product Added!',
        description: `${data.name} has been added to your private inventory.`,
      });
      onOpenChange(false);
      form.reset();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent className="bg-card border-destructive z-[60]">
          <DialogHeader>
            <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-bold font-headline text-destructive text-center">
                Credit Limit Reached
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
                Your strategic AI allocation has been exhausted. Upgrade your plan or purchase an additional credit block in Store Settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowCreditModal(false)} className="w-full sm:w-auto border-white/10">
              Dismiss
            </Button>
            <Button asChild className="w-full sm:w-auto btn-gold-glow bg-primary font-bold">
              <Link href="/dashboard/settings">
                <CreditCard className="mr-2 h-4 w-4" /> Purchase Credits
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-primary font-headline">
                <PackagePlus className="h-6 w-6" />
                Add Private Product
            </DialogTitle>
            <DialogDescription>
                Enter details for your private luxury stock.
            </DialogDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                className="border-primary/30 text-primary h-10"
                onClick={handleEnrichment}
                disabled={isAnalyzing}
            >
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                AI ENRICHMENT
            </Button>
            <p className="text-[9px] font-mono text-muted-foreground uppercase">
                Credits: {userProfile?.userRole === 'ADMIN' ? '∞' : userProfile?.aiCredits ?? 0}
            </p>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Primary Image URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., 'The Olympian Chronograph'" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe your product..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Retail Price ($)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="650.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Deploy to Warehouse'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}