'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
import { Loader2, Gem, Trash2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  masterCost: z.coerce.number().positive({ message: 'Cost must be a positive number.' }),
  retailPrice: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  stockLevel: z.coerce.number().int().min(0, { message: 'Stock cannot be negative.' }),
  imageId: z.string().min(1, { message: 'Please enter a valid image ID.' }),
  imageGallery: z.string().optional(),
  vendorId: z.string().min(1, { message: 'Vendor ID is required.'}),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMasterProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    masterCost: number;
    retailPrice: number;
    stockLevel: number;
    imageId: string;
    imageGallery?: string[];
    vendorId: string;
  };
}

export function EditMasterProductModal({ isOpen, onOpenChange, product }: EditMasterProductModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        masterCost: product.masterCost,
        retailPrice: product.retailPrice,
        stockLevel: product.stockLevel,
        imageId: product.imageId,
        imageGallery: product.imageGallery?.join(', ') || '',
        vendorId: product.vendorId,
      });
    }
  }, [product, form]);

  const handleSubmit = async (data: FormValues) => {
    if (!firestore) return;
    
    setIsSubmitting(true);
    try {
      const gallery = data.imageGallery 
        ? data.imageGallery.split(',').map(s => s.trim()).filter(s => !!s)
        : [];

      const productRef = doc(firestore, 'Master_Catalog', product.id);
      await updateDoc(productRef, {
          ...data,
          imageGallery: gallery
      });

      toast({
        title: 'Product Updated!',
        description: `${data.name} has been successfully updated.`,
      });
      onOpenChange(false);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
      if (!firestore) return;
      setIsDeleting(true);
      try {
        await deleteDoc(doc(firestore, 'Master_Catalog', product.id));
        toast({
            title: 'Product Deleted',
            description: `${product.name} has been removed from the catalog.`,
        });
        onOpenChange(false);
      } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message,
        })
      } finally {
        setIsDeleting(false);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-headline">
            <Gem className="h-6 w-6" />
            Edit Master Product
          </DialogTitle>
          <DialogDescription>
            Modify the details for this global product.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="masterCost" render={({ field }) => (
                    <FormItem><FormLabel>Master Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="retailPrice" render={({ field }) => (
                    <FormItem><FormLabel>Suggested Retail ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="stockLevel" render={({ field }) => (
                    <FormItem><FormLabel>Stock Level</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imageId" render={({ field }) => (
                    <FormItem><FormLabel>Primary Image ID/URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
             <FormField control={form.control} name="imageGallery" render={({ field }) => (
                <FormItem>
                    <FormLabel>Gallery Images</FormLabel>
                    <FormControl><Input placeholder="URL1, URL2, URL3" {...field} /></FormControl>
                    <FormDescription>Comma-separated list of asset identifiers.</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="vendorId" render={({ field }) => (
                <FormItem><FormLabel>Vendor ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <DialogFooter className="pt-4 flex justify-between w-full">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button">
                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-destructive">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                                This action cannot be undone. This will permanently delete the product from the Master Catalog.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                {isDeleting ? <Loader2 className="animate-spin" /> : 'Yes, delete it'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button type="submit" disabled={isSubmitting} className="btn-gold-glow bg-primary h-12 font-bold px-8">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
