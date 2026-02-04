import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accessibility, ShieldCheck } from "lucide-react";
import CheckerForm from "./checker-form";

export default function AccessibilityCheckerPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <Accessibility className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Boutique Integrity Audit</h1>
                        <p className="text-muted-foreground mt-1">AI-powered accessibility and standards diagnostic engine.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">WCAG 2.1 Compliant Engine</span>
                </div>
            </div>
           
            <Card className="border-primary/50 overflow-hidden bg-slate-900/20">
                <CardHeader className="bg-muted/30 border-b border-primary/10">
                    <CardTitle>Inclusive Commerce Standards</CardTitle>
                    <CardDescription>
                        Ensure your luxury storefront is usable for every customer globally. SOMA automatically secures your core structure, while this tool audits your custom content and color stories.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-10">
                    <CheckerForm />
                </CardContent>
            </Card>
        </div>
    );
}
