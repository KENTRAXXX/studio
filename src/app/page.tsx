'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SomaLogo from '@/components/logo';
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, DollarSign, Boxes, Check, Rocket, Gem, Users, ShieldCheck, Loader2 } from 'lucide-react';
import AnimatedCounter from '@/components/ui/animated-counter';
import Image from 'next/image';
import { useToastWithRandomCity } from '@/hooks/use-toast-with-random-city';
import { LiveFeedTicker } from '@/components/ui/live-feed-ticker';
import { useUser } from '@/firebase';

/**
 * Constants for deterministic growth calculation.
 * Using a fixed launch date: July 1, 2024.
 */
const LAUNCH_DATE = new Date('2024-07-01T00:00:00Z');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function LiveCounter() {
  const [count, setCount] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const calculateStoreCount = () => {
      const now = new Date();
      const daysSinceLaunch = Math.max(0, (now.getTime() - LAUNCH_DATE.getTime()) / MS_PER_DAY);
      
      const initialStores = 184;
      const growthPerDay = 12.4; // Stable average growth
      
      return Math.floor(initialStores + (daysSinceLaunch * growthPerDay));
    };
    
    setCount(calculateStoreCount());

    const updateCount = () => {
        setCount((prev) => (prev || 0) + 1);
        const randomInterval = Math.random() * (600000 - 300000) + 300000; // 5 to 10 minutes
        timerRef.current = setTimeout(updateCount, randomInterval);
    };

    timerRef.current = setTimeout(updateCount, Math.random() * (600000 - 300000) + 300000);

    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);


  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <span className="text-primary-foreground/80">[Live]</span>
      <AnimatePresence mode="wait">
        {count !== null ? (
            <motion.span
            key={count}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="font-mono font-bold text-primary w-20 text-left"
            >
            {count.toLocaleString()}+
            </motion.span>
        ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
        )}
      </AnimatePresence>
      <span className="text-primary-foreground/80">Active Stores</span>
    </div>
  );
}

function PlatformPulse() {
    const ref = useRef(null);
    const { user } = useUser();
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    const [initialValues, setInitialValues] = useState<{currentSales: number, currentSellers: number, currentBrands: number} | null>(null);
    const [globalSalesSum, setGlobalSalesSum] = useState<number | null>(null);
    const [isGlowing, setIsGlowing] = useState(false);
    const { showRandomCityToast } = useToastWithRandomCity();


    useEffect(() => {
        const getDeterministicValues = () => {
            const now = new Date();
            const daysSinceLaunch = Math.max(0, (now.getTime() - LAUNCH_DATE.getTime()) / MS_PER_DAY);

            // Baseline figures from July 1, 2024
            const initialSales = 4455321.98;
            const initialSellers = 127;
            const initialBrands = 89;

            // Stable growth rates
            const salesGrowthPerDay = 32450.50;
            const sellersGrowthPerDay = 8.2;
            const brandsGrowthPerDay = 2.1;

            const currentSales = initialSales + (daysSinceLaunch * salesGrowthPerDay);
            const currentSellers = Math.floor(initialSellers + (daysSinceLaunch * sellersGrowthPerDay));
            const currentBrands = Math.floor(initialBrands + (daysSinceLaunch * brandsGrowthPerDay));
            
            return { currentSales, currentSellers, currentBrands };
        };

        const values = getDeterministicValues();
        setInitialValues(values);
        setGlobalSalesSum(values.currentSales);
    }, []);


    useEffect(() => {
        if (globalSalesSum === null) return;

        const updateSales = () => {
            const saleAmount = Math.random() * (185.00 - 14.50) + 14.50;
            setGlobalSalesSum(prev => (prev || 0) + saleAmount);
            
            // Only show pop-up toasts for anonymous visitors to reduce annoyance for logged-in users
            if (!user) {
                showRandomCityToast(saleAmount);
            }

            setIsGlowing(true);
            setTimeout(() => setIsGlowing(false), 2000); // Glow duration

            const randomInterval = Math.random() * (15000 - 8000) + 8000;
            timerRef.current = setTimeout(updateSales, randomInterval);
        };
        
        timerRef.current = setTimeout(updateSales, Math.random() * (15000 - 5000) + 5000);
        
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };

    }, [globalSalesSum, showRandomCityToast, user]);

    return (
        <section ref={ref} className="container z-10 py-20">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Card className="h-full bg-card/50 border-primary/20 text-center">
                        <CardHeader>
                            <Users className="h-10 w-10 mx-auto text-primary" aria-hidden="true" />
                            <CardTitle className="font-headline text-2xl text-primary">Verified Sellers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">
                                <AnimatedCounter from={0} to={initialValues?.currentSellers || 0} isInView={isInView} />+
                            </p>
                            <p className="text-muted-foreground mt-2">Supplying the Master Catalog</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
                    <Card className={cn("h-full bg-card/50 border-primary/20 text-center transition-all duration-500", isGlowing && "card-gold-pulse")}>
                        <CardHeader>
                            <DollarSign className="h-10 w-10 mx-auto text-primary" aria-hidden="true" />
                            <CardTitle className="font-headline text-2xl text-primary">Total Sales Processed</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-4xl font-bold">
                                $<AnimatedCounter 
                                    from={initialValues?.currentSales || 0} 
                                    to={globalSalesSum || 0} 
                                    isInView={isInView}
                                    formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} 
                                />
                            </p>
                            <p className="text-muted-foreground mt-2">Across all client stores</p>
                        </CardContent>
                    </Card>
                </motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }}>
                    <Card className="h-full bg-card/50 border-primary/20 text-center">
                        <CardHeader>
                            <ShieldCheck className="h-10 w-10 mx-auto text-primary" aria-hidden="true" />
                            <CardTitle className="font-headline text-2xl text-primary">Partner Brands</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">
                               <AnimatedCounter from={0} to={initialValues?.currentBrands || 0} isInView={isInView} />+
                            </p>
                            <p className="text-muted-foreground mt-2">Premium brand partnerships</p>
                        </CardContent>
                    </Card>
                </motion.div>
             </div>
        </section>
    )
}

