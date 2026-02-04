'use client';

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, limit, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    BarChart2, 
    DollarSign, 
    Loader2, 
    TrendingUp, 
    Users, 
    Eye, 
    ShoppingBag, 
    ArrowUpRight,
    MousePointer2,
    Target,
    Globe,
    BarChart3,
    Clock,
    CheckCircle2,
    ShieldCheck,
    Star,
    ArrowUp,
    ChevronRight,
    Sparkles,
    Gem
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker 
} from "react-simple-maps";
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CITY_COORDS: Record<string, [number, number]> = {
    "Tokyo": [139.6917, 35.6895],
    "New York": [-74.0060, 40.7128],
    "London": [-0.1278, 51.5074],
    "Paris": [2.3522, 48.8566],
    "Singapore": [103.8198, 1.3521],
    "Dubai": [55.2708, 25.2048],
    "Hong Kong": [114.1694, 22.3193],
    "Los Angeles": [-118.2437, 34.0522],
    "Sydney": [151.2093, -33.8688],
    "Berlin": [13.4050, 52.5200],
    "Toronto": [-79.3832, 43.6532],
    "Seoul": [126.9780, 37.5665],
    "Moscow": [37.6173, 55.7558],
    "Mumbai": [72.8777, 19.0760],
    "Sao Paulo": [-46.6333, -23.5505],
    "Lagos": [3.3792, 6.5244],
    "Cairo": [31.2357, 30.0444],
    "Buenos Aires": [-58.3816, -34.6037],
    "Mexico City": [-99.1332, 19.4326],
    "Istanbul": [28.9784, 41.0082]
};

type OrderProduct = {
  id: string;
  name: string;
  quantity: number;
  price: number; 
  wholesalePrice?: number;
};

type Order = {
  id: string;
  total: number;
  createdAt: string;
  cart: OrderProduct[];
  shippingAddress?: {
      city?: string;
      country?: string;
  };
};

type StorefrontProduct = {
    id: string;
    name: string;
    imageUrl: string;
    viewCount?: number;
    lastWeekViewCount?: number;
    isFeatured?: boolean;
};

