'use client';

import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import SomaLogo from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const LegalContent = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    <div className="space-y-4">
        <h2 className="text-3xl font-headline text-primary border-b-2 border-primary/50 pb-2">Terms of Service</h2>
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground/80">1. License to Use</h3>
            <p>Upon successful payment of the setup fee, you are granted a non-exclusive, non-transferable, revocable license to use the SOMA store engine for the purpose of creating and operating a single online storefront. This license is contingent upon your adherence to these terms.</p>
        </div>
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground/80">2. Prohibited Content</h3>
            <p>You may not sell, offer, or display any illegal, counterfeit, or fraudulent goods. This includes, but is not limited to, items that infringe on third-party intellectual property rights. We reserve the right to suspend or terminate any store found in violation of this policy without notice.</p>
        </div>
    </div>

    <div className="space-y-4">
        <h2 className="text-3xl font-headline text-primary border-b-2 border-primary/50 pb-2">The SOMA Platform Governance Framework ⚖️</h2>
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground/80">1. The "Authenticity or Death" Policy (For Sellers)</h3>
            <p><strong>The Rule:</strong> All items uploaded to the Master Catalog must be 100% authentic. <strong>The Penalty:</strong> If a Seller is found to be providing "replicas" or "super-clones," their pending balance is forfeited to refund the victim, and their account is permanently banned. <strong>Indemnification:</strong> Sellers agree that SOMA is a facilitator and the Seller remains legally liable for trademark infringement.</p>
        </div>
         <div className="space-y-2">
            <h3 className="font-semibold text-foreground/80">2. The "3% SOMA Tax" & Payout Terms</h3>
            <p><strong>Platform Fee:</strong> SOMA deducts a non-negotiable 3% fee from the wholesale price of every dropshipped transaction. <strong>Hold Period:</strong> To prevent "churn and burn" fraud, payouts are held for 7–14 days (or until the customer confirms receipt) before moving from pending to available. <strong>Withdrawals:</strong> Manual processing by SOMA Admin takes 24–48 business hours.</p>
        </div>
         <div className="space-y-2">
            <h3 className="font-semibold text-foreground/80">3. Subscription & Store Ownership (For Moguls/Merchants)</h3>
            <p><strong>No Guarantees:</strong> SOMA provides the infrastructure and training, but does not guarantee sales. <strong>Tier Restrictions:</strong> Merchants ($19.99) are strictly prohibited from using SOMA Master Catalog assets. Moguls ($500) own their customer data but must adhere to SOMA's brand guidelines for "Luxury Presentation." <strong>Cancellation:</strong> Subscriptions are month-to-month. If a subscription lapses, the storefront is "Suspended" (visible to the owner but closed to the public) until payment is restored.</p>
        </div>
    </div>

    <div className="space-y-4">
        <h2 className="text-3xl font-headline text-primary border-b-2 border-primary/50 pb-2">No-Refund Policy</h2>
        <div className="rounded-lg border-2 border-primary bg-primary/10 p-6">
            <p className="font-semibold text-foreground">Due to the digital nature of the SOMA platform and the immediate delivery of the Master Catalog assets, all setup fees (including monthly and lifetime plans) are strictly non-refundable once the Store Cloning process has been initiated.</p>
        </div>
    </div>

    <div className="space-y-2">
        <h2 className="text-3xl font-headline text-primary border-b-2 border-primary/50 pb-2">Privacy & Data</h2>
        <p>We take your security seriously. All payments are processed securely via Paystack, a PCI-compliant payment gateway. SOMA does not store your full credit card details on our servers.</p>
    </div>
  </div>
);

export default function TermsPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    useEffect(() => {
        // If the user has already accepted the terms, redirect them to the dashboard.
        if (!profileLoading && userProfile?.hasAcceptedTerms) {
            router.push('/dashboard');
        }
    }, [userProfile, profileLoading, router]);

    const handleAgree = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to accept the terms.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { hasAcceptedTerms: true });
            toast({ title: 'Terms Accepted', description: 'Welcome to SOMA!' });
            router.push('/dashboard');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Could not save your acceptance.' });
            setIsSubmitting(false);
        }
    };

    const isLoading = userLoading || profileLoading;

    if (isLoading || (!profileLoading && userProfile?.hasAcceptedTerms)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-neutral-200 font-body">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <SomaLogo className="h-12 w-12 mx-auto" />
                    <h1 className="text-5xl font-bold font-headline mt-4 text-primary">Terms of Service</h1>
                    <p className="mt-2 text-lg text-neutral-400">Please review and accept the terms to continue.</p>
                </div>

                <LegalContent />

                <div className="text-center mt-12">
                    <Button 
                        size="lg" 
                        className="h-14 px-12 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={handleAgree}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'I Agree and Accept'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
