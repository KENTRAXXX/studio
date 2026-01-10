'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
import { Loader2, PackagePlus } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  stock: z.coerce.number().int().min(0, { message: 'Stock cannot be negative.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPrivateProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    description: string;
    suggestedRetailPrice: number;
    stock: number;
    imageUrl: string;
  };
}

export function EditPrivateProductModal({ isOpen, onOpenChange, product }: EditPrivateProductModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.suggestedRetailPrice,
        stock: product.stock,
        imageUrl: product.imageUrl,
      });
    }
  }, [product, form]);

  const handleSubmit = async (data: FormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication error.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const productRef = doc(firestore, 'stores', user.uid, 'products', product.id);
      await updateDoc(productRef, {
        name: data.name,
        description: data.description,
        suggestedRetailPrice: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-headline">
            <PackagePlus className="h-6 w-6" />
            Edit Product
          </DialogTitle>
          <DialogDescription>
            Update the details for your private product.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Retail Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
             <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
