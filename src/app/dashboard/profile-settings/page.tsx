'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        mode: 'onBlur',
    });

    useEffect(() => {
        if (userProfile) {
            form.reset({
                displayName: userProfile.displayName || '',
            });
        }
    }, [userProfile, form]);

    const handleUpdate = async (data: ProfileFormValues) => {
        if (!userProfile?.id || !firestore) return;
        
        const userRef = doc(firestore, 'users', userProfile.id);

        try {
            await updateDoc(userRef, {
                displayName: data.displayName,
            });
            toast({
                title: 'Profile Updated',
                description: 'Your display name has been saved.',
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
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
            </div>
            
            <Card className="max-w-2xl border-primary/50">
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Manage your public profile information.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
                            <div className="space-y-2">
                                <FormLabel>Email Address</FormLabel>
                                <Input value={userProfile?.email || ''} disabled className="bg-muted/50" />
                            </div>
                            <FormField control={form.control} name="displayName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
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
        </div>
    )
}
