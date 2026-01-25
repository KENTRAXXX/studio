'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, PlusCircle, Loader2, Warehouse } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useUserProfile } from '@/firebase/user-profile-provider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddMasterProductModal } from '@/components/AddMasterProductModal';
import { EditMasterProductModal } from '@/components/EditMasterProductModal';

type MasterProduct = {
  id: string;
  name: string;
  masterCost: number;
  retailPrice: number;
  stockLevel: number;
  imageId: string;
  vendorId: string;
}

export default function AdminCatalogPage() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);

  useEffect(() => {
    if (!profileLoading) {
      if (!userProfile || userProfile.userRole !== 'ADMIN') {
        router.push('/access-denied');
      }
    }
  }, [userProfile, profileLoading, router]);

  const catalogRef = firestore ? query(collection(firestore, 'Master_Catalog')) : null;
  const { data: masterCatalog, loading: productsLoading } = useCollection<MasterProduct>(catalogRef);

  const handleEditClick = (product: MasterProduct) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };
  
  const getPlaceholderImage = (id: string) => {
    if (id?.startsWith('https')) return id;
    return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/100/100';
  }

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
        <Button onClick={() => setIsAddModalOpen(true)} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5"/>
            Add New Product
        </Button>
      </div>

      <Card className="border-primary/50">
          <CardHeader>
              <CardTitle>All Master Products</CardTitle>
              <CardDescription>Directly manage the global product catalog available for dropshipping.</CardDescription>
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
                    <p className="text-muted-foreground mt-2 mb-6">Add the first globally available product.</p>
                </div>
               ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Vendor ID</TableHead>
                            <TableHead className="text-right">Master Cost</TableHead>
                            <TableHead className="text-right">Retail Price</TableHead>
                            <TableHead className="text-center">Stock</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {masterCatalog.map((product) => (
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
                                <TableCell className="font-mono text-xs">{product.vendorId}</TableCell>
                                <TableCell className="text-right font-mono">${product.masterCost.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">${product.retailPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge>{product.stockLevel || 0}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
               )}
          </CardContent>
      </Card>
    </div>
    </>
  );
}
