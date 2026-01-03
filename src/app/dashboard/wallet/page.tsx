import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { walletTransactions } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Banknote, Landmark, Wallet as WalletIcon } from 'lucide-react';

const getTransactionTypeClass = (type: string) => {
    switch (type) {
        case 'Sale': return 'text-green-400';
        case 'Fee': return 'text-red-400';
        case 'Withdrawal': return 'text-muted-foreground';
        default: return '';
    }
};

const getTransactionSign = (type: string) => {
    return type === 'Sale' ? '+' : '-';
};

export default function SomaWalletPage() {
    const availableBalance = 1258.50;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">SOMA Wallet</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle>Withdrawal Method</CardTitle>
                            <CardDescription>Link your bank account or PayPal to receive payouts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="paypal-email">PayPal Email</Label>
                                <Input id="paypal-email" placeholder="your-email@example.com" />
                            </div>
                             <div className="flex items-center space-x-2">
                                <div className="flex-grow border-t border-muted-foreground/20"></div>
                                <span className="text-xs text-muted-foreground">OR</span>
                                <div className="flex-grow border-t border-muted-foreground/20"></div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="account-number">Bank Account Number</Label>
                                <Input id="account-number" placeholder="•••• •••• •••• 1234" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="routing-number">Routing Number</Label>
                                <Input id="routing-number" placeholder="•••••••••" />
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline">
                                    <Landmark className="mr-2 h-4 w-4"/> Link Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {walletTransactions.map((tx, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell className={cn("text-right font-mono", getTransactionTypeClass(tx.type))}>
                                                {getTransactionSign(tx.type)} ${tx.amount.toFixed(2).replace('-', '')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="border-primary text-center">
                        <CardHeader>
                            <WalletIcon className="h-10 w-10 text-primary mx-auto mb-4" />
                            <CardTitle className="text-muted-foreground text-lg font-medium">Available for Withdrawal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-5xl font-bold text-primary">${availableBalance.toFixed(2)}</p>
                        </CardContent>
                    </Card>

                    <Button size="lg" className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Banknote className="mr-2 h-6 w-6"/> Request Payout
                    </Button>
                </div>
            </div>
        </div>
    );
}
