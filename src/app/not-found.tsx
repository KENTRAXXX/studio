import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Box } from 'lucide-react';
import TradeWyseLogo from '@/components/logo';

export default function NotFound() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'tradewysetoday.com';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 bg-background px-4 text-center selection:bg-primary/30">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative bg-primary/10 p-10 rounded-full border border-primary/20 shadow-gold-glow backdrop-blur-sm">
                <Box className="h-24 w-24 text-primary opacity-80" />
            </div>
        </div>

        <div className="space-y-4 max-w-md relative z-10">
            <div className="flex items-center justify-center gap-2 mb-6">
                <TradeWyseLogo className="h-8 w-8 text-primary" />
                <span className="font-headline font-bold text-2xl text-primary tracking-tighter uppercase transition-opacity">Trade Wyse</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-white uppercase tracking-tighter leading-none">
                Boutique Disconnected
            </h1>
            
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
                The requested resource is not currently provisioned within the Trade Wyse ecosystem.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 pt-4">
            <Button size="lg" className="h-14 px-8 text-lg btn-gold-glow bg-primary font-black uppercase text-black" asChild>
                <Link href={`https://${rootDomain}`}>
                    <ArrowLeft className="mr-2 h-5 w-5" /> Back to Platform
                </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all font-bold uppercase" asChild>
                <Link href={`https://${rootDomain}/signup`}>
                    Inquire for Access
                </Link>
            </Button>
        </div>

        <footer className="fixed bottom-12 w-full text-center">
            <p className="text-[10px] uppercase tracking-[0.6em] text-slate-700 font-black">Trade Wyse Strategic Assets Group</p>
        </footer>
    </div>
  );
}
