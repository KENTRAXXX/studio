'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SomaLogo from '@/components/logo';
import { motion } from 'framer-motion';
import { Megaphone, DollarSign, Zap, Globe, Share2, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AmbassadorLandingPage() {
    return (
        <div className="min-h-screen bg-black gold-mesh-gradient text-white selection:bg-primary/30">
            {/* Header */}
            <header className="container mx-auto p-6 flex justify-between items-center relative z-10">
                <Link href="/" className="flex items-center gap-2">
                    <SomaLogo />
                    <span className="font-headline font-bold text-xl text-primary uppercase tracking-tighter">SomaDS</span>
                </Link>
                <div className="flex gap-4">
                    <Button variant="ghost" asChild className="text-primary hover:bg-primary/5">
                        <Link href="/login">Marketer Login</Link>
                    </Button>
                    <Button asChild className="btn-gold-glow bg-primary text-primary-foreground font-bold">
                        <Link href="/signup?planTier=AMBASSADOR&interval=free">Join the Elite</Link>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto pt-20 pb-32 px-4 relative z-10">
                {/* Hero */}
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest"
                    >
                        <Megaphone className="h-3.5 w-3.5" />
                        The SOMA Ambassador Program is Live
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold font-headline tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary"
                    >
                        Turn Influence into <br /> Operational Yield.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    >
                        Establish your marketing legacy with SOMA. Earn a flat <span className="text-primary font-bold">$5.00 reward</span> for every paid Mogul you bring to the ecosystem. No caps, no complexity.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button asChild size="lg" className="h-16 px-12 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest">
                            <Link href="/signup?planTier=AMBASSADOR&interval=free">Claim Your Marketer ID</Link>
                        </Button>
                    </motion.div>
                </div>

                {/* Economic Engine */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="bg-slate-900/40 border-primary/20 p-8 text-center hover:border-primary/50 transition-colors">
                        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                            <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-headline text-primary mb-2">$5.00 Per Signup</h3>
                        <p className="text-muted-foreground text-sm">Every verified Mogul or Merchant activation triggers an immediate $5.00 bounty to your wallet.</p>
                    </Card>

                    <Card className="bg-slate-900/40 border-primary/20 p-8 text-center hover:border-primary/50 transition-colors">
                        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                            <Zap className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-headline text-primary mb-2">Exclusive Discount</h3>
                        <p className="text-muted-foreground text-sm">Your recruits unlock a 20% discount on all SOMA plans, making your conversion link highly valuable.</p>
                    </Card>

                    <Card className="bg-slate-900/40 border-primary/20 p-8 text-center hover:border-primary/50 transition-colors">
                        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                            <Share2 className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-headline text-primary mb-2">Instant Marketing Kit</h3>
                        <p className="text-muted-foreground text-sm">Access high-fidelity assets, story templates, and live conversion tracking in your dashboard.</p>
                    </Card>
                </div>

                {/* Trust Seal */}
                <div className="mt-32 flex flex-col items-center gap-6 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Secured by the SOMA Shield</p>
                    <div className="flex gap-8">
                        <ShieldCheck className="h-8 w-8" />
                        <Globe className="h-8 w-8" />
                        <TrendingUp className="h-8 w-8" />
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 text-center text-slate-600 text-xs">
                <p>&copy; {new Date().getFullYear()} SOMA Strategic Assets Group. All Referral standards apply.</p>
            </footer>
        </div>
    );
}
