'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle, Upload, Loader2 } from "lucide-react";
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
            <Button asChild className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/backstage/add-product">
                    <PlusCircle className="mr-2 h-5 w-5"/>
                    Add New Product
                </Link>
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
                        {privateProducts && privateProducts.length > 0 ? (
                            privateProducts.map((product) => (
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    You haven't added any private products yet.
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
