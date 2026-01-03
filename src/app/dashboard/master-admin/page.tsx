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
import { DollarSign, MoreHorizontal, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MasterAdminPage() {
    const totalPlatformSales = 1250340.50;
    const myCommission = totalPlatformSales * 0.05;

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
                    <CardTitle>Global Inventory</CardTitle>
                    <CardDescription>Add/edit products pushed to all client stores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Master Cost</TableHead>
                                <TableHead>Retail Price</TableHead>
                                <TableHead>Stock Level</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {masterCatalog.slice(0, 4).map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell><Input defaultValue={product.name} className="bg-background"/></TableCell>
                                    <TableCell><Input type="number" defaultValue={product.masterCost} className="bg-background"/></TableCell>
                                    <TableCell><Input type="number" defaultValue={product.retailPrice} className="bg-background"/></TableCell>
                                    <TableCell><Input type="number" defaultValue={product.stockLevel} className="bg-background"/></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     <Button className="mt-4">Add Product</Button>
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
