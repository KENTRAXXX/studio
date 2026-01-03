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
import { myOrders } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const getStatusClasses = (status: string) => {
  switch (status) {
    case "Processing":
      return "bg-primary/20 text-primary border-primary/50 animate-gold-pulse";
    case "Shipped":
      return "bg-gray-200/80 text-black border-gray-300";
    case "Delivered":
      return "bg-primary text-primary-foreground border-primary";
    default:
      return "";
  }
};

export default function MyOrdersPage() {
  const grossRevenue = 2470;
  const wholesaleCost = 900;
  const netProfit = grossRevenue - wholesaleCost;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">My Orders</h1>
      </div>

      <Card className="border-primary">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <p className="text-2xl font-bold text-foreground">${grossRevenue.toFixed(2)}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">SOMA Wholesale Cost</p>
                <p className="text-2xl font-bold text-foreground">- ${wholesaleCost.toFixed(2)}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-primary">${netProfit.toFixed(2)}</p>
            </div>
        </CardContent>
      </Card>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
          <CardDescription>A list of all sales made on your custom domain.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {myOrders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>{order.customerEmail}</TableCell>
                  <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-xs", getStatusClasses(order.fulfillmentStatus))}>
                      {order.fulfillmentStatus}
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
                           <h3 className="font-semibold">Shipping Address</h3>
                           <Separator className="bg-border/20"/>
                           <p className="text-sm">Jane Doe</p>
                           <p className="text-sm text-muted-foreground">123 Luxury Lane</p>
                           <p className="text-sm text-muted-foreground">Beverly Hills, CA 90210</p>
                           <p className="text-sm text-muted-foreground">United States</p>
                        </div>
                      </DialogContent>
                    </Dialog>
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
