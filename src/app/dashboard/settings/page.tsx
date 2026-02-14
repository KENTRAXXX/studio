'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc, useMemoFirebase, useUserProfile } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Settings, Loader2, Save, Eye, UploadCloud, X, Globe, Sparkles, CreditCard, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { uploadToCloudinary } from '@/lib/utils/upload-image';
import { usePaystack } from '@/hooks/use-paystack';

const settingsSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters.'),
  slug: z.string().min(3, 'Subdomain slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  heroTitle: z.string().min(5, 'Hero title must be at least 5 characters.'),
  heroSubtitle: z.string().min(10, 'Hero subtitle must be at least 10 characters.'),
  logoUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
  faviconUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

type StoreData = {
    storeName?: string;
    slug?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    logoUrl?: string;
    faviconUrl?: string;
};

const StorePreview = ({ formData }: { formData: Partial<SettingsFormValues> }) => {
    return (
        <Card className="border-primary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-2">
                        {formData.logoUrl ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-primary/20">
                                <img src={formData.logoUrl} alt="logo" className="h-full w-full object-contain" />
                            </div>
                        ) : (
                            <SomaLogo className="h-8 w-8" />
                        )}
                        <span className="font-headline text-xl font-bold text-primary">{formData.storeName || 'Your Store'}</span>
                    </div>
                </div>
                 <div className="relative h-32 mt-4 rounded-lg flex items-center justify-center text-center text-white bg-black/50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-yellow-900/50 -z-10"></div>
                     <div className="relative z-10 p-2">
                        <h1 className="text-2xl font-bold font-headline text-primary">{formData.heroTitle || 'Hero Title'}</h1>
                        <p className="text-xs mt-1">{formData.heroSubtitle || 'Hero Subtitle'}</p>
                     </div>
                 </div>
            </CardContent>
        </Card>
    )
}

