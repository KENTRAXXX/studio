'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUserProfile, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, collectionGroup } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

type Store = {
  id: string;
  storeName: string;
}

type Order = {
  id: string; 
  orderId: string;
  createdAt: string;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered';
};

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-primary/20 text-primary border-primary/50';
    case 'Shipped':
      return 'bg-gray-200/80 text-black border-gray-300';
    case 'Delivered':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export default function AdminOrdersPage() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!profileLoading) {
      if (!userProfile || userProfile.userRole !== 'ADMIN') {
        router.push('/access-denied');
      }
    }
  }, [userProfile, profileLoading, router]);

  const allOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allOrders, loading: ordersLoading } = useCollection<Order>(allOrdersQuery);

  const allStoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'stores'));
  }, [firestore]);

  const { data: allStores, loading: storesLoading } = useCollection<Store>(allStoresQuery);

  const storesMap = useMemo(() => {
    if (!allStores) return new Map();
    return new Map(allStores.map(store => [store.id, store.storeName]));
  }, [allStores]);

  const getStoreIdFromPath = (path: string) => {
    if (!path) return 'Unknown';
    const parts = path.split('/');
    const storesIndex = parts.indexOf('stores');
    if (storesIndex !== -1 && storesIndex + 1 < parts.length) {
      return parts[storesIndex + 1];
    }
    return 'Unknown';
  }

  const isLoading = profileLoading || ordersLoading || storesLoading;

  if (isLoading) {
    return null;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
        <ShoppingCart /> All Platform Orders
      </h1>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Live Order Stream</CardTitle>
          <CardDescription>
            A real-time view of all orders placed across all SOMA storefronts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allOrders && allOrders.length > 0 ? (
                allOrders.map((order) => {
                  const storeId = getStoreIdFromPath(order.id);
                  const storeName = storesMap.get(storeId) || 'Unknown Store';

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{storeName}</TableCell>
                      <TableCell className="font-mono text-xs">{order.orderId || '---'}</TableCell>
                      <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '--'}</TableCell>
                      <TableCell className="text-center">
                          <Badge className={cn("text-xs", getStatusClasses(order.status))}>
                            {order.status || 'Pending'}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">${(order.total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No orders have been placed on the platform yet.
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
