'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
    Palette, 
    Check, 
    Loader2, 
    Search, 
    Sparkles, 
    Type, 
    FileSearch,
    Monitor,
    ShoppingBag,
    Menu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import SomaLogo from '@/components/logo';
import { ImageUploader } from '@/components/ui/image-uploader';

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
        primary: string; 
        background: string; 
        accent: string; 
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

const BoutiqueLivePreview = ({ storeName, tagline, logoUrl, themeId }: { storeName: string, tagline: string, logoUrl?: string, themeId: string }) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                <Monitor className="h-3 w-3" /> Digital Storefront Monitor
            </div>
            
            <div className="relative aspect-[4/3] w-full rounded-2xl border-8 border-slate-900 bg-slate-900 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 overflow-hidden flex flex-col" style={{ backgroundColor: `hsl(${theme.colors.background})` }}>
                    <div className="h-12 border-b flex items-center justify-between px-4" style={{ borderColor: `hsl(${theme.colors.primary} / 0.1)` }}>
                        <div className="flex items-center gap-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-5 w-auto object-contain" />
                            ) : (
                                <SomaLogo className="h-4 w-4" style={{ color: `hsl(${theme.colors.primary})` }} />
                            )}
                            <span className="text-[10px] font-headline font-bold uppercase tracking-tighter" style={{ color: `hsl(${theme.colors.primary})` }}>
                                {storeName || 'Boutique'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Menu className="h-3 w-3 opacity-40" style={{ color: `hsl(${theme.colors.primary})` }} />
                            <ShoppingBag className="h-3 w-3 opacity-40" style={{ color: `hsl(${theme.colors.primary})` }} />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="relative w-full h-24 rounded-lg bg-slate-800 overflow-hidden">
                            <img src="https://picsum.photos/seed/soma-hero/600/400" className="w-full h-full object-cover opacity-40" alt="Hero" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                <h3 className="text-sm font-headline font-black uppercase tracking-tight leading-none" style={{ color: `hsl(${theme.colors.primary})` }}>
                                    {tagline || 'Timeless Luxury'}
                                </h3>
                                <div className="mt-2 h-4 w-16 rounded-full text-[6px] flex items-center justify-center font-bold" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.background})` }}>
                                    SHOP NOW
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 w-full pt-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="space-y-1">
                                    <div className="aspect-square rounded bg-slate-800/50" />
                                    <div className="h-1 w-12 bg-slate-700/50 rounded mx-auto" />
                                    <div className="h-1 w-8 bg-primary/20 rounded mx-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl shadow-inner" />
            </div>
            <p className="text-center text-[10px] text-muted-foreground italic">Live visual feedback • Changes apply instantly to preview</p>
        </div>
    );
};

export default function StorefrontSettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

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

    const watchedStoreName = form.watch('storeName');
    const watchedTagline = form.watch('tagline');
    const watchedLogoUrl = form.watch('logoUrl');

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

    const handleLogoSuccess = (secureUrl: string) => {
        form.setValue('logoUrl', secureUrl);
        toast({ title: 'Branding Secured', description: 'Your boutique logo has been hosted on Cloudinary.' });
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
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
            <div className="text-center">
                <Palette className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight">Visual Architect</h1>
                <p className="mt-2 text-lg text-muted-foreground">Orchestrate the design language and visual presence of your boutique.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
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
                                    <div className="grid md:grid-cols-2 gap-6 items-center">
                                        {watchedLogoUrl ? (
                                            <div className="relative h-32 w-full rounded-xl border border-primary/20 bg-slate-950/50 flex items-center justify-center p-4">
                                                <img src={watchedLogoUrl} alt="Logo" className="h-20 object-contain" />
                                                <button 
                                                    type="button"
                                                    onClick={() => form.setValue('logoUrl', '')}
                                                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="h-32 w-full rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/20 flex items-center justify-center">
                                                <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">No Logo Set</p>
                                            </div>
                                        )}
                                        
                                        <ImageUploader 
                                            onSuccess={handleLogoSuccess}
                                            label="Change Boutique Logo"
                                            aspectRatio="aspect-video"
                                        />
                                    </div>
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

                    <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
                        <Card className="border-primary/20 bg-slate-900/30 overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-primary/10">
                                <CardTitle className="text-sm font-headline uppercase tracking-widest text-slate-200 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" /> Live Boutique View
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <BoutiqueLivePreview 
                                    storeName={watchedStoreName} 
                                    tagline={watchedTagline} 
                                    logoUrl={watchedLogoUrl} 
                                    themeId={selectedTheme} 
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-slate-900/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-200">
                                    <FileSearch className="h-5 w-5 text-primary" />
                                    SEO & Visibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="storeDescription" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Search Snippet Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Experience the pinnacle of luxury..." 
                                                className="min-h-[100px] bg-slate-950/50 border-primary/10"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                ) } />

                                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 opacity-60">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                        <Search className="h-3 w-3" /> Search Result Preview
                                    </div>
                                    <p className="text-blue-400 text-sm font-medium hover:underline cursor-pointer truncate">
                                        {watchedStoreName || 'Boutique Name'} | SOMA Luxury
                                    </p>
                                    <p className="text-green-600 text-[10px] truncate">
                                        https://{storeData?.customDomain || 'your-boutique.com'}
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
                                        Deploying Changes...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-3 h-6 w-6" />
                                        Synchronize Global Store
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
