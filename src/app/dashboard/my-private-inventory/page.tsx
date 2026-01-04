'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle, Upload, Loader2, Warehouse } from "lucide-react";
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
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddPrivateProductModal } from '@/components/AddPrivateProductModal';

type PrivateProduct = {
  id: string;
  name: string;
  suggestedRetailPrice: number;
  stock: number;
  imageUrl: string;
}

export default function MyPrivateInventoryPage() {
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLoading = userLoading || profileLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!userProfile || (userProfile.planTier !== 'MERCHANT' && userProfile.planTier !== 'ENTERPRISE')) {
        router.push('/access-denied');
      }
    }
  }, [isLoading, userProfile, router]);

  const privateProductsRef = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'stores', user.uid, 'products'),
      where('isManagedBySoma', '==', false)
    );
  }, [firestore, user]);

  const { data: privateProducts, loading: productsLoading } = useCollection<PrivateProduct>(privateProductsRef);
  
  const getPlaceholderImage = (id: string) => {
    // This is a mock lookup. In a real app, you'd have a more robust way to handle images.
    // We'll use the product image URL directly if it's a full URL.
    if (id?.startsWith('https')) return id;
    return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/100/100';
  }

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (userProfile?.planTier !== 'MERCHANT' && userProfile?.planTier !== 'ENTERPRISE') {
      return null; // Render nothing while redirecting
  }

  return (
    <>
    <AddPrivateProductModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">My Private Inventory</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Upload className="mr-2 h-5 w-5"/>
                Import from CSV
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-5 w-5"/>
                Add New Product
            </Button>
        </div>
      </div>

      <Card className="border-primary/50">
          <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>A list of products you manage and fulfill yourself.</CardDescription>
          </CardHeader>
          <CardContent>
               {productsLoading ? (
                 <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
               ) : !privateProducts || privateProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg">
                    <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold font-headline text-primary">Your Warehouse is Empty</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Add your first product to start selling.</p>
                    <Button onClick={() => setIsModalOpen(true)} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                        <PlusCircle className="mr-2 h-5 w-5"/>
                        Upload Your First Luxury Item
                    </Button>
                </div>
               ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-center">Stock</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {privateProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                                        <Image
                                            src={getPlaceholderImage(product.imageUrl)}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="product photo"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right font-mono">${product.suggestedRetailPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge>{product.stock || 0}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">Edit</Button>
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
