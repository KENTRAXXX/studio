'use client';

import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import TradeWyseLogo from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const TermsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-headline text-primary border-b border-primary/20 pb-2 uppercase tracking-widest">{title}</h2>
    <div className="text-neutral-400 leading-relaxed space-y-4">
      {children}
    </div>
  </div>
);

export default function TermsPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            toast({ title: 'Terms Accepted', description: 'Welcome to Trade Wyse!' });
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
        <div className="min-h-screen bg-black text-neutral-200 font-body selection:bg-primary/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-5xl">
                <div className="text-center mb-20 space-y-4">
                    <TradeWyseLogo className="h-16 w-16 mx-auto text-primary" />
                    <h1 className="text-5xl md:text-6xl font-black font-headline text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary tracking-tighter uppercase">
                        Terms of Protocol
                    </h1>
                    <p className="text-neutral-500 uppercase tracking-[0.3em] text-sm">Trade Wyse Strategic Assets Group | Operational Mandate</p>
                    <div className="w-24 h-1 bg-primary mx-auto mt-8" />
                </div>

                <div className="space-y-16">
                    <TermsSection title="1. Protocol Activation & Node Provisioning">
                        <p>By initializing a Trade Wyse node (Merchant, Mogul, or Enterprise), you are entering into a strategic partnership with the Trade Wyse Strategic Assets Group. Activation involves the immediate provisioning of high-fidelity store assets, Master Catalog synchronization, and automated domain routing.</p>
                        <p>You are responsible for the configuration of your node, including the accuracy of your brand identity and the security of your executive credentials. Trade Wyse provides the infrastructure; you provide the vision.</p>
                    </TermsSection>

                    <TermsSection title="2. Master Catalog & Authenticity Governance">
                        <p><strong>Universal Synchronization:</strong> The Trade Wyse Master Catalog is a curated repository of luxury assets. Users are granted a revocable license to synchronize these assets with their storefronts based on their subscription tier.</p>
                        <p><strong>The "Authenticity or Death" Policy:</strong> Trade Wyse maintains a zero-tolerance mandate regarding counterfeit or "replica" goods. All products introduced by Sellers must be 100% authentic. Violation of this protocol results in immediate node termination, permanent status ban, and the liquidation of all pending treasury balances to indemnify the ecosystem.</p>
                    </TermsSection>

                    <TermsSection title="3. Financial Orchestration & Treasury Services">
                        <p><strong>Centralized Processing:</strong> Trade Wyse acts as the primary financial orchestrator for all internal transactions. Payments are processed via Paystack and distributed to your Trade Wyse Wallet after a mandatory 7-14 day maturity window.</p>
                        <p><strong>Treasury Fees:</strong> Trade Wyse reserves the right to deduct platform orchestration fees and commissions as defined by your active tier. These fees are non-negotiable and are deducted at the point of transaction.</p>
                    </TermsSection>

                    <TermsSection title="4. Subscription Lifecycle & No-Refund Mandate">
                        <p><strong>Immediate Yield:</strong> Due to the immediate delivery of digital architecture and Master Catalog access, all setup fees and subscription payments are strictly non-refundable once the node provisioning sequence has commenced.</p>
                        <p><strong>Operational Continuity:</strong> Lapsed subscriptions result in 'Node Suspension.' Your store front will be hidden from the public, but your data residency is maintained for a grace period of 30 days before permanent archival.</p>
                    </TermsSection>

                    <TermsSection title="5. Protocol Compliance & Conduct">
                        <p>Executive users must conduct themselves with the professional integrity expected within the Trade Wyse network. This includes accurate marketing (Ambassador Protocol), ethical customer service, and adherence to global e-commerce regulations.</p>
                    </TermsSection>

                    <div className="text-center pt-12 space-y-8">
                        <Button 
                            size="lg" 
                            className="h-16 px-16 text-2xl btn-gold-glow bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest"
                            onClick={handleAgree}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Accept Operational Protocol'}
                        </Button>
                        <div className="pt-20 border-t border-primary/10">
                            <p className="text-xs text-neutral-600 uppercase tracking-widest">Effective Date: March 21, 2026</p>
                            <p className="text-xs text-neutral-600 uppercase tracking-widest mt-2">© 2026 Trade Wyse Strategic Assets Group. All Mandates Active.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
