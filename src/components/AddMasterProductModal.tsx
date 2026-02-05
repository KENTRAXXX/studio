'use client';

import { useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
    UploadCloud, 
    X, 
    ImageIcon, 
    Sparkles, 
    Plus,
    Tags,
    Layers,
    TrendingUp
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
  vendorId: z.string().min(1, { message: 'Vendor ID is required.'}),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadState {
    id: string;
    progress: number;
    url?: string;
    isError?: boolean;
}

interface AddMasterProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMasterProductModal({ isOpen, onOpenChange }: AddMasterProductModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      masterCost: 0,
      retailPrice: 0,
      stockLevel: 100,
      vendorId: 'admin',
    },
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

  const handleAIMagic = async () => {
    if (imageGallery.length === 0) {
        toast({ variant: 'destructive', title: 'Asset Missing', description: 'Please upload a primary image first to activate AI Enrichment.' });
        return;
    }

    setIsAnalyzing(true);
    try {
        const result = await analyzeProductImage({ imageUrl: imageGallery[0] });
        
        form.setValue('name', result.suggestedName, { shouldValidate: true });
        form.setValue('description', result.description, { shouldValidate: true });
        setSelectedCategories(result.suggestedCategories);
        setTagsInput(result.suggestedTags.join(', '));

        toast({
            title: 'AI Insights Applied',
            description: 'The master catalog entry has been enriched with executive-grade metadata.',
            action: <Sparkles className="h-4 w-4 text-primary" />
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Magic Failed',
            description: error.message
        });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const uploadToCloudinaryWithProgress = (file: File, id: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'SomaDS';

    if (!cloudName) {
      toast({ variant: 'destructive', title: 'Configuration Error', description: 'Cloudinary Cloud Name is missing.' });
      return;
    }

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
        setUploads(prev => ({
            ...prev,
            [id]: { ...prev[id], isError: true }
        }));
      }
    };

    xhr.onerror = () => {
        setUploads(prev => ({
            ...prev,
            [id]: { ...prev[id], isError: true }
        }));
    };

    xhr.send(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - Object.keys(uploads).length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    filesToUpload.forEach(file => {
        const id = crypto.randomUUID();
        
        setUploads(prev => ({
            ...prev,
            [id]: { id, progress: 0 }
        }));

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
      }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (data: FormValues) => {
    if (!firestore) return;
    if (imageGallery.length === 0) {
        toast({ variant: 'destructive', title: 'Asset Required', description: 'Please upload at least one luxury asset.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      const catalogRef = collection(firestore, 'Master_Catalog');
      
      await addDoc(catalogRef, {
        ...data,
        categories: selectedCategories,
        tags: tags,
        imageId: imageGallery[0],
        imageGallery: imageGallery,
        productType: 'INTERNAL',
        status: 'active',
        createdAt: serverTimestamp()
      });

      toast({
        title: 'Product Deployed!',
        description: `${data.name} is now available in the Master Catalog.`,
      });
      
      onOpenChange(false);
      form.reset();
      setUploads({});
      setImageGallery([]);
      setSelectedCategories([]);
      setTagsInput('');

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
      <DialogContent className="bg-card border-primary sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pr-8">
          <div className="text-center sm:text-left">
            <DialogTitle className="flex items-center justify-center sm:justify-start gap-2 text-primary font-headline text-2xl">
                <Gem className="h-6 w-6" />
                Executive Catalog Entry
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
                Configure a new luxury asset for the global dropshipping network.
            </DialogDescription>
          </div>
          <Button 
            onClick={handleAIMagic} 
            disabled={isAnalyzing}
            className="w-full sm:w-auto btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12"
          >
            {isAnalyzing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI ENRICHMENT
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl><Input placeholder="e.g., 'The Obsidian Chronograph'" {...field} /></FormControl>
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
                            <FormControl><Textarea placeholder="Describe the craftsmanship and appeal..." className="min-h-[100px] resize-none" {...field} /></FormControl>
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
                            placeholder="Limited Edition, Sustainable, Gold..."
                        />
                        <p className="text-[10px] text-muted-foreground uppercase">Comma separated</p>
                    </div>
                </div>

                {/* Right Column: Financials & Assets */}
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="masterCost" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Wholesale ($)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} className="font-mono" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="retailPrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Retail ($)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} className="font-mono" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="stockLevel" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reserve</FormLabel>
                                <FormControl><Input type="number" {...field} className="font-mono" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {watchedRetail > 0 && (
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest">Market Margin</span>
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
                        <Label className="flex items-center gap-2 text-primary/80">
                            <ImageIcon className="h-4 w-4" />
                            Asset Gallery (Max 5)
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

                            {Object.keys(uploads).length < 5 && (
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
                </div>
            </div>
            
            <DialogFooter className="pt-6 border-t border-primary/10">
              <Button 
                type="submit" 
                disabled={isSubmitting || imageGallery.length === 0} 
                className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                {isSubmitting ? (
                    <><Loader2 className="animate-spin mr-2" /> Deploying Luxury Asset...</>
                ) : 'Synchronize Global Catalog'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
