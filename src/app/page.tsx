'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SomaLogo from '@/components/logo';
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, DollarSign, Boxes } from 'lucide-react';
import AnimatedCounter from '@/components/ui/animated-counter';

function LiveCounter() {
  const [count, setCount] = useState(1240);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <span className="text-primary-foreground/80">[Live]</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="font-mono font-bold text-primary"
        >
          {count.toLocaleString()}+
        </motion.span>
      </AnimatePresence>
      <span className="text-primary-foreground/80">Active Stores</span>
    </div>
  );
}

function PlatformPulse() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    // This would typically come from a Firestore listener.
    const globalSalesSum = 87530982.45; 

    return (
        <section ref={ref} className="container z-10 py-20">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Card className="h-full bg-card/50 border-primary/20 text-center">
                        <CardHeader>
                            <Globe className="h-10 w-10 mx-auto text-primary"/>
                            <CardTitle className="font-headline text-2xl text-primary">Global Reach</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">
                                <AnimatedCounter from={0} to={45} isInView={isInView} />+
                            </p>
                            <p className="text-muted-foreground mt-2">Countries with SOMA stores</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
                    <Card className="h-full bg-card/50 border-primary/20 text-center">
                        <CardHeader>
                            <DollarSign className="h-10 w-10 mx-auto text-primary"/>
                            <CardTitle className="font-headline text-2xl text-primary">Total Sales Processed</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-4xl font-bold">
                                $<AnimatedCounter from={0} to={globalSalesSum} isInView={isInView} />
                            </p>
                            <p className="text-muted-foreground mt-2">Across all client stores</p>
                        </CardContent>
                    </Card>
                </motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }}>
                    <Card className="h-full bg-card/50 border-primary/20 text-center">
                        <CardHeader>
                            <Boxes className="h-10 w-10 mx-auto text-primary"/>
                            <CardTitle className="font-headline text-2xl text-primary">Inventory Power</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">
                               <AnimatedCounter from={0} to={5000} isInView={isInView} />+
                            </p>
                            <p className="text-muted-foreground mt-2">Premium products ready to clone</p>
                        </CardContent>
                    </Card>
                </motion.div>
             </div>
        </section>
    )
}

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-black gold-mesh-gradient overflow-hidden">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <SomaLogo />
          <span className="font-headline font-bold text-xl text-primary">SomaDS</span>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Sign In</Link>
        </Button>
      </header>

      <main className="container z-10 flex flex-col items-center text-center px-4 pt-32">
        <LiveCounter />

        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-headline max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-primary">
          Your <span className="text-primary">Luxury Empire</span>, Built in Seconds.
        </h1>

        <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
          The only all-in-one dropshipping engine that launches your store, sources your products, and manages your logistics on your own custom domain.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Button asChild size="lg" className="h-12 text-lg w-full sm:w-auto btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/plan-selection">Get Started Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 text-lg w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
            <Link href="#">View Demo</Link>
          </Button>
        </div>
      </main>

      <PlatformPulse />
    </div>
  );
}