export default function StoreSettingsPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { initializePayment, isInitializing } = usePaystack();
    const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const storeRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'stores', user.uid) : null, [firestore, user]);
    const { data: storeData, loading: storeLoading } = useDoc<StoreData>(storeRef);

    const [isBuyingCredits, setIsBuyingCredits] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        mode: 'onBlur',
        defaultValues: {
            storeName: '',
            slug: '',
            heroTitle: '',
            heroSubtitle: '',
            logoUrl: '',
            faviconUrl: '',
        },
    });

    const watchedData = form.watch();

    useEffect(() => {
        if (storeData) {
            form.reset({
                storeName: storeData.storeName || '',
                slug: storeData.slug || '',
                heroTitle: storeData.heroTitle || '',
                heroSubtitle: storeData.heroSubtitle || '',
                logoUrl: storeData.logoUrl || '',
                faviconUrl: storeData.faviconUrl || '',
            });
        }
    }, [storeData, form]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            const uploadToast = toast({
                title: 'Uploading Asset...',
                description: 'Securing your branding in Cloudinary.',
            });
            try {
                const secureUrl = await uploadToCloudinary(file);
                form.setValue(field, secureUrl);
                uploadToast.update({
                    id: uploadToast.id,
                    title: 'Asset Secured',
                    description: 'Your branding has been uploaded. Click "Save Changes" to finalize.',
                });
            } catch (error: any) {
                uploadToast.update({
                    id: uploadToast.id,
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: error.message || 'Could not upload asset.',
                });
            }
        }
    };

    const handleUpdate = async (data: SettingsFormValues) => {
        if (!storeRef) return;
        
        const savingToast = toast({
            title: 'Saving...',
            description: 'Your luxury assets are being deployed.',
        });

        try {
            await updateDoc(storeRef, data);
            savingToast.update({
                id: savingToast.id,
                title: 'Store Updated',
                description: 'Your changes have been saved successfully.',
            });
        } catch (error: any) {
            savingToast.update({
                id: savingToast.id,
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        }
    };

    const handleBuyCredits = async () => {
        if (!user || !userProfile) return;
        setIsBuyingCredits(true);

        try {
            await initializePayment({
                email: user.email!,
                payment: {
                    type: 'cart',
                    amountInUSD: 10.00
                },
                metadata: {
                    userId: user.uid,
                    purchaseType: 'ai_credits',
                    credits: 20
                }
            }, 
            async (ref) => {
                const userRef = doc(firestore!, 'users', user.uid);
                await updateDoc(userRef, { aiCredits: increment(20) });
                toast({
                    title: 'Credits Provisioned',
                    description: '20 high-fidelity AI credits have been added to your registry.',
                    action: <Zap className="h-4 w-4 text-primary" />
                });
                setIsBuyingCredits(false);
            },
            () => {
                setIsBuyingCredits(false);
            });
        } catch (e) {
            setIsBuyingCredits(false);
        }
    };

    const isLoading = userLoading || storeLoading;
    if (isLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Settings className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Store Customization</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <Card className="border-primary/50 bg-slate-900/20">
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Update your store's branding and web identity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="storeName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Store Name</FormLabel>
                                                <FormControl><Input placeholder="Elegance & Co." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="slug" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Boutique Subdomain</FormLabel>
                                                <div className="flex flex-col gap-2">
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="your-brand" {...field} className="pl-10 h-10 font-mono" />
                                                        </div>
                                                    </FormControl>
                                                    <p className="text-[10px] font-mono text-muted-foreground">Address: {field.value || '...'}.{ROOT_DOMAIN}</p>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 pt-4">
                                        <FormField control={form.control} name="logoUrl" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Store Logo</FormLabel>
                                                <div className="flex flex-col gap-4">
                                                    {field.value ? (
                                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-primary/20 bg-muted/50 flex items-center justify-center group">
                                                            <img src={field.value} alt="Logo preview" className="max-w-[80%] max-h-[80%] object-contain" />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => field.onChange('')}
                                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-8 w-8 text-white" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            onClick={() => logoInputRef.current?.click()}
                                                            className="w-full aspect-video rounded-lg border-2 border-dashed border-primary/30 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20"
                                                        >
                                                            <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                                                            <span className="text-sm text-muted-foreground font-medium">Upload Store Logo</span>
                                                            <span className="text-[10px] text-muted-foreground/60 mt-1">PNG, SVG, or JPG (Max 5MB)</span>
                                                        </div>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        ref={logoInputRef} 
                                                        className="hidden" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleFileChange(e, 'logoUrl')} 
                                                    />
                                                    <FormControl>
                                                        <Input placeholder="Or enter logo URL manually..." {...field} className="text-xs h-8" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="faviconUrl" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Favicon</FormLabel>
                                                <div className="flex flex-col gap-4">
                                                    {field.value ? (
                                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-primary/20 bg-muted/50 flex items-center justify-center group mx-auto md:mx-0">
                                                            <img src={field.value} alt="Favicon preview" className="w-12 h-12 object-contain" />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => field.onChange('')}
                                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-6 w-6 text-white" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            onClick={() => faviconInputRef.current?.click()}
                                                            className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20 mx-auto md:mx-0"
                                                        >
                                                            <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
                                                            <span className="text-[10px] text-muted-foreground/60 mt-1">Upload Icon</span>
                                                        </div>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        ref={faviconInputRef} 
                                                        className="hidden" 
                                                        accept="image/x-icon,image/png,image/jpeg" 
                                                        onChange={(e) => handleFileChange(e, 'faviconUrl')} 
                                                    />
                                                    <FormControl>
                                                        <Input placeholder="Or favicon URL..." {...field} className="text-xs h-8" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <h3 className="font-semibold text-lg border-t border-border pt-6">Hero Section</h3>
                                    <FormField control={form.control} name="heroTitle" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hero Title</FormLabel>
                                            <FormControl><Input placeholder="Welcome to Your Store" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hero Subtitle</FormLabel>
                                            <FormControl><Input placeholder="Discover curated collections..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={form.formState.isSubmitting} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                                            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                            Synchronize Storefront
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-primary/50 bg-primary/5 shadow-gold-glow">
                        <CardHeader>
                            <CardTitle className="text-xl font-headline flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Strategic AI Credits
                            </CardTitle>
                            <CardDescription>Fuel your Product Analyzer and Market Schemes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-black/40 border border-primary/20">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Available Allocation</p>
                                <div className="text-5xl font-bold text-primary font-mono">{userProfile?.userRole === 'ADMIN' ? '∞' : (userProfile?.aiCredits ?? 0)}</div>
                                <p className="text-[10px] text-primary/60 mt-2 font-bold uppercase">Strategic Credits Remaining</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Standard Top-up</span>
                                    <span className="font-bold text-slate-200">20 Credits</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Investment</span>
                                    <span className="font-bold text-primary">$10.00</span>
                                </div>
                                <Button 
                                    onClick={handleBuyCredits} 
                                    disabled={isBuyingCredits || isInitializing}
                                    className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                >
                                    {isBuyingCredits ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                    Buy Analysis Block
                                </Button>
                                <p className="text-[10px] text-muted-foreground italic text-center">
                                    Credits are provisioned instantly upon payment confirmation.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <StorePreview formData={watchedData} />
                </div>
            </div>
        </div>
    )
}
