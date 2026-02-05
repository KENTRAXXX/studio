'use client';

import { useEffect, useState, useMemo } from 'react';
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
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, 
    Gem, 
    Trash2, 
    Sparkles, 
    TrendingUp, 
    Layers, 
    Tags 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeProductImage } from '@/ai/flows/analyze-product-image';

const AVAILABLE_CATEGORIES = [
    "Watches", 
    "Leather Goods", 
    "Jewelry", 
    "Fragrance", 
    "Apparel", 
    "Accessories", 
    "Home Decor", 
    "Electronics",
    "Fine Art",
    "Spirits & Wine",
    "Travel Gear",
    "Beauty & Skincare",
    "Wellness",
    "Collectibles",
    "Automotive",
    "Gourmet Food",
    "Furniture",
    "Digital Assets"
];

const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  masterCost: z.coerce.number().positive({ message: 'Cost must be a positive number.' }),
  retailPrice: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  stockLevel: z.coerce.number().int().min(0, { message: 'Stock cannot be negative.' }),
  imageId: z.string().min(1, { message: 'Primary asset identifier is required.' }),
  vendorId: z.string().min(1, { message: 'Vendor ID is required.'}),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMasterProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    description?: string;
    masterCost: number;
    retailPrice: number;
    stockLevel: number;
    imageId: string;
    imageGallery?: string[];
    vendorId: string;
    categories?: string[];
    tags?: string[];
  };
}

export function EditMasterProductModal({ isOpen, onOpenChange, product }: EditMasterProductModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const watchedWholesale = form.watch('masterCost');
  const watchedRetail = form.watch('retailPrice');

  const margin = useMemo(() => {
    if (!watchedRetail || watchedRetail <= 0) return 0;
    return ((watchedRetail - watchedWholesale) / watchedRetail) * 100;
  }, [watchedWholesale, watchedRetail]);

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || '',
        masterCost: product.masterCost,
        retailPrice: product.retailPrice,
        stockLevel: product.stockLevel,
        imageId: product.imageId,
        vendorId: product.vendorId,
      });
      setSelectedCategories(product.categories || []);
      setTagsInput(product.tags?.join(', ') || '');
    }
  }, [product, form]);

  const handleAIMagic = async () => {
    const currentImage = form.getValues('imageId');
    if (!currentImage) {
        toast({ variant: 'destructive', title: 'Asset Missing', description: 'Cannot analyze a product without a primary image.' });
        return;
    }

    setIsAnalyzing(true);
    try {
        const result = await analyzeProductImage({ imageUrl: currentImage });
        
        form.setValue('name', result.suggestedName, { shouldValidate: true });
        form.setValue('description', result.description, { shouldValidate: true });
        setSelectedCategories(result.suggestedCategories);
        setTagsInput(result.suggestedTags.join(', '));

        toast({
            title: 'Intelligence Synchronized',
            description: 'Luxury metadata has been auto-generated for this asset.',
            action: <Sparkles className="h-4 w-4 text-primary" />
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'AI Offline', description: error.message });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (data: FormValues) => {
    if (!firestore) return;
    
    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      const productRef = doc(firestore, 'Master_Catalog', product.id);
      
      await updateDoc(productRef, {
          ...data,
          categories: selectedCategories,
          tags: tags,
      });

      toast({
        title: 'Registry Updated',
        description: `${data.name} metadata has been synchronized.`,
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
            title: 'Asset Liquidated',
            description: `${product.name} has been removed from the registry.`,
        });
        onOpenChange(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      } finally {
        setIsDeleting(false);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <div>
            <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl">
                <Gem className="h-6 w-6" />
                Registry Editor
            </DialogTitle>
            <DialogDescription>
                Modify strategic metadata for this global catalog asset.
            </DialogDescription>
          </div>
          <Button 
            onClick={handleAIMagic} 
            disabled={isAnalyzing}
            className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black hidden sm:flex h-12"
          >
            {isAnalyzing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI REFRESH
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Metadata */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="vendorId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor ID</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Luxury Narrative</FormLabel>
                            <FormControl><Textarea className="min-h-[120px] resize-none" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            Categories
                        </Label>
                        <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-primary/10 bg-muted/10">
                            {AVAILABLE_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggleCategory(cat)}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all border",
                                        selectedCategories.includes(cat) 
                                            ? "bg-primary text-primary-foreground border-primary" 
                                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Tags className="h-4 w-4 text-primary" />
                            Search Tags
                        </Label>
                        <Input 
                            value={tagsInput} 
                            onChange={(e) => setTagsInput(e.target.value)} 
                            placeholder="Comma separated..."
                        />
                    </div>
                </div>

                {/* Right: Technicals */}
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="masterCost" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Wholesale ($)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="retailPrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Retail ($)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="stockLevel" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reserve</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {watchedRetail > 0 && (
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest">Calculated Margin</span>
                            </div>
                            <span className={cn(
                                "text-2xl font-bold font-mono",
                                margin < 20 ? "text-orange-500" : margin > 40 ? "text-primary" : "text-slate-200"
                            )}>
                                {margin.toFixed(1)}%
                            </span>
                        </div>
                    )}

                    <FormField control={form.control} name="imageId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primary Image ID/URL</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormDescription className="text-[10px]">Updating this URL will refresh the AI analysis source.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </div>
            
            <DialogFooter className="pt-6 border-t border-primary/10 flex justify-between w-full">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button" className="h-12 px-6">
                            <Trash2 className="mr-2 h-4 w-4"/> Liquidate Asset
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-destructive">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline text-destructive">Verify Liquidation</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                                This will permanently remove the product from the master catalog. Synced boutiques will lose access to this SKU.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive">
                                {isDeleting ? <Loader2 className="animate-spin" /> : 'Confirm Liquidation'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button type="submit" disabled={isSubmitting} className="btn-gold-glow bg-primary h-12 font-bold px-8">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Synchronize Registry'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
