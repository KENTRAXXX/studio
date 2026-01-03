'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { masterCatalog, storeOwners } from "@/lib/data";
import { DollarSign, MoreHorizontal, Ban, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MasterAdminPage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                router.push('/dashboard');
                return;
            }

            user.getIdTokenResult().then((idTokenResult) => {
                const isAdminClaim = !!idTokenResult.claims.isAdmin;
                if (isAdminClaim) {
                    setIsAdmin(true);
                } else {
                    router.push('/dashboard');
                }
                setLoading(false);
            });
        }
    }, [user, userLoading, router]);

    const totalPlatformSales = 1250340.50;
    const myCommission = totalPlatformSales * 0.05;

    if (loading || userLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAdmin) {
        return null; // Or a more explicit "Access Denied" component
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline text-primary">Master Admin Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalPlatformSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">My Commission (5%)</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${myCommission.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle>Master Product Catalog</CardTitle>
                    <CardDescription>
                        This catalog is automatically cloned to new client stores.
                        Products are managed via the 'Product Catalog' page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Master Cost</TableHead>
                                <TableHead>Retail Price</TableHead>
                                <TableHead>Stock Level</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {masterCatalog.slice(0, 5).map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>${product.masterCost.toFixed(2)}</TableCell>
                                    <TableCell>${product.retailPrice.toFixed(2)}</TableCell>
                                    <TableCell>{product.stockLevel}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Showing {storeOwners.length} of 1,000+ store owners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Owner Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Store URL</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {storeOwners.map((owner) => (
                                <TableRow key={owner.id}>
                                    <TableCell>{owner.name}</TableCell>
                                    <TableCell>{owner.email}</TableCell>
                                    <TableCell>{owner.storeUrl}</TableCell>
                                    <TableCell>
                                        <Badge variant={owner.status === 'Active' ? 'default' : 'destructive'} className={owner.status === 'Active' ? 'bg-green-600/20 text-green-400 border-green-600/50' : ''}>
                                            {owner.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {owner.status === 'Active' && 
                                            <Button variant="destructive" size="sm">
                                                <Ban className="mr-2 h-4 w-4"/> Disable Store
                                            </Button>
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
