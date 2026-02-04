'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useStorage, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { User, Loader2, Save, Camera, CheckCircle2, BookOpen, ShieldCheck, Clock, ExternalLink, Share2, Instagram, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  professionalTitle: z.string().min(2, 'Professional title is required for luxury branding.').max(50, 'Keep it concise (max 50 chars).'),
  bio: z.string().max(500, 'Bio must be under 500 characters.').optional(),
  showBioOnStorefront: z.boolean().default(false),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  x: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);

    // Fetch store data and products to check readiness for public link
    const storeRef = useMemoFirebase(() => {
        if (!firestore || !userProfile?.id) return null;
        return doc(firestore, 'stores', userProfile.id);
    }, [firestore, userProfile?.id]);
    const { data: storeData } = useDoc<any>(storeRef);

    const productsRef = useMemoFirebase(() => {
        if (!firestore || !userProfile?.id) return null;
        return collection(firestore, 'stores', userProfile.id, 'products');
    }, [firestore, userProfile?.id]);
    const { data: products } = useCollection<any>(productsRef);

    const isBoutiqueReady = !!storeData?.storeName && (products?.length || 0) > 0;

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        mode: 'onBlur',
        defaultValues: {
            displayName: '',
            professionalTitle: '',
            bio: '',
            showBioOnStorefront: false,
            instagram: '',
            tiktok: '',
            x: '',
        },
    });

    useEffect(() => {
        if (userProfile) {
            form.reset({
                displayName: userProfile.displayName || '',
                professionalTitle: userProfile.professionalTitle || '',
                bio: userProfile.bio || '',
                showBioOnStorefront: userProfile.showBioOnStorefront ?? false,
                instagram: userProfile.socials?.instagram || '',
                tiktok: userProfile.socials?.tiktok || '',
                x: userProfile.socials?.x || '',
            });
        }
    }, [userProfile, form]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userProfile?.id || !storage || !firestore) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `avatars/${userProfile.id}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            
            const userRef = doc(firestore, 'users', userProfile.id);
            await updateDoc(userRef, { 
                photoURL: downloadUrl,
                avatarUrl: downloadUrl // Sync both for consistency
            });

            toast({ 
                title: 'Identity Secured', 
                description: 'Your profile avatar has been updated successfully.',
                action: <CheckCircle2 className="h-5 w-5 text-green-500" />
            });
        } catch (error: any) {
            toast({ 
                variant: 'destructive', 
                title: 'Upload Failed', 
                description: error.message || 'Could not upload identity asset.' 
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdate = async (data: ProfileFormValues) => {
        if (!userProfile?.id || !firestore) return;
        
        const userRef = doc(firestore, 'users', userProfile.id);

        try {
            await updateDoc(userRef, {
                displayName: data.displayName,
                professionalTitle: data.professionalTitle,
                bio: data.bio || '',
                showBioOnStorefront: data.showBioOnStorefront,
                socials: {
                    instagram: data.instagram || '',
                    tiktok: data.tiktok || '',
                    x: data.x || '',
                }
            });
            toast({
                title: 'Profile Elegance Updated Successfully.',
                description: 'Your executive credentials and social links have been synchronized.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        }
    };

    if (profileLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
                            {userProfile?.walletStatus === 'under_review' && (
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Verification Pending
                                </Badge>
                            )}
                            {userProfile?.walletStatus === 'active' && (
                                <Badge className="bg-primary/20 text-primary border-primary/50 flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" /> SOMA Verified Mogul
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1">Manage your public identity and brand persona.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div> {/* Wrapper for tooltip on disabled button */}
                                    <Button 
                                        asChild={isBoutiqueReady}
                                        variant="outline" 
                                        className={cn(
                                            "border-primary text-primary hover:bg-primary/10 h-11 px-6 font-bold",
                                            !isBoutiqueReady && "opacity-50 cursor-not-allowed pointer-events-none"
                                        )}
                                        disabled={!isBoutiqueReady}
                                    >
                                        {isBoutiqueReady ? (
                                            <Link href={`/store/${userProfile?.id}`} target="_blank">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View My Boutique
                                            </Link>
                                        ) : (
                                            <span>
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Boutique Locked
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {!isBoutiqueReady && (
                                <TooltipContent className="bg-slate-800 border-primary/30 text-slate-200">
                                    <p>Complete your checklist to activate your public link.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdate)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Avatar Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-primary/50 overflow-hidden bg-slate-900/30">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-headline uppercase tracking-widest text-primary/60">Executive Avatar</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center pt-2">
                                <div className="group relative h-40 w-40 rounded-full border-4 border-background bg-slate-950 shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden">
                                    <Avatar className="h-full w-full rounded-none">
                                        <AvatarImage src={userProfile?.photoURL || userProfile?.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-slate-800 text-primary text-4xl font-bold">
                                            {userProfile?.displayName?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    
                                    <div 
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        className={cn(
                                            "absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-all cursor-pointer",
                                            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : (
                                            <>
                                                <Camera className="h-8 w-8 text-white mb-2" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Update Photo</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/png,image/jpeg" 
                                    onChange={handleAvatarUpload} 
                                />
                                <p className="text-[10px] text-muted-foreground mt-6 text-center uppercase tracking-widest font-semibold leading-relaxed">
                                    Recommended: Square JPG or PNG<br/>Min 400x400px
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/50 bg-slate-900/30">
                            <CardHeader>
                                <CardTitle className="text-sm font-headline uppercase tracking-widest text-primary/60 flex items-center gap-2">
                                    <Share2 className="h-4 w-4" />
                                    Social Connectivity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="instagram" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Instagram</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="handle" {...field} className="pl-10 h-10 border-primary/10 bg-black/20" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="tiktok" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">TikTok</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 fill-muted-foreground"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.83 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.33 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
                                                <Input placeholder="handle" {...field} className="pl-10 h-10 border-primary/10 bg-black/20" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="x" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">X (Twitter)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="handle" {...field} className="pl-10 h-10 border-primary/10 bg-black/20" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Content */}
                    <Card className="lg:col-span-2 border-primary/50">
                        <CardHeader>
                            <CardTitle>Professional Credentials</CardTitle>
                            <CardDescription>These details will be featured on your live storefront.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-widest">System Identity (Email)</FormLabel>
                                    <Input value={userProfile?.email || ''} disabled className="bg-muted/20 border-primary/10 font-mono text-sm" />
                                    <FormDescription>Contact SOMA Concierge to change your registered email address.</FormDescription>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="displayName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Public Name</FormLabel>
                                            <FormControl><Input placeholder="e.g. Alexander Vance" {...field} className="h-12 border-primary/20" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="professionalTitle" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Professional Title</FormLabel>
                                            <FormControl><Input placeholder="e.g. Luxury Curator" {...field} className="h-12 border-primary/20" /></FormControl>
                                            <FormDescription>Displayed beneath your name on your store.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <Separator className="bg-primary/10" />

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        <h3 className="font-headline font-bold text-lg">Boutique Storytelling</h3>
                                    </div>

                                    <FormField control={form.control} name="bio" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Public Bio</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Describe your boutique's mission and philosophy... (e.g. 'Crafting timeless elegance for the modern aristocrat.')" 
                                                    className="min-h-[120px] border-primary/20 resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="flex justify-between">
                                                <span>Share your brand's unique narrative.</span>
                                                <span className={cn(
                                                    "text-[10px] font-mono",
                                                    (field.value?.length || 0) > 450 ? "text-destructive" : "text-muted-foreground"
                                                )}>
                                                    {field.value?.length || 0}/500
                                                </span>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="showBioOnStorefront" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/10 p-4 bg-muted/10">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Display Bio on Storefront</FormLabel>
                                                <FormDescription>
                                                    Toggle visibility of your mission statement on your public boutique.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="flex justify-end pt-6 border-t border-primary/10">
                                    <Button 
                                        type="submit" 
                                        disabled={form.formState.isSubmitting} 
                                        className="h-12 px-8 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                    >
                                        {form.formState.isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-5 w-5" />
                                                Save Credentials
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px w-full", className)} />;
}
