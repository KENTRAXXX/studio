'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function MyPrivateInventoryPage() {
  // This is placeholder data. In a real application, you would fetch this
  // from Firestore for the currently logged-in user.
  const privateProducts: any[] = [];

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
            <Button className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
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
                    {privateProducts.length > 0 ? (
                        privateProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    {/* Placeholder for Image */}
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right font-mono">${product.price.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge>{product.stockLevel}</Badge>
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
          </CardContent>
      </Card>
    </div>
  );
}
