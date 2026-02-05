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
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, 
    Gem, 
    UploadCloud, 
    X, 
    CheckCircle2, 
    ImageIcon, 
    Sparkles, 
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
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
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [imageGallery, setImageGallery] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      masterCost: 0,
      retailPrice: 0,
      stockLevel: 100,
      vendorId: 'admin',
    },
  });

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
        const reader = new FileReader();
        
        // Optimistic UI: show a placeholder if possible or just the state
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

  const handleSubmit = async (data: FormValues) => {
    if (!firestore) return;
    if (imageGallery.length === 0) {
        toast({ variant: 'destructive', title: 'Asset Required', description: 'Please upload at least one luxury asset.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const catalogRef = collection(firestore, 'Master_Catalog');
      await addDoc(catalogRef, {
        ...data,
        imageId: imageGallery[0], // First image is primary
        imageGallery: imageGallery,
        productType: 'INTERNAL',
        status: 'active',
        createdAt: serverTimestamp()
      });

      toast({
        title: 'Product Deployed!',
        description: `${data.name} is now available in the Master Catalog.`,
      });
      
      // Cleanup
      onOpenChange(false);
      form.reset();
      setUploads({});
      setImageGallery([]);

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
      <DialogContent className="bg-card border-primary sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl">
            <Gem className="h-6 w-6" />
            Executive Catalog Entry
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure a new luxury asset for the global dropshipping network.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Product Designation</FormLabel>
                        <FormControl><Input placeholder="e.g., 'The Olympian Chronograph'" {...field} className="h-11" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="vendorId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Vendor Authority</FormLabel>
                        <FormControl><Input {...field} className="h-11" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-3 gap-4">
                 <FormField control={form.control} name="masterCost" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Wholesale ($)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="250.00" {...field} className="h-11 font-mono" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="retailPrice" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rec. Retail ($)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="650.00" {...field} className="h-11 font-mono" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="stockLevel" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stock Reserve</FormLabel>
                        <FormControl><Input type="number" placeholder="100" {...field} className="h-11 font-mono" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
             </div>

             <div className="space-y-4">
                <Label className="flex items-center gap-2 text-primary/80">
                    <ImageIcon className="h-4 w-4" />
                    Multi-Asset Luxury Gallery (Max 5)
                </Label>
                
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {Object.values(uploads).map((upload) => (
                            <motion.div 
                                key={upload.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20 bg-slate-900/50 group"
                            >
                                {upload.url ? (
                                    <>
                                        <img src={upload.url} alt="Upload" className="h-full w-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeUpload(upload.id, upload.url)}
                                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <div className="absolute bottom-1 right-1">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 fill-black" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center">
                                        <div className="relative">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary opacity-40" />
                                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-primary">
                                                {upload.progress}%
                                            </span>
                                        </div>
                                        
                                        {/* Gold Progress Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                                            <motion.div 
                                                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-gold-glow"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${upload.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {Object.keys(uploads).length < 5 && (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 cursor-pointer flex flex-col items-center justify-center transition-all group"
                        >
                            <Plus className="h-6 w-6 text-primary/40 group-hover:text-primary transition-colors" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 mt-1">Add Asset</span>
                        </div>
                    )}
                </div>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
                
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1.5 pt-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    High-res photography recommended. First upload will be the signature hero asset.
                </p>
             </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || imageGallery.length === 0} 
                className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin mr-2" />
                        Synchronizing Master Catalog...
                    </>
                ) : 'Launch Item to Marketplace'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
