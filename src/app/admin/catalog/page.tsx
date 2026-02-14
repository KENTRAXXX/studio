'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Gem, 
    PlusCircle, 
    Loader2, 
    Warehouse, 
    Sparkles, 
    Search, 
    ChevronLeft, 
    ChevronRight,
    Trash2,
    AlertTriangle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useUserProfile } from '@/firebase/user-profile-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, writeBatch, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddMasterProductModal } from '@/components/AddMasterProductModal';
import { EditMasterProductModal } from '@/components/EditMasterProductModal';
import { masterSeedRegistry } from '@/lib/seed-registry';
import { useToast } from '@/hooks/use-toast';

type MasterProduct = {
  id: string;
  name: string;
  masterCost: number;
  retailPrice: number;
  stockLevel: number;
  imageId: string;
  imageGallery?: string[];
  vendorId: string;
  categories?: string[];
  tags?: string[];
}

const ITEMS_PER_PAGE = 20;

export default function AdminCatalogPage() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!profileLoading) {
      if (!userProfile || userProfile.userRole !== 'ADMIN') {
        router.push('/access-denied');
      }
    }
  }, [userProfile, profileLoading, router]);

  const catalogQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'Master_Catalog'));
  }, [firestore]);

  const { data: masterCatalog, loading: productsLoading } = useCollection<MasterProduct>(catalogQuery);

  const filteredCatalog = useMemo(() => {
    if (!masterCatalog) return [];
    return masterCatalog.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [masterCatalog, searchTerm]);

  const totalPages = Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE);
  const paginatedCatalog = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCatalog.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCatalog, currentPage]);

  const handleEditClick = (product: MasterProduct) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };
  
  const getPlaceholderImage = (id: string) => {
    if (id?.startsWith('https')) return id;
    return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/100/100';
  }

  const handleClearCatalog = async () => {
    if (!firestore) return;
    setIsClearing(true);
    
    try {
        const catalogRef = collection(firestore, 'Master_Catalog');
        const snap = await getDocs(catalogRef);
        
        if (snap.empty) {
            toast({ title: 'Registry Empty', description: 'There are no assets to liquidate.' });
            return;
        }

        let batch = writeBatch(firestore);
        let count = 0;

        for (const docSnap of snap.docs) {
            batch.delete(docSnap.ref);
            count++;
            
            // Commit in chunks of 450 to stay under the 500 operation limit
            if (count % 450 === 0) {
                await batch.commit();
                batch = writeBatch(firestore);
            }
        }

        await batch.commit();
        toast({
            title: 'Registry Liquidated',
            description: `${count} legacy assets have been purged from the system.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Liquidation Failed',
            description: error.message
        });
    } finally {
        setIsClearing(false);
    }
  };

  const handleSeedCatalog = async () => {
    if (!firestore) return;
    
    if (masterSeedRegistry.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Registry Empty',
            description: 'The modular seed registry has not been populated yet.'
        });
        return;
    }

    setIsSeeding(true);
    
    try {
        let batch = writeBatch(firestore);
        const catalogRef = collection(firestore, 'Master_Catalog');

        for (let i = 0; i < masterSeedRegistry.length; i++) {
            const item = masterSeedRegistry[i];
            const id = item.id || `seed-${String(i + 1).padStart(4, '0')}`;
            
            const newDocRef = doc(catalogRef, id);
            batch.set(newDocRef, {
                ...item,
                id,
                status: 'active',
                vendorId: item.vendorId || 'admin',
                productType: item.productType || 'INTERNAL',
                submittedAt: serverTimestamp(),
                isActive: true
            });

            if ((i + 1) % 450 === 0) {
                await batch.commit();
                batch = writeBatch(firestore);
            }
        }

        await batch.commit();
        toast({
            title: 'Global Catalog Synchronized',
            description: `${masterSeedRegistry.length} curated assets have been deployed to the Master Catalog.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Seeding Failed',
            description: error.message
        });
    } finally {
        setIsSeeding(false);
    }
  };

  const isLoading = profileLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <AddMasterProductModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    {selectedProduct && (
      <EditMasterProductModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        product={selectedProduct}
      />
    )}
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Gem className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Master Catalog Editor</h1>
        </div>
        <div className="flex gap-3">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button 
                        variant="outline" 
                        disabled={isClearing || masterCatalog?.length === 0}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                        {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Liquidate Registry
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-destructive">
                    <AlertDialogHeader>
                        <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit mb-4">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-destructive font-headline text-center">Execute Global Liquidation?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center pt-2">
                            This action will permanently delete ALL documents from the Master Catalog. Boutique owners will lose synchronization access to these assets instantly.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center gap-3">
                        <AlertDialogCancel className="border-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCatalog} className="bg-destructive hover:bg-destructive/90 text-white font-bold">
                            Liquidate Registry
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button 
                variant="outline" 
                onClick={handleSeedCatalog} 
                disabled={isSeeding}
                className="border-primary/30 text-primary hover:bg-primary/5"
            >
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Ingest Curated Registry ({masterSeedRegistry.length})
            </Button>
            
            <Button onClick={() => setIsAddModalOpen(true)} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                <PlusCircle className="mr-2 h-5 w-5"/>
                Add New Product
            </Button>
        </div>
      </div>

      <Card className="border-primary/50">
          <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle>All Master Products</CardTitle>
                    <CardDescription>Directly manage the global product catalog available for dropshipping.</CardDescription>
                </div>
                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search name or category..." 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 h-10 border-primary/20"
                    />
                </div>
              </div>
          </CardHeader>
          <CardContent>
               {isLoading ? (
                 <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
               ) : !masterCatalog || masterCatalog.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg">
                    <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold font-headline text-primary">The Master Catalog is Empty</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Deploy your curated registry to initialize the platform.</p>
                    <Button onClick={handleSeedCatalog} disabled={isSeeding} variant="outline" className="border-primary text-primary font-bold h-12 px-8">
                        {isSeeding ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                        Deploy Registry ({masterSeedRegistry.length} items)
                    </Button>
                </div>
               ) : (
                <div className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Wholesale</TableHead>
                                    <TableHead className="text-right">Retail</TableHead>
                                    <TableHead className="text-center">Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCatalog.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                                                <Image
                                                    src={getPlaceholderImage(product.imageId)}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    data-ai-hint="product photo"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {product.categories?.[0] || 'Uncategorized'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">${product.masterCost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono text-primary">${product.retailPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={product.stockLevel < 10 ? "destructive" : "default"}>{product.stockLevel || 0}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-4">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-bold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredCatalog.length)}</span> of <span className="font-bold text-foreground">{filteredCatalog.length}</span> luxury assets
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-xs font-bold font-mono">
                                    {currentPage} / {totalPages}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
               )}
          </CardContent>
      </Card>
    </div>
    </>
  );
}
