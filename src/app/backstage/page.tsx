'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useFirestore, useUser, useAuth } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, ShieldCheck, CheckCircle2, UploadCloud, MapPin, AlertTriangle, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { uploadToCloudinary } from '@/lib/utils/upload-image';
import { AddressSearch, type AddressResult } from '@/components/ui/address-search';
import { CompletePaymentPrompt } from '@/components/complete-payment-prompt';

// Lazy load the map component to ensure edge compatibility and prevent SSR errors
const SomaMap = dynamic(() => import('@/components/ui/soma-map'), { 
  ssr: false,
  loading: () => (
    <div className="h-48 w-full rounded-xl bg-slate-900/50 border border-primary/10 flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    </div>
  )
});

const onboardingSchema = z.object({
  legalBusinessName: z.string().min(3, 'A business name is required.'),
  warehouseAddress: z.string().min(5, 'Please select a verified address from the suggestions.'),
  taxId: z.string().min(5, 'A valid Tax ID or Business Number is required.'),
  contactPhone: z.string().min(10, 'A valid contact phone number is required.'),
  governmentIdUrl: z.string().url({ message: 'A valid ID document URL is required.' }).min(1, 'Please provide your government ID.'),
  city: z.string().min(1, 'Verified city is missing.'),
  country: z.string().min(1, 'Verified country is missing.'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const SomaShieldTerms = () => (
    <div className="space-y-3 text-sm text-muted-foreground">
        <div className="space-y-1">
            <h4 className="font-semibold text-foreground">1. Authenticity Guarantee</h4>
            <p>The Seller warrants that all items listed are 100% authentic and legally obtained. SOMA maintains a Zero-Tolerance Policy for counterfeits. If a fake is detected, the Seller's account will be banned, and all pending payouts will be frozen for legal review.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">2. Fulfillment & Shipping</h4>
            <p>Sellers agree to ship orders within 3–5 business days of receiving notification. The Seller is responsible for providing valid tracking information. Failure to ship on time may result in order cancellation and a penalty fee.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">3. The "No-Circumvention" Rule</h4>
            <p>Sellers must not attempt to contact Moguls or Customers to complete transactions outside of the SOMA platform. Any attempt to bypass the SOMA/Paystack fee structure will result in immediate termination of the partnership.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">4. Financial Processing & Payouts</h4>
            <p><strong>Centralized Financial Processing</strong>: SOMA serves as the Merchant of Record for all transactions. Customer payments are processed centrally through our secure system. Your earnings (Wholesale Price minus the applicable SOMA commission) are logged to your `payouts_pending` ledger immediately after a sale. <strong>Payout Availability</strong>: To protect against fraud and accommodate customer returns, these pending funds become available for withdrawal only after the order's return window has closed (typically 7 days). <strong>Hold Period</strong>: To prevent fraud, payouts are held for a 7–14 day period before becoming available for withdrawal. <strong>Withdrawals</strong>: Payout requests are processed by SOMA Admin within 24–48 business hours.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">5. Return Policy</h4>
            <p>Sellers must define their return policy (e.g., "Returns accepted for 14 days" or "Final Sale"). However, SOMA reserves the right to force a refund if the item is "Not as Described."</p>
        </div>
    </div>
);

export default function BackstagePage() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);

  const isActionRequired = userProfile?.status === 'action_required';

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
    defaultValues: {
        legalBusinessName: '',
        warehouseAddress: '',
        city: '',
        country: '',
        taxId: '',
        contactPhone: '',
        governmentIdUrl: '',
    },
  });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    const isLoading = profileLoading || userLoading;
    if (!isLoading && userProfile) {
        if (userProfile.userRole === 'ADMIN') {
            router.push('/admin');
            return;
        }
        if (userProfile.planTier !== 'SELLER' && userProfile.planTier !== 'BRAND') {
            router.push('/access-denied');
            return;
        }
        if (userProfile.status === 'approved') {
            router.push('/backstage/finances');
            return; 
        }
        if (userProfile.status === 'pending_review') {
            router.push('/backstage/pending-review');
            return;
        }
        
        if (userProfile.verificationData) {
            form.reset({
                legalBusinessName: userProfile.verificationData.legalBusinessName || '',
                warehouseAddress: userProfile.verificationData.warehouseAddress || '',
                city: userProfile.verificationData.structuredAddress?.city || '',
                country: userProfile.verificationData.structuredAddress?.country || '',
                taxId: userProfile.verificationData.taxId || '',
                contactPhone: userProfile.verificationData.contactPhone || '',
                governmentIdUrl: userProfile.verificationData.governmentIdUrl || '',
                latitude: userProfile.verificationData.latitude,
                longitude: userProfile.verificationData.longitude,
            });
            if (userProfile.verificationData.governmentIdUrl) {
                setUploadComplete(true);
            }
            if (userProfile.verificationData.latitude && userProfile.verificationData.longitude) {
                setMapCoords([userProfile.verificationData.latitude, userProfile.verificationData.longitude]);
            }
        }
    }
  }, [userProfile, profileLoading, userLoading, router, form]);

  const handleAddressSelect = (result: AddressResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    form.setValue('warehouseAddress', result.display_name, { shouldValidate: true });
    form.setValue('city', result.address.city || result.address.town || result.address.village || '', { shouldValidate: true });
    form.setValue('country', result.address.country || '', { shouldValidate: true });
    form.setValue('latitude', lat);
    form.setValue('longitude', lon);
    
    setMapCoords([lat, lon]);
    toast({ title: 'Location Verified', description: 'Address provenance synchronized with OSM registry.' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore) return;

    setIsUploading(true);
    setUploadComplete(false);

    try {
        const downloadUrl = await uploadToCloudinary(file);
        form.setValue('governmentIdUrl', downloadUrl, { shouldValidate: true });
        setUploadComplete(true);
        toast({ title: 'ID Secured', description: 'Your identity document has been uploaded to Cloudinary.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Could not upload document.' });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = async (data: OnboardingFormValues) => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to services.' });
        return;
    }

    if (!agreedToTerms) {
        toast({ variant: 'destructive', title: 'Agreement Required', description: 'Please read and agree to the SOMA Shield Terms.' });
        return;
    }
    
    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            verificationData: {
                legalBusinessName: data.legalBusinessName,
                warehouseAddress: data.warehouseAddress,
                structuredAddress: {
                    city: data.city,
                    country: data.country,
                },
                taxId: data.taxId,
                contactPhone: data.contactPhone,
                governmentIdUrl: data.governmentIdUrl,
                isPhoneVerified: true, 
                latitude: data.latitude,
                longitude: data.longitude,
            },
            legalAgreements: {
                termsAccepted: true,
                acceptedAt: serverTimestamp(),
                termsVersion: '1.0',
            },
            status: 'pending_review',
            hasAcceptedTerms: true,
            verificationFeedback: null, 
        });
        
        toast({ title: 'Application Submitted!', description: 'Your business is now under review.'});
        router.push('/backstage/pending-review');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    }
  };

  const isLoading = profileLoading || userLoading;
  if (isLoading) {
    return null;
  }

  // Session guard for logout
  if (!user) return null;

  // Payment Gatelock: Brands must pay before onboarding
  if (userProfile && !userProfile.hasAccess) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
              <CompletePaymentPrompt />
          </div>
      );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
        <div className="text-center mb-10">
            <SomaLogo className="h-12 w-12 mx-auto" />
            <h1 className="text-4xl font-bold font-headline mt-4 text-primary">SOMA Seller Hub</h1>
            <p className="mt-2 text-lg text-muted-foreground">Supplier Onboarding</p>
        </div>
      
        <div className="w-full max-w-2xl space-y-6">
            {userProfile?.verificationFeedback && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle className="font-bold">Updates Required</AlertTitle>
                    <AlertDescription className="mt-2">
                        Our review team requires you to update your application:
                        <p className="mt-1 font-semibold italic">"{userProfile.verificationFeedback}"</p>
                    </AlertDescription>
                </Alert>
            )}

            <Card className="border-primary/50">
                <div className="p-0">
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                Seller Verification
                            </CardTitle>
                            <CardDescription>
                                Please provide your business details for our quality control team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="legalBusinessName" render={({ field }) => (
                                        <FormItem><FormLabel>Business Legal Name</FormLabel><FormControl><Input placeholder="e.g., Luxe Imports Inc." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    
                                    <div className="space-y-4">
                                        <FormLabel className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-primary"/>
                                            Warehouse Provenance (OSM Verified)
                                        </FormLabel>
                                        <AddressSearch 
                                            onSelect={handleAddressSelect}
                                            defaultValue={form.getValues('warehouseAddress')}
                                        />
                                        
                                        {mapCoords && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                <SomaMap 
                                                    center={mapCoords} 
                                                    className="h-48 w-full mt-2 grayscale-[0.5] rounded-xl overflow-hidden border border-primary/20"
                                                />
                                            </motion.div>
                                        )}
                                        <FormMessage>{form.formState.errors.warehouseAddress?.message}</FormMessage>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="taxId" render={({ field }) => (
                                            <FormItem><FormLabel>Tax ID / Business Number</FormLabel><FormControl><Input placeholder="Your business registration number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="contactPhone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact Phone</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="+15551234567" 
                                                        {...field} 
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormDescription>Official contact number for fulfillment alerts.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    
                                    <FormField control={form.control} name="governmentIdUrl" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Government ID Document</FormLabel>
                                            <FormControl>
                                                <div className="flex flex-col gap-4">
                                                    <div 
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => (!uploadComplete || isActionRequired) && fileInputRef.current?.click()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                (!uploadComplete || isActionRequired) && fileInputRef.current?.click();
                                                            }
                                                        }}
                                                        aria-label="Upload Government ID Document"
                                                        className={cn(
                                                            "w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                                            (uploadComplete && !isActionRequired) ? "border-green-500 bg-green-500/5 cursor-default" : "border-primary/30 hover:border-primary bg-muted/20",
                                                            isUploading && "opacity-50 cursor-wait"
                                                        )}
                                                    >
                                                        {isUploading ? (
                                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                        ) : (uploadComplete && !isActionRequired) ? (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                                                                <p className="text-sm font-medium text-green-500">ID Secured in Cloudinary</p>
                                                            </motion.div>
                                                        ) : (
                                                            <>
                                                                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                                                <span className="text-sm font-medium">Click to upload ID document</span>
                                                                <span className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG (Max 10MB)</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        className="hidden" 
                                                        accept="image/*,.pdf" 
                                                        onChange={handleFileUpload} 
                                                        disabled={isUploading || (uploadComplete && !isActionRequired)}
                                                    />
                                                    <Input type="hidden" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormDescription>A clear scan or photo of your passport, license, or national ID.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <div className="space-y-4 pt-4">
                                        <h3 className="font-semibold text-primary">SOMA Shield: Seller Terms of Service</h3>
                                        <ScrollArea className="h-48 w-full rounded-md border border-border p-4">
                                            <SomaShieldTerms />
                                        </ScrollArea>
                                        <div className="flex items-start space-x-3 pt-2">
                                            <Checkbox 
                                                id="terms" 
                                                checked={agreedToTerms}
                                                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor="terms"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                I have read and agree to the SOMA Seller Terms of Service.
                                                </label>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="flex justify-end pt-4">
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting || !agreedToTerms || !uploadComplete} 
                                            size="lg" 
                                            className="h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 h-5 w-5"/>Submit for Review</>}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </motion.div>
                </div>
            </Card>
        </div>
    </div>
  );
}
