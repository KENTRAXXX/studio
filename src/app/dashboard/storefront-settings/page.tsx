'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc, useStorage, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
    Palette, 
    UploadCloud, 
    Check, 
    Loader2, 
    Search, 
    Sparkles, 
    Type, 
    FileSearch,
    CheckCircle2,
    Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const storefrontSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters.'),
  tagline: z.string().min(5, 'Brand tagline must be at least 5 characters.'),
  storeDescription: z.string().min(20, 'SEO description should be at least 20 characters for better indexing.'),
  logoUrl: z.string().optional(),
});

type StorefrontFormValues = z.infer<typeof storefrontSchema>;

type ThemeOption = {
    id: string;
    name: string;
    colors: {
        primary: string; // HSL
        background: string; // HSL
        accent: string; // HSL
    };
    previewClass: string;
};

const THEMES: ThemeOption[] = [
    { 
        id: 'onyx', 
        name: 'Onyx Black', 
        colors: { primary: '45 74% 51%', background: '0 0% 2%', accent: '0 0% 10%' },
        previewClass: 'bg-black border-yellow-600'
    },
    { 
        id: 'ivory', 
        name: 'Classic Ivory', 
        colors: { primary: '0 0% 0%', background: '45 20% 96%', accent: '45 10% 90%' },
        previewClass: 'bg-[#F5F5F0] border-slate-900'
    },
    { 
        id: 'rose-gold', 
        name: 'Rose Gold', 
        colors: { primary: '350 45% 65%', background: '0 0% 5%', accent: '350 20% 15%' },
        previewClass: 'bg-[#1A1A1A] border-[#B76E79]'
    },
    { 
        id: 'midnight', 
        name: 'Midnight Pro', 
        colors: { primary: '210 100% 50%', background: '222 47% 11%', accent: '222 47% 15%' },
        previewClass: 'bg-[#0F172A] border-blue-500'
    }
];

export default function StorefrontSettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('onyx');
    
    const storeRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'stores', user.uid) : null, [firestore, user]);
    const { data: storeData, loading: storeLoading } = useDoc<any>(storeRef);

    const form = useForm<StorefrontFormValues>({
        resolver: zodResolver(storefrontSchema),
        defaultValues: {
            storeName: '',
            tagline: '',
            storeDescription: '',
            logoUrl: '',
        },
    });

    useEffect(() => {
        if (storeData) {
            form.reset({
                storeName: storeData.storeName || '',
                tagline: storeData.heroTitle || '',
                storeDescription: storeData.seoDescription || '',
                logoUrl: storeData.logoUrl || '',
            });
            if (storeData.themeConfig?.id) {
                setSelectedTheme(storeData.themeConfig.id);
            }
        }
    }, [storeData, form]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !storage || !firestore) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `stores/${user.uid}/branding/logo`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            
            form.setValue('logoUrl', downloadUrl);
            toast({ title: 'Branding Secured', description: 'Your boutique logo has been updated.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: StorefrontFormValues) => {
        if (!storeRef) return;

        const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

        try {
            await updateDoc(storeRef, {
                storeName: data.storeName,
                heroTitle: data.tagline,
                seoDescription: data.storeDescription,
                logoUrl: data.logoUrl,
                themeConfig: {
                    id: theme.id,
                    colors: theme.colors
                }
            });
            toast({
                title: 'Architecture Updated',
                description: 'Your boutique visual identity has been deployed globally.',
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    };

    if (storeLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <div className="text-center">
                <Palette className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight">Visual Architect</h1>
                <p className="mt-2 text-lg text-muted-foreground">Orchestrate the design language and visual presence of your boutique.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left: Core Branding & Theme */}
                    <div className="lg:col-span-7 space-y-8">
                        <Card className="border-primary/20 bg-slate-900/30 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-200">
                                    <Type className="h-5 w-5 text-primary" />
                                    Boutique Identity
                                </CardTitle>
                                <CardDescription>Define the public-facing attributes of your brand.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="storeName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Elegance & Co." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="tagline" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Brand Tagline</FormLabel>
                                            <FormControl><Input placeholder="Timeless Luxury, Redefined" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="space-y-4">
                                    <Label>Boutique Logo</Label>
                                    <div 
                                        className="relative h-32 w-full rounded-xl border-2 border-dashed border-primary/20 bg-slate-950/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {form.watch('logoUrl') ? (
                                            <img src={form.watch('logoUrl')} alt="Logo" className="h-20 object-contain" />
                                        ) : (
                                            <>
                                                <UploadCloud className="h-8 w-8 text-slate-600 mb-2" />
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Upload Vector or Transparent PNG</span>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                            <span className="text-xs font-bold text-white uppercase">{isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Change Logo'}</span>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-slate-900/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-200">
                                    <Palette className="h-5 w-5 text-primary" />
                                    Luxury Theme Palette
                                </CardTitle>
                                <CardDescription>Select a color story that resonates with your collection.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {THEMES.map((theme) => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setSelectedTheme(theme.id)}
                                            className={cn(
                                                "relative p-4 rounded-xl border-2 transition-all text-left group",
                                                selectedTheme === theme.id 
                                                    ? "border-primary bg-primary/10 shadow-gold-glow" 
                                                    : "border-slate-800 bg-slate-950/50 hover:border-primary/30"
                                            )}
                                        >
                                            <div className={cn("h-12 w-full rounded-md border mb-3", theme.previewClass)} />
                                            <p className="text-xs font-bold text-slate-200">{theme.name}</p>
                                            {selectedTheme === theme.id && (
                                                <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                                                    <Check className="h-3 w-3 text-black" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: SEO & Live Preview */}
                    <div className="lg:col-span-5 space-y-8">
                        <Card className="border-primary/20 bg-slate-900/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-200">
                                    <FileSearch className="h-5 w-5 text-primary" />
                                    SEO & Search Visibility
                                </CardTitle>
                                <CardDescription>How your boutique appears in Google search snippets.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="storeDescription" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Search Snippet Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Experience the pinnacle of luxury with our curated collection of fine watches and bespoke leather goods..." 
                                                className="min-h-[120px] bg-slate-950/50 border-primary/10"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Optimized for search engine visibility.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                        <Search className="h-3 w-3" /> Search Result Preview
                                    </div>
                                    <p className="text-blue-400 text-lg font-medium hover:underline cursor-pointer truncate">
                                        {form.watch('storeName') || 'Boutique Name'} | SOMA Luxury
                                    </p>
                                    <p className="text-green-600 text-xs truncate">
                                        https://{storeData?.customDomain || 'your-boutique.com'}
                                    </p>
                                    <p className="text-slate-400 text-xs line-clamp-2">
                                        {form.watch('storeDescription') || 'Your store description will appear here to attract global customers...'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                className="w-full h-16 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-3 h-6 w-6" />
                                        Deploying Architectural Changes...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-3 h-6 w-6" />
                                        Save & Synchronize Boutique
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
