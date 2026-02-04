
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useUserProfile, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackagePlus, CheckCircle2, UploadCloud, X, ImageIcon, TrendingUp, Tags, Layers, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SomaLogo from '@/components/logo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_CATEGORIES = [
    "Watches", "Leather Goods", "Jewelry", "Fragrance", "Apparel", "Accessories", "Home Decor", "Electronics"
];

export default function AddProductPage() {
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState('');
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const margin = useMemo(() => {
    const w = parseFloat(wholesalePrice) || 0;
    const r = parseFloat(suggestedRetailPrice) || 0;
    if (r <= 0) return 0;
    return ((r - w) / r) * 100;
  }, [wholesalePrice, suggestedRetailPrice]);

  useEffect(() => {
    if (!profileLoading && userProfile?.status === 'pending_review') {
        router.push('/backstage/pending-review');
    }
  }, [userProfile, profileLoading, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a high-resolution JPG or PNG image.',
        });
        return;
    }

    setIsUploading(true);
    try {
        const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        setImageUrl(downloadUrl);
        toast({ title: 'Image Uploaded', description: 'Product asset secured successfully.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Could not upload image.' });
    } finally {
        setIsUploading(false);
    }
  };

  const removeImage = () => {
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleCategory = (category: string) => {
      setSelectedCategories(prev => 
        prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a product.' });
      return;
    }

    if (!imageUrl) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload a product image to proceed.' });
        return;
    }
    
    if (parseFloat(wholesalePrice) >= parseFloat(suggestedRetailPrice)) {
      toast({ variant: 'destructive', title: 'Pricing Error', description: 'Suggested Retail Price must be greater than Wholesale Price.' });
      return;
    }

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    setIsSubmitting(true);
    try {
      const pendingCatalogRef = collection(firestore, 'Pending_Master_Catalog');
      await addDoc(pendingCatalogRef, {
        productName,
        description,
        imageUrl, 
        wholesalePrice: parseFloat(wholesalePrice),
        suggestedRetailPrice: parseFloat(suggestedRetailPrice),
        categories: selectedCategories,
        tags: tags,
        vendorId: user.uid,
        isApproved: false,
        submittedAt: serverTimestamp(),
      });
      setIsSuccess(true);
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
      <div className="text-center mb-10">
        <SomaLogo className="h-12 w-12 mx-auto" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Supplier Submission</h1>
        <p className="mt-2 text-lg text-muted-foreground">Add a new product to the SOMA Master Catalog.</p>
      </div>

      <Card className="w-full max-w-5xl border-primary/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 text-center"
            >
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold font-headline text-primary">Product Submitted</h2>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                    Product submitted for luxury review. Our team will notify you once it is live in the Master Catalog.
                </p>
                <Button onClick={() => {
                    setIsSuccess(false);
                    setProductName('');
                    setDescription('');
                    setImageUrl('');
                    setWholesalePrice('');
                    setSuggestedRetailPrice('');
                    setSelectedCategories([]);
                    setTagsInput('');
                }} variant="outline" className="mt-8">Submit Another Product</Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <PackagePlus className="h-6 w-6 text-primary"/>
                    New Product Details
                </CardTitle>
                <CardDescription>
                  Categorize and detail your luxury item for the global catalog.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Product Name</Label>
                            <Input 
                                id="product-name" 
                                value={productName} 
                                onChange={(e) => setProductName(e.target.value)} 
                                required 
                                placeholder="e.g., 'The Olympian Chronograph'"
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
                                            "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
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
                            <Label htmlFor="tags" className="flex items-center gap-2">
                                <Tags className="h-4 w-4 text-primary" />
                                Custom Tags
                            </Label>
                            <Input 
                                id="tags" 
                                value={tagsInput} 
                                onChange={(e) => setTagsInput(e.target.value)} 
                                placeholder="e.g., Limited Edition, Sustainable, Handmade"
                                className="h-12"
                            />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Separate tags with commas</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Product Description</Label>
                            <Textarea 
                                id="description" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                required 
                                placeholder="Describe the key features and luxury appeal of your product."
                                className="min-h-[150px] resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="wholesale-price">Your Wholesale Price ($)</Label>
                                <Input id="wholesale-price" type="number" step="0.01" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} required placeholder="250.00"/>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Amount you receive per sale</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="retail-price">Suggested Retail Price ($)</Label>
                                <Input id="retail-price" type="number" step="0.01" value={suggestedRetailPrice} onChange={(e) => setSuggestedRetailPrice(e.target.value)} required placeholder="650.00"/>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Global listing price</p>
                            </div>
                        </div>

                        {(parseFloat(wholesalePrice) > 0 && parseFloat(suggestedRetailPrice) > 0) && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-lg border border-border bg-muted/30 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-sm font-medium">Proposed Margin</span>
                                </div>
                                <span className={cn(
                                    "text-2xl font-bold font-mono",
                                    margin < 20 ? "text-orange-500" : margin > 40 ? "text-primary" : "text-foreground"
                                )}>
                                    {margin.toFixed(1)}%
                                </span>
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                Product Photography (1:1 Aspect Ratio)
                            </Label>
                            
                            <div className="relative">
                                <div 
                                    onClick={() => !imageUrl && fileInputRef.current?.click()}
                                    className={cn(
                                        "relative w-full aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
                                        !imageUrl ? "border-primary/30 hover:border-primary bg-muted/20 cursor-pointer" : "border-primary/50 bg-background",
                                        isUploading && "animate-pulse"
                                    )}
                                >
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                            <p className="text-xs font-bold text-primary uppercase tracking-widest">Uploading...</p>
                                        </div>
                                    ) : imageUrl ? (
                                        <div className="relative w-full h-full group">
                                            <Image 
                                                src={imageUrl} 
                                                alt="Preview" 
                                                fill 
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, 400px"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button 
                                                    type="button" 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                                    className="rounded-full h-12 w-12"
                                                >
                                                    <X className="h-6 w-6" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-6 text-center">
                                            <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                                            <span className="text-sm font-semibold">Click to upload square image</span>
                                            <span className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tighter">JPG, PNG (Max 10MB)</span>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/png,image/jpeg" 
                                    onChange={handleFileUpload} 
                                    disabled={isUploading || !!imageUrl}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground italic">Tip: Luxury products perform best with minimalist, high-contrast backgrounds.</p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || isUploading || !imageUrl || selectedCategories.length === 0} 
                                size="lg" 
                                className="w-full h-14 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" />
                                        Finalizing Submission...
                                    </>
                                ) : 'Submit for Review'}
                            </Button>
                        </div>
                    </div>
                </form>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
