'use client';

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Loader2, AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { formatCurrency } from "@/utils/format";

const getStatusClasses = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-primary/20 text-primary border-primary/50 animate-gold-pulse";
    case "Shipped":
      return "bg-gray-200/80 text-black border-gray-300";
    case "Delivered":
      return "bg-primary text-primary-foreground border-primary";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

type Order = {
  id: string;
  orderId: string;
  createdAt: string;
  customer: { email: string };
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered';
  cart: Array<{id: string, name: string, quantity: number, price: number}>;
};

export default function MyOrdersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const ordersRef = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, `stores/${user.uid}/orders`), 
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersRef);

  const { grossRevenue, wholesaleCost, netProfit } = useMemo(() => {
    if (!orders) return { grossRevenue: 0, wholesaleCost: 0, netProfit: 0 };
    
    // Note: wholesaleCost and netProfit are simplified here.
    // A real calculation would require fetching each product in each order.
    // For now, we'll base it on total revenue.
    const revenue = orders.reduce((acc, order) => acc + order.total, 0);
    const cost = revenue * 0.4; // Simplified assumption
    
    return {
      grossRevenue: revenue,
      wholesaleCost: cost,
      netProfit: revenue - cost,
    };

  }, [orders]);


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">My Orders</h1>
      </div>

       <Card className="border-destructive bg-destructive/10 text-destructive-foreground">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Your wallet is currently under review...
            </CardTitle>
            <CardDescription className="text-destructive/80">
                To protect the integrity of the SOMA platform, your wallet has been flagged for a manual review by our treasury team.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p>This process typically takes 24-48 hours. You will be notified via email once the review is complete.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(Math.round(grossRevenue * 100))}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SOMA Wholesale Cost (Est.)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">- {formatCurrency(Math.round(wholesaleCost * 100))}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit (Est.)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(Math.round(netProfit * 100))}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
          <CardDescription>A list of all sales made on your custom domain.</CardDescription>
        </CardHeader>
        <CardContent>
            {ordersLoading ? (
                 <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer Email</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-center">Fulfillment Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {orders && orders.length > 0 ? orders.map((order) => (
                        <TableRow key={order.orderId}>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{order.orderId}</TableCell>
                        <TableCell>{order.customer.email}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Math.round(order.total * 100))}</TableCell>
                        <TableCell className="text-center">
                            <Badge className={cn("text-xs", getStatusClasses(order.status))}>
                            {order.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">View Details</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-primary">
                                <DialogHeader>
                                <DialogTitle className="text-primary font-headline">Order Details for {order.orderId}</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                <h3 className="font-semibold">Items Purchased</h3>
                                <Separator className="bg-border/20"/>
                                <ul className="space-y-2 text-sm">
                                  {order.cart.map(item => (
                                    <li key={item.id} className="flex justify-between">
                                      <span>{item.name} x {item.quantity}</span>
                                    </li>
                                  ))}
                                </ul>
                                </div>
                            </DialogContent>
                            </Dialog>
                        </TableCell>
                        </TableRow>
                    )) : (
                         <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-gold-500 font-medium">
                                Your first luxury sale is just a click away.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
