'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

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
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gem } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  masterCost: z.coerce.number().positive({ message: 'Cost must be a positive number.' }),
  retailPrice: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  stockLevel: z.coerce.number().int().min(0, { message: 'Stock cannot be negative.' }),
  imageId: z.string().min(1, { message: 'Primary image ID is required.' }),
  imageGallery: z.string().optional().describe('Comma-separated list of additional image URLs or IDs.'),
  vendorId: z.string().min(1, { message: 'Vendor ID is required.'}),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMasterProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMasterProductModal({ isOpen, onOpenChange }: AddMasterProductModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      masterCost: 0,
      retailPrice: 0,
      stockLevel: 100,
      imageId: '',
      imageGallery: '',
      vendorId: 'admin',
    },
  });

  const handleSubmit = async (data: FormValues) => {
    if (!firestore) return;
    
    setIsSubmitting(true);
    try {
      const gallery = data.imageGallery 
        ? data.imageGallery.split(',').map(s => s.trim()).filter(s => !!s)
        : [];

      const catalogRef = collection(firestore, 'Master_Catalog');
      await addDoc(catalogRef, {
        ...data,
        imageGallery: [data.imageId, ...gallery],
        productType: 'INTERNAL',
        status: 'active',
        createdAt: new Date().toISOString()
      });

      toast({
        title: 'Product Added!',
        description: `${data.name} has been added to the Master Catalog.`,
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-headline">
            <Gem className="h-6 w-6" />
            Add to Master Catalog
          </DialogTitle>
          <DialogDescription>
            Enter details for a new globally-available product.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., 'The Olympian Chronograph'" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="masterCost" render={({ field }) => (
                    <FormItem><FormLabel>Master Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="250.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="retailPrice" render={({ field }) => (
                    <FormItem><FormLabel>Suggested Retail ($)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="650.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="stockLevel" render={({ field }) => (
                    <FormItem><FormLabel>Stock Level</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imageId" render={({ field }) => (
                    <FormItem><FormLabel>Primary Image ID/URL</FormLabel><FormControl><Input placeholder="e.g. product-1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
             <FormField control={form.control} name="imageGallery" render={({ field }) => (
                <FormItem>
                    <FormLabel>Additional Gallery Images</FormLabel>
                    <FormControl><Input placeholder="URL1, URL2, URL3" {...field} /></FormControl>
                    <FormDescription>Comma-separated URLs or IDs.</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="vendorId" render={({ field }) => (
                <FormItem><FormLabel>Vendor ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full btn-gold-glow bg-primary h-12 font-bold">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add to Catalog'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
