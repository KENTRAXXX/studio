'use client';

import SomaLogo from '@/components/logo';

const PrivacySection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-headline text-primary border-b border-primary/20 pb-2 uppercase tracking-widest">{title}</h2>
    <div className="text-neutral-400 leading-relaxed space-y-4">
      {children}
    </div>
  </div>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-200 font-body selection:bg-primary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-5xl">
            <div className="text-center mb-20 space-y-4">
                <SomaLogo className="h-16 w-16 mx-auto text-primary" />
                <h1 className="text-5xl md:text-6xl font-black font-headline text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary tracking-tighter uppercase">
                    Privacy Protocol
                </h1>
                <p className="text-neutral-500 uppercase tracking-[0.3em] text-sm">SOMA Strategic Assets Group | Security Directive</p>
                <div className="w-24 h-1 bg-primary mx-auto mt-8" />
            </div>

            <div className="space-y-16">
                <PrivacySection title="1. Data Sovereignty">
                    <p>At SOMA, we recognize that in the luxury e-commerce ecosystem, data is the ultimate asset. We collect only what is essential for technical orchestration: your professional identity, business credentials, and store configuration telemetry.</p>
                    <p>Your customer data is your own. SOMA acts as the custodian, providing the infrastructure to store and synchronize this data across the global Master Catalog without compromising individual privacy.</p>
                </PrivacySection>

                <PrivacySection title="2. Financial Telemetry">
                    <p>Financial transactions are the pulse of our platform. While we facilitate the flow of funds from Mogul boutiques to the SOMA Treasury and ultimately to your Wallet, we never see or store your customers' full credit card details. This critical data is handled exclusively by our PCI-DSS Level 1 compliant partners (Paystack).</p>
                    <p>We process bank account details solely for the purpose of fulfilling your "Initiate Payout" requests and ensuring accurate commission distribution for our Ambassador network.</p>
                </PrivacySection>

                <PrivacySection title="3. Orchestration & Analytics">
                    <p>To maintain "Platform Pulse" and real-time "Live Counter" accuracy, we utilize sophisticated tracking technologies. This includes behavioral telemetry within the dashboard and store visitor tracking. This data is used to optimize the "Executive Experience" and provide you with strategic sales insights.</p>
                </PrivacySection>

                <PrivacySection title="4. Deployment & Hosting">
                    <p>By deploying a store on the SOMA domain or your own custom domain, you acknowledge that certain metadata (SSL status, domain DNS records, and brand configuration) is processed by our automated provisioning engine to ensure high-availability and security.</p>
                </PrivacySection>

                <PrivacySection title="5. Strategic Disclosure">
                    <p>We do not sell data. We do not barter with your insights. Disclosure only occurs in direct response to "Authenticity or Death" policy violations (fraud prevention) or when legally mandated by governing financial authorities.</p>
                </PrivacySection>

                <div className="pt-20 border-t border-primary/10 text-center">
                    <p className="text-xs text-neutral-600 uppercase tracking-widest">Effective Date: March 21, 2026</p>
                    <p className="text-xs text-neutral-600 uppercase tracking-widest mt-2">© 2026 SOMA Strategic Assets Group. All Protocols Reserved.</p>
                </div>
            </div>
        </div>
    </div>
  );
}
