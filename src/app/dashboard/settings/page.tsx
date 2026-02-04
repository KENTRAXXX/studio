'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Settings, Loader2, Save, Eye, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import Image from 'next/image';

const settingsSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters.'),
  heroTitle: z.string().min(5, 'Hero title must be at least 5 characters.'),
  heroSubtitle: z.string().min(10, 'Hero subtitle must be at least 10 characters.'),
  logoUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
  faviconUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

type StoreData = {
    storeName?: string;
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
    const firestore = useFirestore();
    const { toast } = useToast();

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const storeRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'stores', user.uid) : null, [firestore, user]);
    const { data: storeData, loading: storeLoading } = useDoc<StoreData>(storeRef);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        mode: 'onBlur',
        defaultValues: {
            storeName: '',
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
                heroTitle: storeData.heroTitle || '',
                heroSubtitle: storeData.heroSubtitle || '',
                logoUrl: storeData.logoUrl || '',
                faviconUrl: storeData.faviconUrl || '',
            });
        }
    }, [storeData, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            // In this prototype, we simulate an upload by using a temporary URL.
            const previewUrl = URL.createObjectURL(file);
            form.setValue(field, previewUrl);
            toast({
                title: 'Asset Selected',
                description: `${file.name} is ready. Click "Save Changes" to apply.`,
            });
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

    const isLoading = userLoading || storeLoading;
    if (isLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!storeData && !isLoading) {
        return (
             <div className="flex h-96 w-full items-center justify-center text-center">
                <Card className="p-8 border-primary/50">
                    <CardTitle className="font-headline text-2xl">No Store Found</CardTitle>
                    <CardDescription className="mt-2">Please complete the launch wizard to set up your store first.</CardDescription>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Settings className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Store Customization</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-primary/50">
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Update your store's branding and hero section content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-8">
                                <FormField control={form.control} name="storeName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Store Name</FormLabel>
                                        <FormControl><Input placeholder="Elegance & Co." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

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
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                                        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                         </Form>
                    </CardContent>
                </Card>
                
                <div className="space-y-8">
                     <StorePreview formData={watchedData} />
                </div>
            </div>
        </div>
    )
}
