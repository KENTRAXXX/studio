
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, UploadCloud } from "lucide-react";
import GlobalProductCatalogPage from "./global-product-catalog/page";

const PrivateInventoryView = () => (
    <Card className="border-primary/50 text-center flex flex-col items-center justify-center h-96">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4">
               <Package className="h-12 w-12 text-primary" />
            </div>
        </CardHeader>
        <CardContent>
            <CardTitle className="text-2xl font-headline">Private Inventory Management</CardTitle>
            <p className="text-muted-foreground mt-2">
                This is where you'll add and manage products you fulfill yourself. Coming soon!
            </p>
        </CardContent>
    </Card>
);

const SupplierUploadView = () => (
     <Card className="border-primary/50 text-center flex flex-col items-center justify-center h-96">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4">
               <UploadCloud className="h-12 w-12 text-primary" />
            </div>
        </CardHeader>
        <CardContent>
            <CardTitle className="text-2xl font-headline">Supplier Inventory Upload</CardTitle>
            <p className="text-muted-foreground mt-2">
                This is where you will upload and manage your wholesale inventory. Coming soon!
            </p>
        </CardContent>
    </Card>
);

// Moguls and Scalers see the dropshipping catalog
const DropshipCatalogView = () => (
    <GlobalProductCatalogPage />
);


export default function DashboardController({ planTier }: { planTier?: string }) {
    switch (planTier) {
        case 'MERCHANT':
            return <PrivateInventoryView />;
        case 'MOGUL':
        case 'SCALER':
            return <DropshipCatalogView />;
        case 'SELLER':
            return <SupplierUploadView />;
        default:
             return (
                <Card className="border-destructive/50 text-center flex flex-col items-center justify-center h-96">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline text-destructive">Invalid User Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mt-2">
                           Your user plan '{planTier}' is not recognized. Please contact support.
                        </p>
                    </CardContent>
                </Card>
            );
    }
}
