'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import SomaLogo from '@/components/logo';

export default function AccessDeniedPage() {

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="flex items-center gap-2 mb-8">
                 <SomaLogo className="h-10 w-10 text-primary" />
                 <span className="font-headline text-3xl font-bold text-primary">SOMA</span>
            </div>

            <Card className="w-full max-w-lg border-destructive/50 text-center">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit">
                        <Lock className="h-16 w-16 text-destructive" />
                    </div>
                    <CardTitle className="text-3xl font-headline mt-4 text-destructive">Access Denied</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Your current plan does not grant you access to this feature.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Please upgrade your plan to unlock this functionality or contact support if you believe this is an error.
                    </p>
                    <Button asChild size="lg" className="mt-6">
                        <Link href={`/dashboard`}>Return to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
