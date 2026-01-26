'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Rocket } from 'lucide-react';

const provisioningSteps = [
    { text: 'Finalizing account setup...', duration: 1500 },
    { text: 'Provisioning store instance...', duration: 2000 },
    { text: 'Syncing initial product catalog...', duration: 2500 },
    { text: 'Applying luxury theme...', duration: 1500 },
    { text: 'Almost there...', duration: 1000 },
];

export function ProvisioningLoader() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const timers = provisioningSteps.map((step, index) => {
            const delay = provisioningSteps.slice(0, index).reduce((acc, s) => acc + s.duration, 0);
            return setTimeout(() => {
                setCurrentStep(index + 1);
            }, delay);
        });
        
        return () => {
            timers.forEach(clearTimeout);
        };
    }, []);

    return (
        <div className="flex h-96 w-full items-center justify-center text-center">
            <Card className="p-8 border-primary/50 w-full max-w-md">
                <CardHeader className="p-0">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                        className="mx-auto"
                    >
                        <Rocket className="h-12 w-12 text-primary" />
                    </motion.div>
                    <CardTitle className="font-headline text-2xl pt-4">Launching Your Empire</CardTitle>
                    <CardDescription>This will just take a moment.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-6">
                    <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2"
                            >
                                <Loader2 className="animate-spin h-4 w-4" />
                                <span>{provisioningSteps[currentStep]?.text || 'Initializing...'}</span>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
