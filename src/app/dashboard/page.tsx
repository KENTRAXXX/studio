import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Store, TrendingUp, Users } from "lucide-react";

const metricCards = [
    { title: "Store Status", value: "Active", icon: Store },
    { title: "Total Sales", value: "$0.00", icon: TrendingUp },
    { title: "Visitors Today", value: "0", icon: Users },
];

const checklistItems = [
    { id: "connect-domain", label: "Connect Domain" },
    { id: "import-products", label: "Import Products" },
    { id: "go-live", label: "Go Live" },
]

export default function DashboardOverview() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Overview</h1>

            <div className="grid gap-6 md:grid-cols-3">
                {metricCards.map(item => (
                    <Card key={item.title} className="border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                            <item.icon className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{item.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Check className="text-primary"/>
                        Quick Start
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {checklistItems.map(item => (
                         <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox id={item.id} className="border-primary data-[state=checked]:bg-primary"/>
                            <label
                                htmlFor={item.id}
                                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {item.label}
                            </label>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
