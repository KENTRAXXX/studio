'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, Building, MapPin, Send, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';

const Step1BusinessInfo = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Building className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-xl font-bold font-headline">Business Information</h3>
          <p className="text-muted-foreground">Tell us about your company.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="legal-name">Business Legal Name</Label>
          <Input id="legal-name" placeholder="e.g., Luxe Imports Inc." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-id">Business ID / Certificate</Label>
           <div className="flex items-center justify-center w-full">
                <label htmlFor="business-id" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted border-primary/30 hover:border-primary bg-card">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, or JPG</p>
                    </div>
                    <Input id="business-id" type="file" className="hidden" />
                </label>
            </div> 
        </div>
      </div>
       <div className="flex justify-end pt-4">
        <Button onClick={onNext}>Next: Warehouse</Button>
      </div>
    </div>
  );
};

const Step2Warehouse = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <MapPin className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-xl font-bold font-headline">Warehouse & Fulfillment</h3>
          <p className="text-muted-foreground">Where will you be shipping from?</p>
        </div>
      </div>
       <div className="space-y-2">
          <Label htmlFor="warehouse-location">Primary Warehouse Address</Label>
          <Input id="warehouse-location" placeholder="123 Supply Chain Ave, Industrial City" />
        </div>
       <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next: Submit</Button>
      </div>
    </div>
  );
};

const Step3Submit = ({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) => {
    return (
        <div className="space-y-6 text-center">
            <div className="flex items-center gap-4 justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                    <h3 className="text-xl font-bold font-headline">Review & Submit</h3>
                    <p className="text-muted-foreground">We'll review your application and get back to you.</p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                By submitting, you agree that our team will review your business information for verification. This process typically takes 2-3 business days. You will receive an email once your account is approved.
            </p>
            <div className="flex justify-between items-center pt-4">
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button onClick={onSubmit} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Send className="mr-2 h-5 w-5"/>
                    Submit for Review
                </Button>
            </div>
        </div>
    );
};


export default function BackstagePage() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isLoading = profileLoading || userLoading;
    if (!isLoading && userProfile?.planTier !== 'SELLER') {
      router.push('/access-denied');
    }
  }, [userProfile, profileLoading, userLoading, router]);

  const handleSubmit = async () => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to services.' });
        return;
    }
    setIsSubmitting(true);
    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            status: 'pending_review'
        });
        toast({ title: 'Application Submitted!', description: 'We will review your information and get back to you shortly.'});
        router.push('/dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const isLoading = profileLoading || userLoading || isSubmitting;
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userProfile?.planTier !== 'SELLER') {
      return null;
  }

  const progress = Math.round((step / 3) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
        <div className="text-center mb-10">
            <SomaLogo className="h-12 w-12 mx-auto" />
            <h1 className="text-4xl font-bold font-headline mt-4 text-primary">SOMA Seller Hub</h1>
            <p className="mt-2 text-lg text-muted-foreground">Supplier Onboarding</p>
        </div>
      
        <Card className="w-full max-w-2xl border-primary/50">
            <CardHeader>
                <Progress value={progress} className="h-2" />
            </CardHeader>
            <CardContent className="p-6 md:p-8">
                {step === 1 && <Step1BusinessInfo onNext={() => setStep(2)} />}
                {step === 2 && <Step2Warehouse onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                {step === 3 && <Step3Submit onBack={() => setStep(2)} onSubmit={handleSubmit} />}
            </CardContent>
        </Card>
    </div>
  );
}
