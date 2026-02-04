'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useStorage } from '@/firebase';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { User, Loader2, Save, Camera, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  professionalTitle: z.string().min(2, 'Professional title is required for luxury branding.').max(50, 'Keep it concise (max 50 chars).'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        mode: 'onBlur',
        defaultValues: {
            displayName: '',
            professionalTitle: '',
        },
    });

    useEffect(() => {
        if (userProfile) {
            form.reset({
                displayName: userProfile.displayName || '',
                professionalTitle: userProfile.professionalTitle || '',
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
            });
            toast({
                title: 'Profile Synchronized',
                description: 'Your executive credentials have been updated.',
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
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
                    <p className="text-muted-foreground">Manage your public identity and brand persona.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                </div>

                {/* Form Content */}
                <Card className="lg:col-span-2 border-primary/50">
                    <CardHeader>
                        <CardTitle>Professional Credentials</CardTitle>
                        <CardDescription>These details will be featured on your live storefront.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
                                <div className="space-y-2">
                                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-widest">System Identity (Email)</FormLabel>
                                    <Input value={userProfile?.email || ''} disabled className="bg-muted/20 border-primary/10 font-mono text-sm" />
                                    <FormDescription>Your registered login email cannot be changed.</FormDescription>
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

                                <div className="flex justify-end pt-6 border-t border-primary/10">
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 px-8 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                                        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                        Save Credentials
                                    </Button>
                                </div>
                            </form>
                         </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
