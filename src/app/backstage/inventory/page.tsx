'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Package,
  AlertTriangle,
  Check,
  Search,
  Warehouse,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SomaLogo from '@/components/logo';
import { formatCurrency } from '@/utils/format';

type InventoryProduct = {
  id: string;
  name: string;
  masterCost: number;
  retailPrice: number;
  stockLevel: number;
  imageUrl?: string;
  imageUrls?: string[];
  status: 'pending_review' | 'active' | 'rejected';
  vendorId: string;
};

export default function SupplierInventoryPage() {
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Guard: Redirect if pending review or wrong role
  useEffect(() => {
    if (!profileLoading && userProfile) {
      if (userProfile.status === 'pending_review') {
        router.push('/backstage/pending-review');
      }
      if (userProfile.planTier !== 'SELLER' && userProfile.planTier !== 'BRAND') {
        router.push('/access-denied');
      }
    }
  }, [userProfile, profileLoading, router]);

  // Data Fetching
  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'Master_Catalog'),
      where('vendorId', '==', user.uid),
      orderBy('name', 'asc')
    );
  }, [firestore, user]);

  const { data: products, loading: dataLoading } = useCollection<InventoryProduct>(inventoryQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleStartEdit = (product: InventoryProduct) => {
    setEditingId(product.id);
    setTempStock(product.stockLevel.toString());
  };

  const handleSaveStock = async (productId: string) => {
    if (!firestore || isUpdating) return;
    
    const newStock = parseInt(tempStock, 10);
    if (isNaN(newStock) || newStock < 0) {
        toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Stock level must be a positive number.' });
        return;
    }

    setIsUpdating(true);
    try {
      const productRef = doc(firestore, 'Master_Catalog', productId);
      await updateDoc(productRef, {
        stockLevel: newStock,
      });

      toast({
        title: 'Inventory Updated',
        description: 'Global stock level synchronized successfully.',
      });
      setEditingId(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === 'Enter') handleSaveStock(productId);
    if (e.key === 'Escape') setEditingId(null);
  };

  if (userLoading || profileLoading || dataLoading) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <SomaLogo className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight text-white">Inventory Manager</h1>
        <p className="mt-2 text-lg text-muted-foreground">Maintain global stock availability for your boutique network.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by name or SKU..." 
                className="pl-10 bg-slate-900/50 border-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="border-primary/20 bg-slate-900/50">
                <History className="h-4 w-4 mr-2" />
                Stock Logs
            </Button>
            <Button className="btn-gold-glow bg-primary text-primary-foreground" onClick={() => router.push('/backstage/add-product')}>
                <Package className="h-4 w-4 mr-2" />
                Submit New Item
            </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-slate-900/50 overflow-hidden">
        <CardHeader className="border-b border-primary/10">
          <CardTitle className="text-slate-200 font-headline">Master Inventory Control</CardTitle>
          <CardDescription className="text-slate-500">Updates here affect availability across all SOMA boutiques instantly.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Warehouse className="h-16 w-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold font-headline text-slate-400">Warehouse Empty</h3>
              <p className="text-slate-500 max-w-xs mx-auto">You haven't added any products to the Master Catalog yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-800/50">
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="w-[80px]">Asset</TableHead>
                  <TableHead>Product Details</TableHead>
                  <TableHead className="text-right">Wholesale</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-center">Stock Level</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.stockLevel < 5;
                  const isEditing = editingId === product.id;

                  return (
                    <TableRow 
                      key={product.id} 
                      className={cn(
                        "border-primary/5 transition-colors group",
                        isLowStock ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-primary/5"
                      )}
                    >
                      <TableCell>
                        <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-primary/20 bg-slate-800">
                          <Image 
                            src={product.imageUrl || (product.imageUrls && product.imageUrls[0]) || ''} 
                            alt={product.name} 
                            fill 
                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-200">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-800 px-1.5 py-0.5 rounded">SKU: {product.id.slice(0, 8)}</code>
                            {isLowStock && (
                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[9px] h-4 py-0 font-bold animate-pulse">
                                    REPLENISH SOON
                                </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-400">
                        {formatCurrency(Math.round(product.masterCost * 100))}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatCurrency(Math.round(product.retailPrice * 100))}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                            {isEditing ? (
                                <div className="flex items-center gap-2 max-w-[120px]">
                                    <Input 
                                        type="number" 
                                        value={tempStock} 
                                        onChange={(e) => setTempStock(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, product.id)}
                                        autoFocus
                                        className="h-8 text-center font-mono bg-slate-950 border-primary shadow-gold-glow"
                                    />
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                        onClick={() => handleSaveStock(product.id)}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
                                    </Button>
                                </div>
                            ) : (
                                <div 
                                    className={cn(
                                        "cursor-pointer px-4 py-1.5 rounded-md font-mono font-bold transition-all border",
                                        isLowStock ? "border-amber-500/50 text-amber-500 bg-amber-500/10" : "border-slate-700 text-slate-300 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                                    )}
                                    onClick={() => handleStartEdit(product)}
                                >
                                    {product.stockLevel}
                                </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={cn(
                            "capitalize text-[10px]",
                            product.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                            product.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        )}>
                            {product.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/10 bg-slate-900/30">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-200">Critical Stock Threshold</h4>
                <p className="text-xs text-slate-500">Items under 5 units trigger automatic alerts to your dashboard.</p>
            </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/10 bg-slate-900/30">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Package className="h-5 w-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-200">Global Sync</h4>
                <p className="text-xs text-slate-500">Stock updates are propagated to all verified Mogul boutiques in real-time.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