type StoreData = {
    visitorCount?: number;
    productViewCount?: number;
    customDomain?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border border-primary/50 rounded-lg shadow-lg">
        <p className="label font-bold text-primary">{label.includes('-') ? format(new Date(label), 'PPP') : label}</p>
        <p className="intro text-sm text-foreground">
            {payload[0].name === 'total' ? `Sales : ${formatCurrency(Math.round(payload[0].value * 100))}` : `Visits : ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const FunnelStage = ({ 
    label, 
    value, 
    percentage, 
    icon: Icon, 
    colorClass,
    width 
}: { 
    label: string; 
    value: number; 
    percentage?: string; 
    icon: any; 
    colorClass: string;
    width: string;
}) => (
    <div className="flex flex-col items-center group w-full">
        <div className={cn(
            "relative h-20 rounded-xl flex items-center justify-between px-6 transition-all duration-500 hover:scale-[1.02] border border-white/5",
            colorClass,
            width
        )}>
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-black/20">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="font-headline font-bold text-sm uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-right">
                <p className="text-2xl font-bold font-mono">{value.toLocaleString()}</p>
                {percentage && <p className="text-[10px] font-medium opacity-60 uppercase tracking-tighter">{percentage} of previous</p>}
            </div>
        </div>
        <div className="h-8 w-px bg-gradient-to-b from-primary/40 to-transparent my-1 last:hidden" />
    </div>
);

export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const storeRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'stores', user.uid) : null, [user, firestore]);
  const { data: storeData, loading: storeLoading } = useDoc<StoreData>(storeRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `stores/${user.uid}/orders`),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `stores/${user.uid}/products`));
  }, [user, firestore]);

  const { data: products, loading: productsLoading } = useCollection<StorefrontProduct>(productsQuery);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!orders) {
      return { 
          totalRevenue: 0, 
          totalOrders: 0, 
          netProfit: 0, 
          salesByDay: [],
          conversionRate: 0,
          avgOrderValue: 0
      };
    }

    const revenue = orders.reduce((acc, order) => acc + order.total, 0);
    const orderCount = orders.length;
    
    const profit = orders.reduce((acc, order) => {
        const orderCost = order.cart.reduce((itemAcc, item) => {
            const cost = item.wholesalePrice ?? item.price * 0.7;
            return itemAcc + (cost * item.quantity);
        }, 0);
        return acc + (order.total - orderCost);
    }, 0);

    const visitors = storeData?.visitorCount || 0;
    const convRate = visitors > 0 ? (orderCount / visitors) * 100 : 0;
    const aov = orderCount > 0 ? revenue / orderCount : 0;

    const dailySales = orders.reduce((acc, order) => {
        const date = format(new Date(order.createdAt), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + order.total;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(dailySales)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalRevenue: revenue,
      totalOrders: orderCount,
      netProfit: profit,
      salesByDay: chartData,
      conversionRate: convRate,
      avgOrderValue: aov
    };
  }, [orders, storeData]);

  const orderMarkers = useMemo(() => {
      if (!orders) return [];
      const markers: any[] = [];
      const seenCities = new Set();

      orders.slice(0, 50).forEach(order => {
          const city = order.shippingAddress?.city;
          if (city && CITY_COORDS[city] && !seenCities.has(city)) {
              markers.push({
                  name: city,
                  coordinates: CITY_COORDS[city],
                  orderId: order.id
              });
              seenCities.add(city);
          }
      });
      return markers;
  }, [orders]);

  const productPerformance = useMemo(() => {
    if (!products || !orders) return [];

    const salesMap: Record<string, number> = {};
    orders.forEach(order => {
        order.cart.forEach(item => {
            salesMap[item.id] = (salesMap[item.id] || 0) + item.quantity;
        });
    });

    return products.map(product => {
        const views = product.viewCount || 0;
        const lastWeekViews = product.lastWeekViewCount || 0;
        const trend = lastWeekViews > 0 ? (views - lastWeekViews) / lastWeekViews : 0;
        
        return {
            ...product,
            sales: salesMap[product.id] || 0,
            hasTrend: trend > 0.1,
        };
    }).sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);
  }, [products, orders]);

  const handleFeatureToggle = async (productId: string, currentFeatured: boolean) => {
    if (!user || !firestore) return;
    setProcessingId(productId);
    try {
        const productRef = doc(firestore, `stores/${user.uid}/products`, productId);
        await updateDoc(productRef, {
            isFeatured: !currentFeatured
        });
        toast({
            title: currentFeatured ? 'Removed from Signature Collection' : 'Featured on Storefront',
            description: `Visual update successful.`,
        });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Action Failed',
            description: e.message
        });
    } finally {
        setProcessingId(null);
    }
  };

  const getProductImage = (imageId: string) => {
    if (imageId?.startsWith('http')) return imageId;
    return PlaceHolderImages.find((img) => img.id === imageId)?.imageUrl || `https://picsum.photos/seed/${imageId}/100/100`;
  };

  const isLoading = userLoading || ordersLoading || storeLoading || productsLoading;

  if (isLoading) {
      return (
        <div className="flex h-96 w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  const visitors = storeData?.visitorCount || 0;
  const productViews = storeData?.productViewCount || 0;
  const ordersCount = stats.totalOrders;

  const viewThroughRate = visitors > 0 ? ((productViews / visitors) * 100).toFixed(1) : "0";
  const clickToOrderRate = productViews > 0 ? ((ordersCount / productViews) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <BarChart2 className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold font-headline tracking-tight">Performance Intelligence</h1>
            </div>
            <p className="text-muted-foreground text-lg">Real-time optimization metrics for your luxury empire.</p>
        </div>
        
        <Card className="bg-primary/5 border-primary/20 min-w-[240px] shadow-gold-glow">
            <CardContent className="pt-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-1">Store Conversion Rate</p>
                <div className="flex items-center justify-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <span className="text-5xl font-bold font-mono text-primary">{stats.conversionRate.toFixed(2)}%</span>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Global War Room Section */}
      <Card className="border-primary/30 bg-slate-900/40 overflow-hidden relative">
          <CardHeader className="border-b border-white/5 bg-muted/30">
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle className="text-2xl font-headline flex items-center gap-3">
                          <Globe className="h-6 w-6 text-primary animate-spin-slow" />
                          Global War Room
                      </CardTitle>
                      <CardDescription>Live acquisition telemetry across international markets.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Link Active</span>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-8 h-[500px] relative bg-slate-950/50">
                  <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full">
                      <Geographies geography={geoUrl}>
                          {({ geographies }) =>
                              geographies.map((geo) => (
                                  <Geography
                                      key={geo.rsmKey}
                                      geography={geo}
                                      fill="hsl(var(--muted) / 0.15)"
                                      stroke="hsl(var(--primary) / 0.1)"
                                      strokeWidth={0.5}
                                      style={{
                                          default: { outline: "none" },
                                          hover: { fill: "hsl(var(--primary) / 0.1)", outline: "none" },
                                          pressed: { outline: "none" },
                                      }}
                                  />
                              ))
                          }
                      </Geographies>
                      {orderMarkers.map(({ name, coordinates, orderId }) => (
                          <Marker key={orderId} coordinates={coordinates}>
                              <g>
                                  <circle r="8" fill="hsl(var(--primary) / 0.3)" className="animate-marker-pulse" />
                                  <circle r="3" fill="hsl(var(--primary))" />
                              </g>
                              <text
                                  textAnchor="middle"
                                  y={-12}
                                  style={{ fontFamily: "var(--font-headline)", fontSize: "8px", fill: "hsl(var(--primary))", fontWeight: "bold" }}
                              >
                                  {name.toUpperCase()}
                              </text>
                          </Marker>
                      ))}
                  </ComposableMap>
                  
                  <div className="absolute bottom-6 left-6 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/5 space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Acquisition Hotspots</p>
                      <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-[10px] text-slate-300 font-bold">Confirmed Order</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-primary/20" />
                              <span className="text-[10px] text-slate-300 font-bold">Historical Hit</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-4 border-l border-white/5 bg-slate-900/20 flex flex-col">
                  <div className="p-6 border-b border-white/5 bg-black/20">
                      <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                          <Clock className="h-3 w-3" /> Live Transmission
                      </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[430px] custom-scrollbar">
                      {orders && orders.length > 0 ? (
                          <div className="divide-y divide-white/5">
                              {orders.slice(0, 10).map((order) => (
                                  <div key={order.id} className="p-4 hover:bg-white/5 transition-colors group">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="text-[10px] font-mono text-primary font-bold">{order.id}</p>
                                          <p className="text-[9px] text-slate-500 font-bold uppercase">{format(new Date(order.createdAt), 'HH:mm:ss')}</p>
                                      </div>
                                      <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">
                                          {order.shippingAddress?.city || 'Global Client'}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-medium">
                                          {order.cart.length} Luxury Assets • {formatCurrency(Math.round(order.total * 100))}
                                      </p>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                              <p className="text-xs font-bold uppercase tracking-widest">Awaiting First Signal...</p>
                          </div>
                      )}
                  </div>
              </div>
          </CardContent>
      </Card>

       <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(Math.round(stats.totalRevenue * 100))}</div>
             <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center gap-1">
                 <ArrowUpRight className="h-3 w-3" /> PRE-TAX GROSS
             </p>
          </CardContent>
        </Card>
         <Card className="border-primary/20 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Net Profits</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatCurrency(Math.round(stats.netProfit * 100))}</div>
             <p className="text-[10px] text-muted-foreground uppercase mt-1">After SOMA fees</p>
          </CardContent>
        </Card>
         <Card className="border-primary/20 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Avg. Order Value</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(Math.round(stats.avgOrderValue * 100))}</div>
             <p className="text-[10px] text-muted-foreground uppercase mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Funnel */}
        <Card className="lg:col-span-5 border-primary/30 bg-slate-900/20">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <MousePointer2 className="h-5 w-5 text-primary" />
                    Customer Journey
                </CardTitle>
                <CardDescription>Visualizing the path from awareness to acquisition.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                    <FunnelStage 
                        label="Total Visitors" 
                        value={visitors} 
                        icon={Users} 
                        colorClass="bg-gradient-to-r from-primary/20 to-primary/10"
                        width="w-full"
                    />
                    <FunnelStage 
                        label="Product Views" 
                        value={productViews} 
                        percentage={`${viewThroughRate}%`}
                        icon={Eye} 
                        colorClass="bg-gradient-to-r from-primary/15 to-primary/5"
                        width="w-[85%]"
                    />
                    <FunnelStage 
                        label="Conversions" 
                        value={ordersCount} 
                        percentage={`${clickToOrderRate}%`}
                        icon={CheckCircle2} 
                        colorClass="bg-gradient-to-r from-primary/10 to-transparent"
                        width="w-[70%]"
                    />
                </div>
                
                <div className="mt-10 p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic Insight</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {stats.conversionRate > 2 
                            ? "Your boutique is performing above industry standards. Consider scaling your traffic sources." 
                            : "Opportunity detected: Enhance your product descriptions or imagery to improve the Decision phase."
                        }
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Sales Trajectory */}
        <Card className="lg:col-span-7 border-primary/20 bg-card/30">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Sales Trajectory
                </CardTitle>
                <CardDescription>Historical performance over the last active period.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 w-full pt-4">
                {stats.salesByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.salesByDay} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => format(new Date(str), "MMM d")}
                                dy={10}
                            />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }} 
                                activeDot={{ r: 6, strokeWidth: 0 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-muted">
                            <BarChart2 className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-muted-foreground italic">Waiting for initial transaction data to populate trajectory.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      {/* Product Intelligence Table */}
      <Card className="border-primary/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-primary/10">
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle className="text-xl font-headline flex items-center gap-2">
                          <Gem className="h-5 w-5 text-primary" />
                          Most Viewed Products
                      </CardTitle>
                      <CardDescription>Engagement and sales performance for your luxury assets.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary">Live Optimization</Badge>
              </div>
          </CardHeader>
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow className="bg-black/20 border-primary/10">
                          <TableHead className="w-[100px]">Asset</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead className="text-center">Views</TableHead>
                          <TableHead className="text-center">Sales</TableHead>
                          <TableHead className="text-center">Trend</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {productPerformance.length > 0 ? (
                          productPerformance.map((product) => (
                              <TableRow key={product.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                                  <TableCell>
                                      <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-primary/20">
                                          <Image 
                                            src={getProductImage(product.imageUrl)} 
                                            alt={product.name} 
                                            fill 
                                            className="object-cover" 
                                          />
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <div className="font-bold text-slate-200">{product.name}</div>
                                      <code className="text-[10px] text-slate-500 uppercase tracking-tighter">SKU: {product.id.slice(0, 8)}</code>
                                  </TableCell>
                                  <TableCell className="text-center font-mono font-bold text-slate-300">
                                      {product.viewCount || 0}
                                  </TableCell>
                                  <TableCell className="text-center font-mono font-bold text-primary">
                                      {product.sales}
                                  </TableCell>
                                  <TableCell className="text-center">
                                      {product.hasTrend ? (
                                          <div className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                              <ArrowUp className="h-3 w-3" />
                                              <span className="text-[10px] font-black">HIGH MOMENTUM</span>
                                          </div>
                                      ) : (
                                          <span className="text-slate-600 font-mono text-xs">--</span>
                                      )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className={cn(
                                            "h-8 px-4 font-bold transition-all",
                                            product.isFeatured 
                                                ? "bg-primary text-primary-foreground border-primary" 
                                                : "border-primary/30 text-primary hover:bg-primary/10"
                                        )}
                                        onClick={() => handleFeatureToggle(product.id, !!product.isFeatured)}
                                        disabled={processingId === product.id}
                                      >
                                          {processingId === product.id ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : product.isFeatured ? (
                                              <><Star className="h-3 w-3 mr-1 fill-current" /> Featured</>
                                          ) : (
                                              <><Sparkles className="h-3 w-3 mr-1" /> Feature Item</>
                                          )}
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                                  Waiting for engagement data to populate intelligence table...
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
