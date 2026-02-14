'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, 
    PackagePlus, 
    CheckCircle2, 
    UploadCloud, 
    X, 
    ImageIcon, 
    TrendingUp, 
    Tags, 
    Layers, 
    AlertCircle, 
    Package,
    Sparkles,
    Palette,
    Plus
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SomaLogo from '@/components/logo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadToCloudinary } from '@/lib/utils/upload-image';
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

const MAX_IMAGES = 10;

type ColorOption = {
    name: string;
    imageUrl: string;
};

export default function AddProductPage() {
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('100');
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Pre-generate an ID
  const [tempId, setTempId] = useState(() => crypto.randomUUID());

  const numericWholesale = parseFloat(wholesalePrice) || 0;
  const numericRetail = parseFloat(suggestedRetailPrice) || 0;

  const isPriceInvalid = useMemo(() => {
    if (!wholesalePrice || !suggestedRetailPrice) return false;
    return numericRetail < (numericWholesale * 1.15);
  }, [numericWholesale, numericRetail, wholesalePrice, suggestedRetailPrice]);

  const margin = useMemo(() => {
    if (numericRetail <= 0) return 0;
    return ((numericRetail - numericWholesale) / numericRetail) * 100;
  }, [numericWholesale, numericRetail]);

  useEffect(() => {
    if (!profileLoading && userProfile?.status === 'pending_review') {
        router.push('/backstage/pending-review');
    }
  }, [userProfile, profileLoading, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Limit Reached',
            description: `You can only upload up to ${MAX_IMAGES} images.`,
        });
        return;
    }

    setIsUploading(true);
    try {
        const uploadPromises = filesToUpload.map(async (file) => {
            if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
                throw new Error(`File ${file.name} is not a supported format.`);
            }
            return uploadToCloudinary(file);
        });

        const urls = await Promise.all(uploadPromises);
        imageUrlsSet(prev => [...prev, ...urls]);
        toast({ title: 'Assets Secured', description: `${urls.length} image(s) processed.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Could not upload images.' });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const imageUrlsSet = (fn: (prev: string[]) => string[]) => {
      setImageUrls(fn);
  };

  const removeImage = (indexToRemove: number) => {
      const removedUrl = imageUrls[indexToRemove];
      setImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
      // Also cleanup color options mapping to this image
      setColorOptions(prev => prev.filter(opt => opt.imageUrl !== removedUrl));
  };

  const handleAIMagic = async () => {
    if (imageUrls.length === 0) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Upload a primary image first to use AI enrichment.' });
        return;
    }

    setIsAnalyzing(true);
    try {
        const result = await analyzeProductImage({ imageUrl: imageUrls[0] });
        
        setProductName(result.suggestedName);
        setDescription(result.description);
        setSelectedCategories(result.suggestedCategories);
        setTagsInput(result.suggestedTags.join(', '));

        toast({
            title: 'AI ENRICHMENT COMPLETE',
            description: 'Luxury metadata and market research synchronized.',
            action: <Sparkles className="h-4 w-4 text-primary" />
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'AI Analysis Failed',
            description: error.message || 'The curation team is currently offline.'
        });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const addColorOption = () => {
      setColorOptions(prev => [...prev, { name: '', imageUrl: imageUrls[0] || '' }]);
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

  const resetForm = () => {
    setProductName('');
    setDescription('');
    setImageUrls([]);
    setWholesalePrice('');
    setSuggestedRetailPrice('');
    setQuantityAvailable('100');
    setSelectedCategories([]);
    setTagsInput('');
    setColorOptions([]);
    setTempId(crypto.randomUUID());
    setShowSuccessModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    if (imageUrls.length === 0) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload at least one product image.' });
        return;
    }
    
    if (isPriceInvalid) {
      toast({ 
        variant: 'destructive', 
        title: 'Pricing Strategy Error', 
        description: 'Retail price must be at least 15% higher than Wholesale.' 
      });
      return;
    }

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    setIsSubmitting(true);
    try {
      const pendingDocRef = doc(collection(firestore, 'Pending_Master_Catalog'), tempId);
      await setDoc(pendingDocRef, {
        productName,
        description,
        imageUrl: imageUrls[0], 
        imageGallery: imageUrls,
        colorOptions: colorOptions.filter(opt => opt.name && opt.imageUrl),
        wholesalePrice: numericWholesale,
        suggestedRetailPrice: numericRetail,
        stockLevel: parseInt(quantityAvailable, 10) || 0,
        categories: selectedCategories,
        tags: tags,
        vendorId: user.uid,
        isApproved: false,
        submittedAt: serverTimestamp(),
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = userLoading || profileLoading;

  if (isLoading) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-card border-primary p-10 text-center sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                <CheckCircle2 className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <DialogTitle className="text-2xl font-bold font-headline text-primary text-center">
                Product sent to SOMA Curation Team
            </DialogTitle>
            <DialogDescription className="text-lg font-semibold text-foreground pt-2">
                Status: <span className="text-primary">Pending Review</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
                Our elite review team will verify your product details and pricing strategy. You will be notified via email once it is live.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={resetForm} className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12">
                Submit Another Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-center mb-10">
        <SomaLogo className="h-12 w-12 mx-auto" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Supplier Submission</h1>
        <p className="mt-2 text-lg text-muted-foreground">Add a new luxury item to the SOMA Master Catalog.</p>
      </div>

      <Card className="w-full max-w-6xl border-primary/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <PackagePlus className="h-6 w-6 text-primary"/>
                    Masterpiece Details
                </CardTitle>
                <CardDescription>
                    Configure variants and metadata for the global collection.
                </CardDescription>
            </div>
            <Button 
                onClick={handleAIMagic} 
                disabled={imageUrls.length === 0 || isAnalyzing}
                className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black hidden md:flex h-12"
            >
                {isAnalyzing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI ENRICHMENT
            </Button>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Product Name</Label>
                            <Input 
                                id="product-name" 
                                value={productName} 
                                onChange={(e) => setProductName(e.target.value)} 
                                required 
                                placeholder="e.g., 'The Obsidian Chronograph'"
                                className="h-12"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                Product Categories
                            </Label>
                            <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/10">
                                {AVAILABLE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => toggleCategory(cat)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all border",
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
                            <Label htmlFor="description">Product Narrative</Label>
                            <Textarea 
                                id="description" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                required 
                                placeholder="Evocative description highlighting craftsmanship and materials..."
                                className="min-h-[120px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="wholesale-price">Wholesale ($)</Label>
                            <Input id="wholesale-price" type="number" step="0.01" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} required placeholder="250.00"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="retail-price">Retail ($)</Label>
                            <Input id="retail-price" type="number" step="0.01" value={suggestedRetailPrice} onChange={(e) => setSuggestedRetailPrice(e.target.value)} required placeholder="650.00" className={cn(isPriceInvalid && "border-destructive")}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity-available">Qty</Label>
                            <Input id="quantity-available" type="number" value={quantityAvailable} onChange={(e) => setQuantityAvailable(e.target.value)} required placeholder="100"/>
                        </div>
                    </div>

                    {isPriceInvalid && (
                        <div className="flex items-center gap-2 text-destructive text-xs font-bold bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                            <AlertCircle className="h-4 w-4" />
                            <span>Suggested Retail must be at least 15% higher than Wholesale.</span>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-primary">
                                <Palette className="h-4 w-4" />
                                Color Variations
                            </Label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addColorOption}
                                className="h-8 border-primary/20 hover:bg-primary/5"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add Color
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {colorOptions.map((opt, idx) => (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 5 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-white/5"
                                >
                                    <div className="flex-1">
                                        <Input 
                                            placeholder="Color Name (e.g. Ivory)" 
                                            value={opt.name}
                                            onChange={(e) => updateColorOption(idx, { name: e.target.value })}
                                            className="h-10 bg-background"
                                        />
                                    </div>
                                    <div className="w-[180px]">
                                        <Select 
                                            value={opt.imageUrl} 
                                            onValueChange={(val) => updateColorOption(idx, { imageUrl: val })}
                                        >
                                            <SelectTrigger className="h-10 bg-background">
                                                <SelectValue placeholder="Select Photo" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-primary/20">
                                                {imageUrls.map((url, i) => (
                                                    <SelectItem key={i} value={url} className="focus:bg-primary/10">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative h-6 w-6 rounded overflow-hidden">
                                                                <Image src={url} alt={`Photo ${i+1}`} fill className="object-cover" />
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
                                        className="h-10 w-10 text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            ))}
                            {colorOptions.length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic">No colors defined. The product will list as a single variant.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-primary/80 uppercase tracking-widest text-[10px] font-black">
                            <ImageIcon className="h-4 w-4" />
                            Visual Registry (Max {MAX_IMAGES})
                        </Label>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-primary/50 group bg-slate-900">
                                    <Image 
                                        src={url} 
                                        alt={`Product ${index + 1}`} 
                                        fill 
                                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button 
                                            type="button" 
                                            variant="destructive" 
                                            size="icon" 
                                            onClick={() => removeImage(index)}
                                            className="rounded-full h-8 w-8"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {index === 0 && (
                                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-black tracking-widest h-4">PRIMARY</Badge>
                                    )}
                                </div>
                            ))}
                            
                            {imageUrls.length < MAX_IMAGES && (
                                <div 
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    className={cn(
                                        "relative aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden bg-slate-900/40",
                                        "border-primary/30 hover:border-primary",
                                        isUploading && "animate-pulse"
                                    )}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-center p-4">
                                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-[10px] font-black uppercase text-primary/60">Upload</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/png,image/jpeg,image/webp" 
                            multiple
                            onChange={handleFileUpload} 
                            disabled={isUploading || imageUrls.length >= MAX_IMAGES}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <Label htmlFor="tags" className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-muted-foreground">
                            <Tags className="h-4 w-4" />
                            SEO Tag Registry
                        </Label>
                        <Input 
                            id="tags" 
                            value={tagsInput} 
                            onChange={(e) => setTagsInput(e.target.value)} 
                            placeholder="Limited Edition, Sustainable, Handmade..."
                            className="h-12 border-primary/10 bg-slate-950"
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button 
                            onClick={handleAIMagic} 
                            disabled={imageUrls.length === 0 || isAnalyzing}
                            variant="outline"
                            className="md:hidden h-14 border-primary text-primary font-black"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            AI ENRICHMENT
                        </Button>

                        <Button 
                            type="submit" 
                            disabled={isSubmitting || isUploading || imageUrls.length === 0 || selectedCategories.length === 0 || isPriceInvalid} 
                            size="lg" 
                            className="w-full h-16 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-3 h-6 w-6" />
                                    TRANSMITTING...
                                </>
                            ) : 'Submit for Curation'}
                        </Button>
                    </div>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