const HowItWorks = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const steps = [
        {
            icon: <Gem className="h-10 w-10 text-primary" aria-hidden="true" />,
            title: "1. Select Your Plan",
            description: "Choose a tier that fits your ambition, from a starting Merchant to a global Mogul."
        },
        {
            icon: <Rocket className="h-10 w-10 text-primary" aria-hidden="true" />,
            title: "2. Launch Your Store",
            description: "Use our intuitive wizard to name your brand, upload your logo, and sync your first luxury products in minutes."
        },
        {
            icon: <Globe className="h-10 w-10 text-primary" aria-hidden="true" />,
            title: "3. Go Live Worldwide",
            description: "Connect your custom domain and start selling to a global audience. SOMA handles the payments and logistics."
        }
    ];

    return (
        <section ref={ref} className="container z-10 py-20" aria-labelledby="steps-title">
            <div className="text-center max-w-2xl mx-auto">
                 <motion.h2 
                    id="steps-title"
                    className="text-4xl sm:text-5xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                >
                    Three Steps to Your Empire
                </motion.h2>
                <motion.p 
                    className="mt-4 text-lg text-muted-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    From concept to launch in under 5 minutes.
                </motion.p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                {steps.map((step, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }} 
                        animate={isInView ? { opacity: 1, y: 0 } : {}} 
                        transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                    >
                        <Card className="h-full bg-card/50 border-primary/20 text-center p-8">
                            <div className="mx-auto w-fit bg-primary/10 rounded-full p-4 mb-6 border border-primary/20">
                                {step.icon}
                            </div>
                            <h3 className="font-headline text-2xl text-primary mb-2">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}

function SneakPeek() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const features = [
        "One-Click Product Cloning",
        "Auto-SSL Custom Domains",
        "Paystack Integrated Payouts"
    ];

    return (
        <section ref={ref} className="container z-10 py-20" aria-labelledby="features-title">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                    className="[perspective:800px]"
                    initial={{ opacity: 0, y: 50 }} 
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                >
                    <div className="relative w-full aspect-[9/18] max-w-sm mx-auto rounded-3xl bg-gray-900 p-2 border-4 border-gray-700 shadow-2xl shadow-primary/10" style={{ transform: "rotateY(-25deg) rotateX(10deg) scale(0.9)" }}>
                        <div className="absolute inset-x-0 top-0 h-8 bg-gray-900 rounded-t-3xl flex items-center justify-center">
                            <div className="w-20 h-2 bg-gray-800 rounded-full"></div>
                        </div>
                        <div className="h-full w-full rounded-2xl overflow-hidden bg-black">
                             <Image 
                                src="https://picsum.photos/seed/store-mockup/400/800" 
                                alt="Visual representation of a live SOMA boutique on a mobile device"
                                width={400}
                                height={800}
                                className="object-cover w-full h-full"
                                data-ai-hint="ecommerce mobile"
                             />
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-8">
                    <motion.h2 
                        id="features-title"
                        className="text-4xl sm:text-5xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        Everything You Need. Nothing You Don't.
                    </motion.h2>
                    <motion.ul 
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ staggerChildren: 0.2, delayChildren: 0.6 }}
                    >
                        {features.map((feature, i) => (
                            <motion.li 
                                key={i} 
                                className="flex items-center gap-3 text-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                            >
                                <Check className="h-6 w-6 text-primary flex-shrink-0" aria-hidden="true" />
                                <span className="text-muted-foreground">{feature}</span>
                            </motion.li>
                        ))}
                    </motion.ul>
                    <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={isInView ? { opacity: 1, y: 0 } : {}}
                         transition={{ duration: 0.5, delay: 1.0 }}
                    >
                        <Button asChild size="lg" className="h-12 text-lg w-full sm:w-auto btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href="/plan-selection">Claim Your Lifetime Access</Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}


export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-black gold-mesh-gradient overflow-x-hidden">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <SomaLogo aria-hidden="true" />
          <span className="font-headline font-bold text-xl text-primary tracking-tighter uppercase">SomaDS</span>
        </div>
        <Button variant="ghost" asChild className="font-headline text-primary hover:text-primary/80 hover:bg-primary/5">
          <Link href="/login">Sign In</Link>
        </Button>
      </header>

      <main id="main-content" className="w-full">
        <section className="container z-10 flex flex-col items-center text-center px-4 pt-32 pb-20">
            <LiveCounter />

            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-headline max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary">
            Launch Your Luxury E-Commerce Empire, Instantly.
            </h1>

            <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
            SOMA provides the tools, the technology, and the top-tier products to launch a sophisticated online brand. No code, no inventory, no limits.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Button asChild size="lg" className="h-12 text-lg w-full sm:w-auto btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/plan-selection">Get Started Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 text-lg w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                <Link href="/store/demo">View Store Demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 text-lg w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                <Link href="/dashboard/demo">View Dashboard Demo</Link>
            </Button>
            </div>
        </section>

        <PlatformPulse />
        <HowItWorks />
        <SneakPeek />
        <LiveFeedTicker />
      </main>
    </div>
  );
}
