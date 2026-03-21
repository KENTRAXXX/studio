'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, ArrowRight } from 'lucide-react';
import SomaLogo from '@/components/logo';
import { motion } from 'framer-motion';

export default function PendingReviewPage() {
    
    const handleDownloadGuide = () => {
        const content = `
SOMA STRATEGIC ASSETS GROUP
OFFICIAL PLATFORM ACTIVATION GUIDE

Welcome to the SOMA Ecosystem. Your application is currently being verified by our Global Compliance Team.

Your access is currently in 'Pending Review' status. This is a mandatory security step for all Individual and Business entities.

1. COMPLIANCE & VERIFICATION
We verify all government IDs and corporate registration documents to maintain the highest standards of platform integrity.

2. PLATFORM ACTIVATION
Once approved, you will receive full access to your respective strategic hub (Dashboard, Backstage, or Ambassador Portal).

3. SECURITY STANDARDS
SOMA maintains a zero-tolerance policy for fraudulent activities. Please ensure your provided documentation is authentic and clear.

Your account will be activated automatically once the verification process concludes.

SOMA - The Ultimate Design System for E-commerce.
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'SOMA_Platform_Activation_Guide.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="flex items-center gap-2 mb-12">
                 <SomaLogo className="h-10 w-10 text-primary" />
                 <span className="font-headline text-3xl font-bold text-primary tracking-widest uppercase">SOMA</span>
            </div>

            <Card className="w-full max-w-xl border-primary/30 shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden relative">
                {/* Decorative gold gradient border top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                
                <CardHeader className="pt-12">
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 260, 
                            damping: 20,
                            delay: 0.1 
                        }}
                        className="mx-auto bg-primary/5 rounded-full p-6 w-fit border border-primary/20 mb-8"
                    >
                        <Clock className="h-12 w-12 text-primary animate-pulse" />
                    </motion.div>
                    <CardTitle className="text-3xl font-headline font-bold text-primary tracking-tight">Global Audit Pending</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
                        The SOMA Compliance Team is currently auditing your credentials to ensure platform security and regulatory alignment.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-10 pb-12 pt-4">
                    <div className="space-y-4">
                        <p className="text-muted-foreground px-6">
                            You will receive an email notification once your luxury hub is ready for activation. 
                            Our elite verification process typically concludes within <span className="text-foreground font-semibold">24–48 hours</span>.
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-4 px-6">
                        <Button 
                            onClick={handleDownloadGuide}
                            size="lg" 
                            className="h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all duration-300"
                        >
                            <FileText className="mr-2 h-5 w-5" />
                            Download Onboarding Guide
                        </Button>
                        
                        <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary transition-colors h-12">
                            <Link href="/dashboard">
                                Return to Dashboard Overview <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-16 text-xs uppercase tracking-[0.3em] text-muted-foreground/40 font-bold"
            >
                SOMA STRATEGIC ASSETS GROUP
            </motion.div>
        </div>
    );
}
