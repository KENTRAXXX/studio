'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
import { Loader2, PackagePlus, Sparkles } from 'lucide-react';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleRefresh = async () => {
    const imageUrl = form.getValues('imageUrl');
    if (!imageUrl || !imageUrl.startsWith('http')) {
        toast({ variant: 'destructive', title: 'Asset Missing', description: 'A valid image URL is required for AI refresh.' });
        return;
    }

    setIsAnalyzing(true);
    try {
        const result = await analyzeProductImage({ imageUrl });
        form.setValue('name', result.suggestedName, { shouldValidate: true });
        form.setValue('description', result.description, { shouldValidate: true });
        toast({ title: 'Metadata Refreshed', description: 'AI has updated the product identity based on the current asset.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Refresh Failed', description: e.message });
    } finally {
        setIsAnalyzing(false);
    }
  };

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
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-primary font-headline">
                <PackagePlus className="h-6 w-6" />
                Edit Private Product
            </DialogTitle>
            <DialogDescription>
                Synchronize changes to your local inventory.
            </DialogDescription>
          </div>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="border-primary/30 text-primary h-10"
            onClick={handleRefresh}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            AI Refresh
          </Button>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Asset URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Retail Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Synchronize Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
