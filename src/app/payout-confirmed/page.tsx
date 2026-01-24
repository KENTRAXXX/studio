'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import SomaLogo from '@/components/logo';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PayoutConfirmationContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');

    const isAlreadyConfirmed = status === 'already_confirmed';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="flex items-center gap-2 mb-8">
                 <SomaLogo className="h-10 w-10 text-primary" />
                 <span className="font-headline text-3xl font-bold text-primary">SOMA</span>
            </div>

            <Card className="w-full max-w-lg border-primary/50 text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                        {isAlreadyConfirmed ? (
                           <AlertTriangle className="h-16 w-16 text-primary" />
                        ) : (
                           <CheckCircle2 className="h-16 w-16 text-primary" />
                        )}
                    </div>
                    <CardTitle className="text-3xl font-headline mt-4">
                        {isAlreadyConfirmed ? 'Request Already Confirmed' : 'Payout Request Confirmed!'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {isAlreadyConfirmed 
                            ? 'This payout request has already been confirmed and is in the queue for processing.'
                            : 'Thank you for verifying your request. It has been securely submitted to our treasury team for processing.'
                        }
                    </p>
                    <Button asChild size="lg" className="mt-6">
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function PayoutConfirmedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PayoutConfirmationContent />
        </Suspense>
    )
}
