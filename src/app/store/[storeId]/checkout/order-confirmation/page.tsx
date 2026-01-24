'use client';

import { useSearchParams, notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import SomaLogo from '@/components/logo';

export default function OrderConfirmationPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const storeId = params.storeId as string;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        notFound();
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="flex items-center gap-2 mb-8">
                 <SomaLogo className="h-10 w-10 text-primary" />
                 <span className="font-headline text-3xl font-bold text-primary">SOMA Store</span>
            </div>

            <Card className="w-full max-w-lg border-primary/50 text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                        <CheckCircle2 className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-headline mt-4">Thank You for Your Order!</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Your order has been placed successfully.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg">
                        Your Order ID is: <span className="font-bold text-primary">{orderId}</span>
                    </p>
                    <p className="text-muted-foreground">
                        You will receive an email confirmation shortly with your order details and tracking information.
                    </p>
                    <Button asChild size="lg" className="mt-6 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href={`/store/${storeId}`}>Continue Shopping</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
