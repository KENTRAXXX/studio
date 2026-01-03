'use client'
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Loader2 } from "lucide-react";
import { Separator } from '@/components/ui/separator';

type VerificationStatus = 'idle' | 'checking' | 'connected';

export default function DomainSettingsPage() {
    const [status, setStatus] = useState<VerificationStatus>('idle');

    const handleVerify = () => {
        setStatus('checking');
        setTimeout(() => {
            setStatus('connected');
        }, 2000);
    };

    const dnsSettings = [
        { type: 'A Record', name: '@', value: '123.456.78.9' },
        { type: 'CNAME', name: 'www', value: 'proxy.soma.com' },
    ];
    
    return (
        <div className="space-y-8 max-w-4xl">
            <h1 className="text-3xl font-bold font-headline">Domain Settings</h1>

            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle>Custom Domain</CardTitle>
                    <CardDescription>
                        Enter your custom domain to connect it to your SOMA store.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Input 
                            id="domain"
                            placeholder="e.g., myluxurystore.com" 
                            className="flex-1"
                        />
                         <Button onClick={handleVerify} disabled={status === 'checking'} className="btn-gold-glow w-40">
                            {status === 'idle' && 'Verify Connection'}
                            {status === 'checking' && <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Checking...</>}
                            {status === 'connected' && <><CheckCircle className="mr-2 h-4 w-4 text-green-400"/> Connected</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary">
                <CardHeader>
                    <CardTitle>DNS Settings</CardTitle>
                    <CardDescription>
                        Update your domain's DNS records with the following values.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {dnsSettings.map((setting, index) => (
                        <div key={setting.type}>
                            <div className="grid grid-cols-4 gap-4 items-center">
                                <p className="text-sm font-medium text-muted-foreground">Type</p>
                                <p className="col-span-3 text-sm font-mono">{setting.type}</p>

                                <p className="text-sm font-medium text-muted-foreground">Name</p>
                                <p className="col-span-3 text-sm font-mono">{setting.name}</p>

                                <p className="text-sm font-medium text-muted-foreground">Value</p>
                                <div className="col-span-3 flex items-center justify-between">
                                    <p className="text-sm font-mono">{setting.value}</p>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                            {index < dnsSettings.length - 1 && <Separator className="my-4 bg-border/20"/>}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
