import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes } from "lucide-react";

export default function ProductCatalogPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Product Catalog</h1>
            <Card className="border-primary/50 text-center flex flex-col items-center justify-center h-96">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4">
                       <Boxes className="h-12 w-12 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-2xl font-headline">Product Catalog Coming Soon</CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Manage your product inventory and details.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
