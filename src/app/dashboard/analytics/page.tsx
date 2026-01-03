import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Analytics</h1>
            <Card className="border-primary/50 text-center flex flex-col items-center justify-center h-96">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4">
                       <BarChart2 className="h-12 w-12 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-2xl font-headline">Advanced Analytics Coming Soon</CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Get ready for deep insights into your sales, visitors, and performance.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
