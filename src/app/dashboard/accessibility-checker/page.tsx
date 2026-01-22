import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accessibility } from "lucide-react";
import CheckerForm from "./checker-form";

export const runtime = 'edge';

export default function AccessibilityCheckerPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                 <Accessibility className="h-8 w-8 text-primary" />
                 <h1 className="text-3xl font-bold font-headline">Accessibility Checker</h1>
            </div>
           
            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle>AI-Powered Suggestions</CardTitle>
                    <CardDescription>
                        Paste your component code below to get AI-powered suggestions for improving its accessibility.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckerForm />
                </CardContent>
            </Card>
        </div>
    );
}
