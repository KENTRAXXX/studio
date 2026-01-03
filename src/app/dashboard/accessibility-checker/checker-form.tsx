"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessibilitySuggestions } from "@/ai/flows/accessibility-suggestions";
import { Loader2, Sparkles } from "lucide-react";

type AIState = {
  suggestions?: string;
  error?: string;
};

export default function CheckerForm() {
  const [componentCode, setComponentCode] = useState("");

  async function formAction(
    prevState: AIState,
    formData: FormData
  ): Promise<AIState> {
    const componentCode = formData.get("componentCode") as string;
    if (!componentCode || componentCode.trim().length < 20) {
      return { error: "Please enter a valid component code snippet (min 20 characters)." };
    }
    try {
      const result = await getAccessibilitySuggestions({ componentCode });
      return { suggestions: result.suggestions };
    } catch (e: any) {
      return { error: e.message || "An unknown error occurred." };
    }
  }

  const [state, dispatch] = useFormState(formAction, {});

  return (
    <form
      action={dispatch}
      className="grid grid-cols-1 md:grid-cols-2 gap-8"
    >
      <div className="space-y-4">
        <Textarea
          name="componentCode"
          placeholder={`// Paste your React component code here...\n\nconst MyComponent = () => (\n  <div>\n    <span>Click me</span>\n  </div>\n);`}
          className="min-h-[300px] font-mono text-xs"
          value={componentCode}
          onChange={(e) => setComponentCode(e.target.value)}
        />
        <Button
          type="submit"
          className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Get Suggestions
        </Button>
      </div>

      <Card className="border-dashed min-h-[300px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.suggestions && (
            <div
              className="prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: state.suggestions.replace(/\n/g, "<br />"),
              }}
            />
          )}
          {state.error && (
            <p className="text-destructive">{state.error}</p>
          )}
          {!state.suggestions && !state.error && (
            <p className="text-muted-foreground">
              Your accessibility suggestions will appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
