'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useUserProfile } from '@/firebase';
import { doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    Tags,
    X,
    Plus,
    ImageIcon,
    Palette,
    AlertCircle,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeProductImage } from '@/ai/flows/analyze-product-image';
import Link from 'next/link';

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

const MAX_IMAGES = 10;

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

interface UploadState {
    id: string;
    progress: number;
    url?: string;
    isError?: boolean;
}

type ColorOption = {
    name: string;
    imageUrl: string;
};

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
    colorOptions?: ColorOption[];
    vendorId: string;
    categories?: string[];
    tags?: string[];
  };
}

export function EditMasterProductModal({ isOpen, onOpenChange, product }: EditMasterProductModalProps) {
  const { user } = useUser();
  const { userProfile } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);

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

  const isUploading = useMemo(() => 
    Object.values(uploads).some(u => u.progress < 100 && !u.isError),
    [uploads]
  );

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
      setImageGallery(product.imageGallery || [product.imageId]);
      setColorOptions(product.colorOptions || []);
      
      const initialUploads: Record<string, UploadState> = {};
      (product.imageGallery || [product.imageId]).forEach(url => {
          const id = crypto.randomUUID();
          initialUploads[id] = { id, url, progress: 100 };
      });
      setUploads(initialUploads);
    }
  }, [product, form]);

  const handleAIMagic = async () => {
    const primaryImage = imageGallery[0] || form.getValues('imageId');
    if (!primaryImage) {
        toast({ variant: 'destructive', title: 'Asset Missing', description: 'Photo required for AI analysis.' });
        return;
    }

    if (!user || !firestore) return;

    const currentCredits = userProfile?.aiCredits ?? 0;
    if (currentCredits <= 0 && userProfile?.userRole !== 'ADMIN') {
        setShowCreditModal(true);
        return;
    }

    setIsAnalyzing(true);
    try {
        const userRef = doc(firestore, 'users', user.uid);
        if (userProfile?.userRole !== 'ADMIN') {
            updateDoc(userRef, { aiCredits: increment(-1) }).catch(console.error);
        }

        const result = await analyzeProductImage({ imageUrl: primaryImage });
        
        form.setValue('name', result.suggestedName, { shouldValidate: true });
        form.setValue('description', result.description, { shouldValidate: true });
        setSelectedCategories(result.suggestedCategories);
        setTagsInput(result.suggestedTags.join(', '));

        toast({
            title: 'AI REFRESH COMPLETE',
            description: 'Registry enriched with updated metadata.',
            action: <Sparkles className="h-4 w-4 text-primary" />
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'AI Offline', description: error.message });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const uploadToCloudinaryWithProgress = (file: File, id: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'SomaDS';

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploads(prev => ({
            ...prev,
            [id]: { ...prev[id], progress }
        }));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const secureUrl = response.secure_url;
        setUploads(prev => ({
            ...prev,
            [id]: { ...prev[id], url: secureUrl, progress: 100 }
        }));
        setImageGallery(prev => [...prev, secureUrl]);
      } else {
        setUploads(prev => ({ ...prev, [id]: { ...prev[id], isError: true } }));
      }
    };

    xhr.onerror = () => {
        setUploads(prev => ({ ...prev, [id]: { ...prev[id], isError: true } }));
    };

    xhr.send(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_IMAGES - Object.keys(uploads).length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    filesToUpload.forEach(file => {
        const id = crypto.randomUUID();
        setUploads(prev => ({ ...prev, [id]: { id, progress: 0 } }));
        uploadToCloudinaryWithProgress(file, id);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeUpload = (id: string, url?: string) => {
      setUploads(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
      });
      if (url) {
          setImageGallery(prev => prev.filter(u => u !== url));
          setColorOptions(prev => prev.filter(opt => opt.imageUrl !== url));
      }
  };

  const addColorOption = () => {
      setColorOptions(prev => [...prev, { name: '', imageUrl: imageGallery[0] || '' }]);
  };

  const removeColorOption = (index: number) => {
      setColorOptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateColorOption = (index: number, updates: Partial<ColorOption>) => {
      setColorOptions(prev => prev.map((opt, i) => i === index ? { ...opt, ...updates } : opt));
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
          colorOptions: colorOptions.filter(opt => opt.name && opt.imageUrl),
          imageGallery: imageGallery,
          imageId: imageGallery[0] || data.imageId
      });

      toast({
        title: 'Registry Updated',
        description: `${data.name} metadata synchronized.`,
      });
      onOpenChange(false);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
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
            description: `${product.name} removed from registry.`,
        });
        onOpenChange(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      } finally {
        setIsDeleting(false);
      }
  }

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
                Your strategic AI allocation has been exhausted. Upgrade to Enterprise for a larger monthly block or purchase additional high-fidelity credits.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowCreditModal(false)} className="w-full sm:w-auto border-white/10">
              Dismiss
            </Button>
            <Button asChild className="w-full sm:w-auto btn-gold-glow bg-primary font-bold">
              <Link href="/plan-selection">
                <CreditCard className="mr-2 h-4 w-4" /> Upgrade to Enterprise
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pr-8">
          <div className="text-center sm:text-left">
            <DialogTitle className="flex items-center justify-center sm:justify-start gap-2 text-primary font-headline text-2xl">
                <Gem className="h-6 w-6" />
                Registry Editor
            </DialogTitle>
            <DialogDescription>
                Synchronize strategic metadata for this luxury asset.
            </DialogDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button 
                onClick={handleAIMagic} 
                disabled={isAnalyzing}
                className="w-full sm:w-auto btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12"
            >
                {isAnalyzing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI REFRESH
            </Button>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-2">
                Credits: {userProfile?.userRole === 'ADMIN' ? 'Unlimited' : userProfile?.aiCredits ?? 0}
            </p>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
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
                        <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            <Layers className="h-3" /> Categorization
                        </Label>
                        <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-primary/10 bg-muted/10">
                            {AVAILABLE_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggleCategory(cat)}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all border",
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

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-primary font-bold">
                                <Palette className="h-4 w-4" />
                                Master Color Palette
                            </Label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addColorOption}
                                className="h-8 border-primary/20"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add Color
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {colorOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                    <Input 
                                        placeholder="Color Name" 
                                        value={opt.name}
                                        onChange={(e) => updateColorOption(idx, { name: e.target.value })}
                                        className="h-10 bg-background flex-1"
                                    />
                                    <div className="w-[160px]">
                                        <Select 
                                            value={opt.imageUrl} 
                                            onValueChange={(val) => updateColorOption(idx, { imageUrl: val })}
                                        >
                                            <SelectTrigger className="h-10 bg-background">
                                                <SelectValue placeholder="Asset" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-primary/20">
                                                {imageGallery.map((url, i) => (
                                                    <SelectItem key={i} value={url}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative h-6 w-6 rounded overflow-hidden">
                                                                <img src={url} className="h-full w-full object-cover" />
                                                            </div>
                                                            <span className="text-[10px]">Photo {i+1}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeColorOption(idx)}
                                        className="h-10 w-10 text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
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
                                <span className="text-xs font-bold uppercase">Market Margin</span>
                            </div>
                            <span className={cn(
                                "text-2xl font-bold font-mono",
                                margin < 20 ? "text-orange-500" : margin > 40 ? "text-primary" : "text-slate-200"
                            )}>
                                {margin.toFixed(1)}%
                            </span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-primary/80 uppercase tracking-widest text-[10px] font-black">
                            <ImageIcon className="h-4" />
                            Asset Gallery (Max {MAX_IMAGES})
                        </Label>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            <AnimatePresence>
                                {Object.entries(uploads).map(([id, upload]) => (
                                    <motion.div 
                                        key={id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="relative aspect-square rounded-lg overflow-hidden border border-primary/20 bg-slate-900/50 group"
                                    >
                                        {upload.url ? (
                                            <>
                                                <img src={upload.url} alt="Upload" className="h-full w-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeUpload(id, upload.url)}
                                                    className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-2 w-2" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center p-1">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary opacity-40" />
                                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-primary">
                                                    {upload.progress}%
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {Object.keys(uploads).length < MAX_IMAGES && (
                                <div 
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 cursor-pointer flex flex-col items-center justify-center transition-all"
                                >
                                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-primary/40" /> : <Plus className="h-5 w-5 text-primary/40" />}
                                    <span className="text-[8px] font-black uppercase text-primary/40 mt-1">Upload</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            <Tags className="h-3 w-3" /> Search Tags
                        </Label>
                        <Input 
                            value={tagsInput} 
                            onChange={(e) => setTagsInput(e.target.value)} 
                            placeholder="Comma separated..."
                        />
                    </div>
                </div>
            </div>
            
            <DialogFooter className="pt-6 border-t border-primary/10 flex flex-col sm:flex-row justify-between w-full gap-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button" className="h-12 px-6 w-full sm:w-auto">
                            <Trash2 className="mr-2 h-4 w-4"/> Liquidate Asset
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-destructive">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline text-destructive">Verify Liquidation</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                                Permanent removal from Master Catalog. All clones will lose access.
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

                <Button type="submit" disabled={isSubmitting || isUploading} className="w-full sm:w-auto btn-gold-glow bg-primary h-12 font-bold px-8">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Synchronize Global Catalog'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
