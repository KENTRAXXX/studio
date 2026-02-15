'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit, or, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    ShieldCheck, 
    Loader2, 
    ArrowLeft,
    Box,
    Star,
    Truck,
    Activity,
    Zap,
    Award,
    TrendingUp,
    DollarSign,
    Users,
    Link as LinkIcon,
    Copy,
    Rocket,
    ExternalLink,
    ChevronRight,
    Trophy,
    Target,
    BarChart3,
    Clock,
    LayoutDashboard,
    MessageSquare,
    ChevronLeft,
    Check,
    Download,
    Share2,
    Wallet,
    Image as ImageIcon,
    Sparkles,
    Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';
import { useUserProfile } from '@/firebase/user-profile-provider';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import SomaLogo from '@/components/logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { toJpeg } from 'html-to-image';

/**
 * @fileOverview Ambassador Portal UI
 * Rendered when domain is 'ambassador'
 * Features a high-fidelity landing state for prospects and a sleek command center for active partners.
 */
function AmbassadorPortal() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [activeView, setActiveView] = useState<'dashboard' | 'wallet' | 'marketing'>('dashboard');
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const posterRef = useRef<HTMLDivElement>(null);

    // 1. Financial Telemetry
    const payoutsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'payouts_pending'), 
            where('userId', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user]);

    const maturityQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'payouts_pending'), 
            where('userId', '==', user.uid),
            where('status', '==', 'pending_maturity')
        );
    }, [firestore, user]);

    const { data: payoutDocs, loading: payoutsLoading } = useCollection(payoutsQuery);
    const { data: maturityDocs, loading: maturityLoading } = useCollection(maturityQuery);

    const availableBalance = useMemo(() => {
        if (!payoutDocs) return 0;
        return payoutDocs.reduce((acc, doc: any) => acc + (doc.amount || 0), 0);
    }, [payoutDocs]);

    const pendingMaturityBalance = useMemo(() => {
        if (!maturityDocs) return 0;
        return maturityDocs.reduce((acc, doc: any) => acc + (doc.amount || 0), 0);
    }, [maturityDocs]);

    const referralLink = userProfile?.referralCode 
        ? `https://somatoday.com/plan-selection?ref=${userProfile.referralCode}`
        : '';

    const handleCopy = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast({ title: 'Link Secured', description: 'Your personalized marketing link is ready.' });
    };

    const handleCopyScript = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Script Copied', description: 'Optimized copy ready for use.' });
    };

    const handleDownloadPoster = async () => {
        if (!posterRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toJpeg(posterRef.current, {
                quality: 0.95,
                width: 1080,
                height: 1920,
                cacheBust: true,
                skipFonts: true,
            });
            const link = document.createElement('a');
            link.download = `SOMA-Ambassador-${userProfile?.referralCode || 'Partner'}.jpg`;
            link.href = dataUrl;
            link.click();
            toast({ title: 'Asset Generated', description: 'High-res marketing card ready for social sharing.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: 'Visual render encountered a logic error.' });
        } finally {
            setIsExporting(false);
        }
    };

    if (profileLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';

    return (
        <div className="min-h-screen flex flex-col selection:bg-primary/30">
            <WithdrawalModal 
                isOpen={isWithdrawModalOpen}
                onOpenChange={setIsWithdrawModalOpen}
                availableBalance={availableBalance}
                userProfile={userProfile}
            />

            {/* Dedicated Marketer Header */}
            <header className="p-6 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-50">
                <Link href={`https://${rootDomain}`} className="flex items-center gap-2 group">
                    <SomaLogo aria-hidden="true" className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                    <span className="font-headline font-bold text-xl text-primary tracking-tighter uppercase transition-opacity group-hover:opacity-80">SOMA</span>
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-2">
                            {activeView !== 'dashboard' && (
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setActiveView('dashboard')}
                                    className="font-headline text-slate-400 hover:text-primary transition-colors"
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                                </Button>
                            )}
                            <div className="px-4 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                                <Wallet className="h-3 w-3 text-primary" />
                                <span className="text-xs font-mono font-bold text-primary">{formatCurrency(Math.round(availableBalance * 100))}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" asChild className="font-headline text-slate-400 hover:text-primary transition-all">
                                <Link href="/login">Partner Sign In</Link>
                            </Button>
                            <Button asChild className="font-headline bg-primary text-black font-bold hover:bg-primary/90">
                                <Link href="/signup?planTier=AMBASSADOR&interval=free">Claim Access</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full overflow-hidden">
                {!user ? (
                    /* High-Fidelity Prospect Landing State */
                    <div className="relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                        
                        <section className="container max-w-6xl mx-auto px-6 py-24 md:py-32 relative z-10 text-center space-y-16">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="space-y-8"
                            >
                                <div className="relative mx-auto w-fit">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 scale-150"
                                    />
                                    <div className="bg-primary/10 p-10 rounded-full border border-primary/30 shadow-gold-glow relative bg-black/40 backdrop-blur-sm">
                                        <Trophy className="h-24 w-24 text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-6 max-w-3xl mx-auto">
                                    <h1 className="text-5xl md:text-7xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-primary tracking-tight leading-[1.1]">
                                        The Marketer Role
                                    </h1>
                                    <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                                        Earn a flat <span className="text-primary font-bold">$5.00</span> bounty for every paid user you recruit. No inventory, no management—just results.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                                    <Button asChild size="lg" className="h-16 px-12 text-xl btn-gold-glow bg-primary font-black uppercase text-black group overflow-hidden relative">
                                        <Link href="/signup?planTier=AMBASSADOR&interval=free">
                                            <span className="relative z-10">Claim Access</span>
                                            <motion.div 
                                                className="absolute inset-0 bg-white/20"
                                                initial={{ x: '-100%' }}
                                                whileHover={{ x: '100%' }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="h-16 px-12 text-xl border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all">
                                        <Link href="/login">Partner Sign In</Link>
                                    </Button>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                                {[
                                    { icon: DollarSign, title: "Pure Yield", desc: "Flat $5.00 cash bounty for every Mogul activation. Scale without limits." },
                                    { icon: Zap, title: "Recruit Incentive", desc: "Your recruits get 20% off all plans. Faster conversions, higher yield." },
                                    { icon: Activity, title: "Real-time Ops", desc: "Track conversions, clicks, and earnings via your strategic command center." }
                                ].map((item, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-8 rounded-2xl bg-slate-900/40 border border-primary/10 backdrop-blur-md text-left group hover:border-primary/30 transition-all"
                                    >
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-bold font-headline text-slate-100 mb-2">{item.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>
                ) : (
                    /* Active Ambassador Command Suite */
                    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-10">
                        <AnimatePresence mode="wait">
                            {activeView === 'dashboard' && (
                                <motion.div 
                                    key="dashboard"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-10"
                                >
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div>
                                            <h1 className="text-4xl font-bold font-headline text-white flex items-center gap-3">
                                                <Target className="h-10 w-10 text-primary" />
                                                Command Center
                                            </h1>
                                            <p className="text-slate-500 mt-2 text-sm uppercase tracking-[0.4em] font-black">Performance Telemetry</p>
                                        </div>
                                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 shadow-gold-glow flex items-center gap-4 min-w-[200px]">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <BarChart3 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Yield Level</p>
                                                <p className="text-xl font-bold font-mono text-primary leading-none">$5.00 FLAT</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Card className="border-primary/10 bg-slate-900/40 backdrop-blur-sm group hover:border-primary/30 transition-all">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Marketing Yield</CardTitle>
                                                <DollarSign className="h-4 w-4 text-primary" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-bold text-slate-100 font-mono tracking-tighter">
                                                    {formatCurrency(Math.round((userProfile?.totalReferralEarnings || 0) * 100))}
                                                </div>
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-tighter mt-2 flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" /> Accrued Rewards
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-primary/10 bg-slate-900/40 backdrop-blur-sm group hover:border-primary/30 transition-all">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recruit Activity</CardTitle>
                                                <Users className="h-4 w-4 text-primary" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-4xl font-bold text-slate-100 font-mono tracking-tighter">{userProfile?.ambassadorData?.referralSignups || 0}</div>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold">Paid Conversions</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-bold text-slate-400 font-mono tracking-tighter">{userProfile?.ambassadorData?.referralClicks || 0}</div>
                                                        <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1 font-bold">Link Clicks</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-primary/10 bg-slate-900/40 backdrop-blur-sm group hover:border-primary/30 transition-all">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Partner Status</CardTitle>
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-xl font-bold text-primary uppercase tracking-widest">VERIFIED</div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold">SOMA Affiliate Protocol Active</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="border-primary bg-primary/5 p-10 relative overflow-hidden shadow-2xl group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <LinkIcon className="h-48 w-48" />
                                        </div>
                                        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                                            <div className="space-y-6 text-center lg:text-left flex-1">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em]">
                                                    <Zap className="h-3 w-3 fill-current" /> Auto-Attribution Active
                                                </div>
                                                <h2 className="text-3xl font-bold font-headline text-white leading-tight">
                                                    Universal Marketing Link
                                                </h2>
                                                <p className="text-slate-400 max-w-lg text-lg leading-relaxed">
                                                    Recruits arriving via this link automatically unlock their **20% discount** and secure your **$5.00 bounty**.
                                                </p>
                                            </div>
                                            <div className="w-full lg:w-auto space-y-4">
                                                <div className="p-5 rounded-xl bg-black/60 border border-primary/20 font-mono text-sm text-primary break-all shadow-inner">
                                                    {referralLink || 'Establishing secure link...'}
                                                </div>
                                                <Button onClick={handleCopy} size="lg" className="w-full lg:w-auto h-14 btn-gold-glow bg-primary font-black uppercase text-black text-lg">
                                                    <Copy className="mr-3 h-5 w-5" /> Copy Link
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4" /> Protocol Compliance
                                            </h3>
                                            <div className="space-y-4">
                                                {[
                                                    "Bounties trigger upon successful first subscription processing.",
                                                    "14-day hold period applies to prevent fraud and reversals.",
                                                    "Self-referrals trigger immediate status revocation."
                                                ].map((rule, i) => (
                                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/20 text-xs text-slate-400">
                                                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">{i+1}</div>
                                                        <p className="leading-relaxed">{rule}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4 justify-end">
                                            <Button 
                                                onClick={() => setActiveView('wallet')}
                                                size="lg" 
                                                className="h-16 text-lg font-black btn-gold-glow bg-primary text-black uppercase tracking-widest"
                                            >
                                                Access SOMA Wallet <DollarSign className="ml-2 h-6 w-6" />
                                            </Button>
                                            <Button 
                                                onClick={() => setActiveView('marketing')}
                                                variant="outline" 
                                                size="lg" 
                                                className="h-16 text-lg border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 uppercase tracking-widest font-bold"
                                            >
                                                Marketing Toolkit
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'wallet' && (
                                <motion.div 
                                    key="wallet"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="max-w-xl mx-auto space-y-8 pb-20"
                                >
                                    <div className="text-center space-y-2">
                                        <h2 className="text-3xl font-bold font-headline text-primary">SOMA Wallet</h2>
                                        <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Treasury & Payouts</p>
                                    </div>

                                    <Card className="border-primary bg-primary/5 text-center p-10 relative overflow-hidden shadow-gold-glow">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Wallet className="h-32 w-32" />
                                        </div>
                                        <CardHeader className="p-0">
                                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">Available for Withdrawal</p>
                                            <CardTitle className="text-6xl font-bold text-white font-mono tracking-tighter">
                                                {payoutsLoading ? <Loader2 className="animate-spin mx-auto h-10 w-10" /> : formatCurrency(Math.round(availableBalance * 100))}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 mt-8 space-y-6">
                                            <Button 
                                                size="lg" 
                                                disabled={availableBalance < 10}
                                                onClick={() => setIsWithdrawModalOpen(true)}
                                                className="w-full h-16 text-lg btn-gold-glow bg-primary text-black font-black uppercase tracking-widest"
                                            >
                                                {availableBalance < 10 ? `Min. ${formatCurrency(1000)} Required` : 'Initiate Payout'}
                                            </Button>
                                            <p className="text-[10px] text-slate-500 italic">Withdrawals are processed via verified bank transfer within 48 business hours.</p>
                                        </CardContent>
                                    </Card>

                                    {pendingMaturityBalance > 0 && (
                                        <div className="p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500/60">
                                                    <Clock className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-yellow-500/60 tracking-widest">Pending Maturity</p>
                                                    <p className="text-xl font-bold font-mono text-white">{formatCurrency(Math.round(pendingMaturityBalance * 100))}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-yellow-500/20 text-yellow-500/60 font-black text-[9px] uppercase">14 Day Hold</Badge>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Platform Integrity Protocol</h3>
                                        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 text-xs text-slate-400 leading-relaxed">
                                            All rewards are subject to a 14-day maturity window. This period allows the platform to verify the authenticity of the recruitment and prevent attribution fraud.
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'marketing' && (
                                <motion.div 
                                    key="marketing"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10 pb-20"
                                >
                                    <div className="text-center space-y-2">
                                        <h2 className="text-3xl font-bold font-headline text-primary">Marketing Toolkit</h2>
                                        <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Conversion Accelerators</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                        {/* Swipe Copy Tools */}
                                        <div className="space-y-6">
                                            <Card className="border-primary/20 bg-slate-900/40 p-8 space-y-6">
                                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <MessageSquare className="h-6 w-6" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-white font-headline">Proven Swipe Copy</h3>
                                                    <p className="text-sm text-slate-500 leading-relaxed">High-performance scripts optimized for rapid conversions.</p>
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        "Launch your luxury empire in 5 minutes with @SomaExecutive. Get 20% off all setup tiers using my link...",
                                                        "Stop building on rented land. Own your customer data and luxury branding with SOMA. Access my partner discount here...",
                                                        "From concept to storefront in 300 seconds. No inventory, no code, no limits. Join the elite network today..."
                                                    ].map((script, i) => (
                                                        <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                                            <p className="text-xs text-slate-300 italic leading-relaxed">"{script}"</p>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => handleCopyScript(script)}
                                                                className="h-7 text-[9px] uppercase font-black text-primary hover:bg-primary/5 p-0"
                                                            >
                                                                Copy Script
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>

                                            <Card className="border-primary/20 bg-slate-900/40 p-8 space-y-6">
                                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <ImageIcon className="h-6 w-6" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-white font-headline">Brand Asset Pack</h3>
                                                    <p className="text-sm text-slate-500 leading-relaxed">Official SOMA visuals for professional promotion.</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="aspect-video relative rounded-lg overflow-hidden border border-white/5 group">
                                                            <img src={`https://picsum.photos/seed/soma-asset-${i}/400/225`} className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Platform Visual" />
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white"><Download className="h-4 w-4"/></Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 h-12 font-bold uppercase tracking-widest">
                                                    <Download className="mr-2 h-4 w-4" /> All Assets (.ZIP)
                                                </Button>
                                            </Card>
                                        </div>

                                        {/* Live Asset Generator */}
                                        <div className="space-y-6 lg:sticky lg:top-24">
                                            <Card className="border-primary/50 bg-primary/5 p-8 space-y-6 shadow-gold-glow">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-white font-headline flex items-center gap-2">
                                                        <Sparkles className="h-5 w-5 text-primary" />
                                                        Asset Generator
                                                    </h3>
                                                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live Engine</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="relative aspect-[9/16] w-full max-w-[300px] mx-auto rounded-xl border-4 border-black/40 shadow-2xl overflow-hidden bg-slate-900">
                                                    {/* The Canvas (Hidden scaled representation) */}
                                                    <div 
                                                        ref={posterRef}
                                                        className="absolute inset-0 bg-black flex flex-col items-center justify-between py-20 px-10 text-center"
                                                        style={{ width: '1080px', height: '1920px', transform: 'scale(0.2777)', transformOrigin: 'top left' }}
                                                    >
                                                        <div className="absolute inset-8 border-[6px] border-primary/40 pointer-events-none" />
                                                        <div className="space-y-10 z-10 pt-10">
                                                            <SomaLogo className="h-24 w-24 text-primary mx-auto" />
                                                            <h2 className="text-7xl font-headline font-black text-primary uppercase tracking-[0.2em]">SOMA EXECUTIVE</h2>
                                                        </div>
                                                        <div className="space-y-12 z-10 w-full px-10">
                                                            <div className="space-y-4">
                                                                <p className="text-3xl font-headline uppercase tracking-[0.4em] text-slate-400">Exclusive Partner Invitation</p>
                                                                <h3 className="text-8xl font-headline font-black text-white leading-tight">UNLOCK THE ECOSYSTEM</h3>
                                                            </div>
                                                            <div className="p-10 rounded-2xl bg-primary/10 border-2 border-primary/30 space-y-4">
                                                                <p className="text-2xl font-bold text-primary uppercase tracking-widest">Partner Privilege Code</p>
                                                                <p className="text-9xl font-mono font-black text-white tracking-widest">{userProfile?.referralCode || 'ELITE'}</p>
                                                            </div>
                                                            <p className="text-2xl text-slate-500 uppercase tracking-[0.5em] font-medium pt-10">Verification required at somatoday.com</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button 
                                                    onClick={handleDownloadPoster}
                                                    disabled={isExporting}
                                                    className="w-full h-14 text-lg btn-gold-glow bg-primary text-black font-black uppercase tracking-widest"
                                                >
                                                    {isExporting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Rendering...</> : <><Download className="mr-2 h-5 w-5" /> Download Story Asset</>}
                                                </Button>
                                                
                                                <p className="text-[10px] text-muted-foreground text-center italic">
                                                    Generates a branded 1080x1920 Story asset with your unique partner code embedded.
                                                </p>
                                            </Card>

                                            <Card className="border-primary/20 bg-slate-900/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="space-y-2 flex-1 text-center md:text-left">
                                                    <h3 className="text-lg font-bold text-white font-headline">Custom Creative HQ</h3>
                                                    <p className="text-xs text-slate-500">Need specific banners for your campaign? Reach out to our design team.</p>
                                                </div>
                                                <Button asChild variant="outline" className="h-12 px-6 border-primary/30 text-primary hover:bg-primary/5 font-bold uppercase tracking-widest">
                                                    <Link href="/backstage/concierge">Contact Creative</Link>
                                                </Button>
                                            </Card>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </main>
            
            <footer className="p-12 border-t border-primary/10 bg-black/50 text-center relative z-10">
                <p className="text-[10px] uppercase tracking-[0.6em] text-slate-600 font-black">SOMA Strategic Assets Group</p>
            </footer>
        </div>
    );
}

export default function TenantBoutiquePage() {
    const params = useParams();
    const identifier = params.domain as string; 
    const isAmbassadorPortal = identifier?.toLowerCase().startsWith('ambassador');
    
    if (isAmbassadorPortal) {
        return <AmbassadorPortal />;
    }

    const router = useRouter();
    const firestore = useFirestore();

    const storeQuery = useMemoFirebase(() => {
        if (!firestore || !identifier) return null;
        
        const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
        const normalizedIdentifier = identifier.toLowerCase();
        
        let slug = normalizedIdentifier;
        if (normalizedIdentifier.endsWith(`.${rootDomain}`)) {
            slug = normalizedIdentifier.replace(`.${rootDomain}`, '');
        }
        if (slug.startsWith('www.')) {
            slug = slug.replace('www.', '');
        }

        return query(
            collection(firestore, 'stores'),
            or(
                where('userId', '==', slug), 
                where('customDomain', '==', normalizedIdentifier), 
                where('slug', '==', slug) 
            ),
            limit(1)
        );
    }, [firestore, identifier]);

    const { data: storeDocs, loading: storeLoading } = useCollection<any>(storeQuery);
    const storeData = storeDocs?.[0];
    const storeId = storeData?.userId;

    const ownerRef = useMemoFirebase(() => {
        if (!firestore || !storeId) return null;
        return doc(firestore, 'users', storeId);
    }, [firestore, storeId]);

    const { data: ownerProfile, loading: ownerLoading } = useDoc<any>(ownerRef);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !storeId) return null;
        return query(collection(firestore, `stores/${storeId}/products`));
    }, [firestore, storeId]);

    const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

    const isLoading = storeLoading || ownerLoading || productsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!storeData) {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background px-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Box className="h-16 w-16 text-primary opacity-20" />
                </div>
                <h1 className="text-3xl font-bold font-headline text-primary uppercase tracking-widest text-center">Boutique Not Found</h1>
                <p className="text-muted-foreground text-center max-w-sm">
                    The boutique at "{identifier}" is not currently provisioned in our network.
                </p>
                <Button variant="outline" className="border-primary/50" asChild>
                    <Link href={`https://${rootDomain}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Platform Home
                    </Link>
                </Button>
            </div>
        );
    }

    const storeName = storeData.storeName || "Elite Boutique";
    const heroSubtitle = storeData.heroSubtitle || "Curated masterpieces for the discerning individual.";
    const heroImageUrl = storeData.heroImageUrl || PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <StoreVisitorTracker storeId={storeId} />
            
            <div className="relative h-[400px] w-full overflow-hidden">
                <Image 
                    src={ownerProfile?.coverPhotoUrl || heroImageUrl || ""} 
                    alt="Brand Banner"
                    fill
                    className="object-cover opacity-40 grayscale-[0.2]"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                <div className="container relative h-full flex flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8 mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        <div className="relative h-32 w-32 rounded-2xl overflow-hidden border-4 border-background bg-slate-950 shadow-2xl shrink-0">
                            {storeData.logoUrl || ownerProfile?.avatarUrl ? (
                                <img src={storeData.logoUrl || ownerProfile?.avatarUrl} alt={storeName} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-primary bg-primary/10">
                                    {storeName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-4xl font-bold font-headline tracking-tighter text-white">
                                    {storeName}
                                </h1>
                                {ownerProfile?.status === 'approved' && (
                                    <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[10px] flex items-center gap-1.5 rounded-full">
                                        <ShieldCheck className="h-3 w-3" />
                                        SOMA VERIFIED
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-300 text-lg max-w-2xl italic font-medium">
                                {ownerProfile?.brandBio || heroSubtitle}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container py-16 px-4 sm:px-6 lg:px-8 mx-auto">
                <section id="collection" className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/10 pb-8 gap-4">
                        <div>
                            <h2 className="text-4xl font-bold font-headline text-slate-200 uppercase tracking-tighter">Signature Collection</h2>
                            <p className="text-slate-500 mt-2">Discover curated luxury from the {storeName} archives.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                            <Zap className="h-4 w-4 text-primary fill-primary" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Real-time Global Sync Active</span>
                        </div>
                    </div>

                    <ProductGrid products={products || []} storeId={storeId} />
                </section>
            </main>
        </div>
    );
}
