'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser, useFirestore, useUserProfile } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    ShieldCheck, 
    Mail, 
    Key, 
    Lock, 
    Loader2, 
    Smartphone, 
    User, 
    Instagram, 
    Camera, 
    Save,
    Bell,
    AlertTriangle,
    LogOut,
    Trash2,
    Image as ImageIcon
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { uploadToCloudinary } from '@/lib/utils/upload-image';
import { CustomDomainSettings } from '@/components/backstage/CustomDomainSettings';

export default function BackstageSettingsPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Profile Form State
  const [brandBio, setBrandBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');

  // Preferences State
  const [emailOnNewSales, setEmailOnNewSales] = useState(true);
  const [emailOnConciergeReplies, setEmailOnConciergeReplies] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setBrandBio(userProfile.brandBio || '');
      setInstagram(userProfile.socialLinks?.instagram || '');
      setXHandle(userProfile.socialLinks?.x || '');
      setAvatarUrl(userProfile.avatarUrl || '');
      setCoverPhotoUrl(userProfile.coverPhotoUrl || '');

      if (userProfile.preferences) {
        setEmailOnNewSales(userProfile.preferences.emailOnNewSales ?? true);
        setEmailOnConciergeReplies(userProfile.preferences.emailOnConciergeReplies ?? true);
        setWeeklyReports(userProfile.preferences.weeklyPerformanceReports ?? true);
      }
    }
  }, [userProfile]);

  const handlePasswordReset = async () => {
    if (!auth || !user?.email) return;

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Reset Email Sent',
        description: `A security link has been dispatched to ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Transmission Failed',
        description: error.message || 'Could not send reset email. Please contact support.',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore) return;

    setIsUploadingAvatar(true);
    try {
      const downloadUrl = await uploadToCloudinary(file);
      setAvatarUrl(downloadUrl);
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { avatarUrl: downloadUrl });

      toast({ title: 'Avatar Updated', description: 'Your brand avatar has been hosted on Cloudinary.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore) return;

    setIsUploadingCover(true);
    try {
      const downloadUrl = await uploadToCloudinary(file);
      setCoverPhotoUrl(downloadUrl);
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { coverPhotoUrl: downloadUrl });

      toast({ title: 'Banner Updated', description: 'Brand cover photo is live via Cloudinary.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user || !firestore) return;

    setIsSavingProfile(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        brandBio,
        socialLinks: {
          instagram,
          x: xHandle
        }
      });
      toast({ title: 'Profile Secured', description: 'Your brand identity has been updated globally.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePreferencesSave = async () => {
    if (!user || !firestore) return;
    setIsSavingPrefs(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        preferences: {
          emailOnNewSales,
          emailOnConciergeReplies,
          weeklyPerformanceReports: weeklyReports
        }
      });
      toast({ title: 'Preferences Saved', description: 'Your notification settings have been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user || !firestore || !auth) return;

    setIsDeactivating(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        accountStatus: 'deactivated',
        status: 'deactivated', 
        deactivatedAt: new Date().toISOString()
      });

      toast({
        title: 'Account Deactivated',
        description: 'Your partnership has been paused. Exit protocols initiated.',
      });

      await auth.signOut();
      router.push('/');
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deactivation Failed',
        description: error.message || 'Could not process deactivation request.',
      });
      setIsDeactivating(false);
    }
  };

  if (profileLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="text-center">
        <SomaLogo className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight">Account & Security</h1>
        <p className="mt-2 text-lg text-muted-foreground">Manage your credentials and platform security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card className="border-primary/20 bg-slate-900/30 overflow-hidden">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-slate-200">
                <User className="h-5 w-5 text-primary" />
                Brand Identity
                </CardTitle>
                <CardDescription className="text-slate-500">How your brand appears to Moguls and elite customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Public Brand Banner</Label>
                    <div 
                        className="relative h-48 w-full rounded-2xl overflow-hidden border-2 border-dashed border-primary/20 bg-slate-950/50 group cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => coverInputRef.current?.click()}
                    >
                        {coverPhotoUrl ? (
                            <img src={coverPhotoUrl} alt="Cover" className="h-full w-full object-cover opacity-60" />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                <ImageIcon className="h-8 w-8" />
                                <span className="text-xs font-bold uppercase tracking-tighter">Upload High-Res Banner</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Button variant="ghost" size="sm" className="text-white font-bold h-10 border border-white/20">
                                {isUploadingCover ? <Loader2 className="animate-spin h-4 w-4" /> : "Change Banner"}
                            </Button>
                        </div>
                    </div>
                    <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="space-y-4 flex flex-col items-center">
                        <Avatar className="h-24 w-24 border-2 border-primary/20 bg-slate-950">
                            <AvatarImage src={avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-slate-800 text-primary text-2xl font-bold">
                                {user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-[10px] uppercase tracking-widest font-black border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? <Loader2 className="animate-spin h-3 w-3" /> : <Camera className="h-3 w-3 mr-1" />}
                            Change Avatar
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Brand Biography</Label>
                            <Textarea 
                                placeholder="Tell your brand's luxury story..." 
                                className="min-h-[120px] bg-slate-950/50 border-primary/10 focus-visible:ring-primary text-slate-200"
                                value={brandBio}
                                onChange={(e) => setBrandBio(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                                    <Instagram className="h-3 w-3 text-primary" /> Instagram
                                </Label>
                                <Input 
                                    placeholder="@yourbrand" 
                                    className="bg-slate-950/50 border-primary/10 focus-visible:ring-primary text-slate-200"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> 
                                    X (Twitter)
                                </Label>
                                <Input 
                                    placeholder="@yourbrand" 
                                    className="bg-slate-950/50 border-primary/10 focus-visible:ring-primary text-slate-200"
                                    value={xHandle}
                                    onChange={(e) => setXHandle(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-primary/5">
                    <Button 
                        className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        onClick={handleProfileSave}
                        disabled={isSavingProfile}
                    >
                        {isSavingProfile ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Brand Identity
                    </Button>
                </div>
            </CardContent>
            </Card>

            {userProfile?.planTier === 'BRAND' && (
                <CustomDomainSettings />
            )}

            <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-slate-200">
                <Bell className="h-5 w-5 text-primary" />
                Global Preferences
                </CardTitle>
                <CardDescription className="text-slate-500">Control how and when SOMA contacts you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-slate-800">
                    <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-200">Email on New Sales</Label>
                    <p className="text-[10px] text-muted-foreground">Receive instant alerts when a Mogul sells your product.</p>
                    </div>
                    <Switch checked={emailOnNewSales} onCheckedChange={setEmailOnNewSales} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-slate-800">
                    <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-200">Email on Concierge Replies</Label>
                    <p className="text-[10px] text-muted-foreground">Get notified when the support team responds to your tickets.</p>
                    </div>
                    <Switch checked={emailOnConciergeReplies} onCheckedChange={setEmailOnConciergeReplies} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-slate-800">
                    <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-200">Weekly Performance Reports</Label>
                    <p className="text-[10px] text-muted-foreground">A summary of your global sync counts and market reach.</p>
                    </div>
                    <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
                </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-primary/5">
                    <Button 
                        className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        onClick={handlePreferencesSave}
                        disabled={isSavingPrefs}
                    >
                        {isSavingPrefs ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Preferences
                    </Button>
                </div>
            </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-slate-200">
                <Lock className="h-5 w-5 text-primary" />
                Security
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-slate-800">
                    <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-200">Password Reset</Label>
                    <p className="text-[10px] text-muted-foreground">Dispatches a secure link.</p>
                    </div>
                    <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-primary/30 text-primary hover:bg-primary/10 h-8 text-[10px] uppercase font-bold"
                    onClick={handlePasswordReset}
                    disabled={isSendingReset}
                    >
                    {isSendingReset ? <Loader2 className="h-3 w-3 animate-spin" /> : "Send Link"}
                    </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-slate-800">
                    <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        2FA
                        <span className="text-[8px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase font-black">Elite</span>
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Multi-factor auth.</p>
                    </div>
                    <Switch disabled />
                </div>
                </div>
            </CardContent>
            </Card>

            <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-slate-200">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Verification
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border border-primary/10 bg-primary/5 italic text-[11px] text-slate-400">
                <p>Login: <span className="text-slate-200 font-mono">{user?.email}</span></p>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 opacity-60 grayscale cursor-not-allowed">
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 font-headline">Biometrics</h4>
                        <p className="text-[8px] text-slate-600 uppercase tracking-widest font-black">Coming v2.0</p>
                    </div>
                </div>
            </CardContent>
            </Card>

            <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
                </CardTitle>
                <CardDescription className="text-destructive/60">Destructive actions for your brand partnership.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-bold text-slate-200">Deactivate Account</Label>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Deactivating your account will hide your products from all Mogul stores and halt your global operations. Financial records will be preserved for audit.
                            </p>
                        </div>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    className="w-full font-bold h-11"
                                    disabled={isDeactivating}
                                >
                                    {isDeactivating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Deactivate Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-destructive/50">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-destructive font-headline text-2xl flex items-center gap-2">
                                        <AlertTriangle className="h-6 w-6" />
                                        Final Warning
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400 pt-2 text-base">
                                        Are you absolutely sure you wish to deactivate your brand? This will immediately remove your catalog from all global boutiques.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="pt-6">
                                    <AlertDialogCancel className="border-slate-700">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDeactivateAccount}
                                        className="bg-destructive hover:bg-destructive/90 text-white"
                                    >
                                        Deactivate Brand
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
            </Card>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex items-start gap-4 max-w-2xl mx-auto">
        <Key className="h-6 w-6 text-primary shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Global Security Standard</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            SOMA employs advanced encryption and session management to protect the integrity of the Master Catalog. 
            Passwords must contain at least 8 characters, including a special symbol.
          </p>
        </div>
      </div>
    </div>
  );
}
