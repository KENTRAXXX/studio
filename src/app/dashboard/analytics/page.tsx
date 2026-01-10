'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, DollarSign, Loader2, Package, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';

type OrderProduct = {
  id: string;
  name: string;
  quantity: number;
  price: number; // Retail price at time of sale
  wholesalePrice?: number; // Wholesale price at time of sale
};

type Order = {
  id: string;
  total: number;
  createdAt: string;
  cart: OrderProduct[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border border-primary/50 rounded-lg shadow-lg">
        <p className="label font-bold text-primary">{`${format(new Date(label), 'PPP')}`}</p>
        <p className="intro text-sm text-foreground">{`Sales : $${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }

  return null;
};


export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const ordersRef = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `stores/${user.uid}/orders`),
      orderBy('createdAt', 'asc')
    );
  }, [user, firestore]);

  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersRef);

  const { totalRevenue, totalOrders, totalWholesaleCost, netProfit, salesByDay } = useMemo(() => {
    if (!orders) {
      return { totalRevenue: 0, totalOrders: 0, totalWholesaleCost: 0, netProfit: 0, salesByDay: [] };
    }

    const revenue = orders.reduce((acc, order) => acc + order.total, 0);
    const orderCount = orders.length;
    
    const wholesaleCost = orders.reduce((acc, order) => {
        const orderCost = order.cart.reduce((itemAcc, item) => {
            // Use saved wholesale price, or fallback to 30% margin estimation if missing
            const cost = item.wholesalePrice ?? item.price * 0.7;
            return itemAcc + (cost * item.quantity);
        }, 0);
        return acc + orderCost;
    }, 0);

    const profit = revenue - wholesaleCost;

    const dailySales = orders.reduce((acc, order) => {
        const date = format(new Date(order.createdAt), 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += order.total;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(dailySales)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
      totalRevenue: revenue,
      totalOrders: orderCount,
      totalWholesaleCost: wholesaleCost,
      netProfit: profit,
      salesByDay: chartData
    };
  }, [orders]);
  
  const isLoading = userLoading || ordersLoading;

  if (isLoading) {
      return (
        <div className="flex h-96 w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <BarChart2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Analytics</h1>
      </div>

       <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${totalRevenue.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">{totalOrders} total orders</p>
          </CardContent>
        </Card>
         <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${totalWholesaleCost.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Total wholesale cost</p>
          </CardContent>
        </Card>
         <Card className="border-green-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">${netProfit.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">After all costs</p>
          </CardContent>
        </Card>
      </div>
      
       <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-96 w-full">
            {salesByDay.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesByDay} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(str) => format(new Date(str), "MMM d")}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                 <div className="flex h-full items-center justify-center text-center">
                    <p className="text-muted-foreground">No sales data yet. Your first sale will appear here.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
