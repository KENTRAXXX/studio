
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SomaLogo from '@/components/logo';
import { motion } from 'framer-motion';
import { 
    Users, 
    DollarSign, 
    Zap, 
    Globe, 
    ShieldCheck, 
    ArrowRight,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * @fileOverview SOMA Ambassador Program Landing Page
 */
export default function AmbassadorLandingPage() {
    return (
        <div className="min-h-screen bg-black gold-mesh-gradient text-white flex flex-col items-center">
            {/* Header */}
            <header className="w-full p-6 flex justify-between items-center border-b border-primary/10">
                <Link href="/" className="flex items-center gap-2">
                    <SomaLogo />
                    <span className="font-headline font-bold text-xl text-primary tracking-tighter uppercase">SomaDS</span>
                </Link>
                <Button variant="ghost" asChild className="text-primary hover:bg-primary/5 font-bold">
                    <Link href="/login">Ambassador Login</Link>
                </Button>
            </header>

            <main className="container max-w-6xl py-20 px-4 space-y-32">
                {/* Hero Section */}
                <section className="text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black uppercase tracking-[0.2em]"
                    >
                        <Sparkles className="h-3 w-3" />
                        Professional Marketer Role
                    </motion.div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold font-headline max-w-4xl mx-auto text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary">
                        Evolve Your Influence into a Digital Empire.
                    </h1>
                    
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Become a SOMA Ambassador. Market the world's ultimate design system and earn professional yields for every partner you bring into the ecosystem.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Button asChild size="lg" className="h-16 px-10 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest">
                            <Link href="/signup?planTier=AMBASSADOR&interval=free">Join the Program</Link>
                        </Button>
                        <Button variant="ghost" className="text-slate-400 font-bold h-16">
                            Read the Ambassador Charter
                        </Button>
                    </div>
                </section>

                {/* Economics Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="bg-slate-900/40 border-primary/20 p-8 text-center space-y-4 hover:border-primary/50 transition-all duration-500">
                        <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-headline text-white">$5.00 Flat Bounty</h3>
                        <p className="text-muted-foreground text-sm">Earn a high-fidelity reward for every paid partner activation. No caps, no limits.</p>
                    </Card>

                    <Card className="bg-slate-900/40 border-primary/20 p-8 text-center space-y-4 hover:border-primary/50 transition-all duration-500">
                        <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            <Zap className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-headline text-white">20% Recruit Discount</h3>
                        <p className="text-muted-foreground text-sm">Your unique code unlocks exclusive strategic discounts for your recruits, making conversion effortless.</p>
                    </Card>

                    <Card className="bg-slate-900/40 border-primary/20 p-8 text-center space-y-4 hover:border-primary/50 transition-all duration-500">
                        <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            <Globe className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-headline text-white">Universal Attribution</h3>
                        <p className="text-muted-foreground text-sm">30-day tracking window ensures you never lose a commission to session drops or navigation.</p>
                    </Card>
                </section>

                {/* Workflow Section */}
                <section className="space-y-12">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold font-headline text-white">The Ambassador Workflow</h2>
                        <p className="text-muted-foreground mt-4">Simple, professional, and highly effective.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center font-black text-black">1</div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white">Initialize Your Account</h4>
                                    <p className="text-muted-foreground">Sign up for the free Ambassador tier and establish your strategic identity in the SOMA network.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center font-black text-black">2</div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white">Deploy Your Links</h4>
                                    <p className="text-muted-foreground">Receive your unique marketing kit including universal referral links and high-res promotional assets.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center font-black text-black">3</div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white">Capture Global Yield</h4>
                                    <p className="text-muted-foreground">Track conversions in real-time from your Command Center and request payouts directly to your bank.</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border-4 border-primary/20 bg-slate-900 shadow-2xl">
                            <Image 
                                src="https://picsum.photos/seed/ambassador-preview/800/800" 
                                alt="Ambassador Dashboard Preview" 
                                fill 
                                className="object-cover opacity-60 grayscale-[0.2]"
                                data-ai-hint="dashboard mobile"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Real-time Yield Counter</span>
                                </div>
                                <p className="text-3xl font-bold font-mono text-white">$450.00 EARNED</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="bg-primary/5 border border-primary/30 rounded-3xl p-12 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldCheck className="h-48 w-48 text-primary" />
                    </div>
                    <h2 className="text-4xl font-bold font-headline text-white">Ready to Market the Future?</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Join an elite force of professional marketers building the world's most sophisticated commerce network.
                    </p>
                    <Button asChild size="lg" className="h-16 px-12 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em]">
                        <Link href="/signup?planTier=AMBASSADOR&interval=free">Initialize My Role <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </section>
            </main>

            <footer className="w-full py-12 border-t border-white/5 text-center">
                <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-600">SOMA STRATEGIC ASSETS GROUP • AMBASSADOR DIVISION</p>
            </footer>
        </div>
    );
}
