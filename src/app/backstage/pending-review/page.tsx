'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import SomaLogo from '@/components/logo';
import { motion } from 'framer-motion';

export default function PendingReviewPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="flex items-center gap-2 mb-8">
                 <SomaLogo className="h-10 w-10 text-primary" />
                 <span className="font-headline text-3xl font-bold text-primary">SOMA</span>
            </div>

            <Card className="w-full max-w-lg border-primary/50 text-center">
                <CardHeader>
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mx-auto bg-primary/10 rounded-full p-4 w-fit"
                    >
                        <Clock className="h-16 w-16 text-primary animate-pulse" />
                    </motion.div>
                    <CardTitle className="text-3xl font-headline mt-4 text-primary">Application Pending</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Your seller application has been received and is currently in our queue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 text-muted-foreground text-sm">
                        <p>
                            To maintain the high standards of the SOMA Master Catalog, our Quality Control team manually verifies every new supplier.
                        </p>
                        <p className="font-semibold text-foreground text-base">
                            This process typically takes 24–48 hours.
                        </p>
                        <p>
                            You will receive an email notification once your account has been approved. In the meantime, you can explore the training materials or review your financial dashboard.
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-4">
                        <Button asChild size="lg" className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full h-12">
                            <Link href="/backstage/finances">View Finances</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
