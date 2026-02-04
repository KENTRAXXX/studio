"use client";

import { useState, useActionState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAccessibilitySuggestions } from "@/ai/flows/accessibility-suggestions";
import { Loader2, Sparkles, Monitor, Code2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUserProfile, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type AIState = {
  suggestions?: string;
  error?: string;
};

export default function CheckerForm() {
  const { userProfile } = useUserProfile();
  const firestore = useFirestore();
  const [mode, setMode] = useState<'automated' | 'manual'>('automated');
  const [isAuditing, setIsAuditing] = useState(false);

  // Fetch store data for automated audit
  const storeRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.id) return null;
    return doc(firestore, 'stores', userProfile.id);
  }, [firestore, userProfile?.id]);
  const { data: storeData } = useDoc<any>(storeRef);

  async function formAction(
    prevState: AIState,
    formData: FormData
  ): Promise<AIState> {
    const componentCode = formData.get("componentCode") as string;
    
    if (mode === 'manual' && (!componentCode || componentCode.trim().length < 20)) {
      return { error: "Please provide a code snippet or switch to Automated mode." };
    }

    try {
      const result = await getAccessibilitySuggestions({ componentCode });
      return { suggestions: result.suggestions };
    } catch (e: any) {
      return { error: e.message || "An unknown error occurred." };
    }
  }

  const [state, dispatch] = useActionState(formAction, {});

  const handleAutomatedAudit = async () => {
    if (!storeData) return;
    setIsAuditing(true);

    // Construct a "Virtual Component" string based on their live configuration
    const virtualComponent = `
      <BoutiqueHeader 
        storeName="${storeData.storeName}"
        tagline="${storeData.heroTitle}"
        theme="${storeData.themeConfig?.id || 'onyx'}"
        primaryColor="${storeData.themeConfig?.colors?.primary || '45 74% 51%'}"
        background="${storeData.themeConfig?.colors?.background || '0 0% 2%'}"
      />
      <BoutiqueBio>
        ${userProfile?.bio || 'No bio provided.'}
      </BoutiqueBio>
    `;

    const formData = new FormData();
    formData.append("componentCode", virtualComponent);
    
    // We manually trigger the dispatch here
    dispatch(formData);
    setIsAuditing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex bg-muted/50 p-1 rounded-xl border border-primary/10 w-fit">
        <Button 
          variant={mode === 'automated' ? 'default' : 'ghost'} 
          onClick={() => setMode('automated')}
          className="h-9 px-4 text-xs font-bold uppercase tracking-widest"
        >
          <Monitor className="mr-2 h-3.5 w-3.5" />
          Automated Audit
        </Button>
        <Button 
          variant={mode === 'manual' ? 'default' : 'ghost'} 
          onClick={() => setMode('manual')}
          className="h-9 px-4 text-xs font-bold uppercase tracking-widest"
        >
          <Code2 className="mr-2 h-3.5 w-3.5" />
          Pro Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input/Control Column */}
        <div className="lg:col-span-5 space-y-6">
          {mode === 'automated' ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline">Live Configuration Sync</CardTitle>
                <CardDescription>The AI will scan your active theme, branding, and copy for accessibility compliance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    <span>Active Assets</span>
                    <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="h-2 w-2" /> Linked</span>
                  </div>
                  <div className="p-4 rounded-lg bg-black/40 border border-white/5 text-xs font-mono space-y-1">
                    <p><span className="text-primary">Theme:</span> {storeData?.themeConfig?.id || 'Standard'}</p>
                    <p><span className="text-primary">Identity:</span> {storeData?.storeName}</p>
                    <p><span className="text-primary">Tagline:</span> {storeData?.heroTitle}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleAutomatedAudit} 
                  disabled={isAuditing || !storeData}
                  className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  {isAuditing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  Run Audit on My Boutique
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form action={dispatch} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">External Snippet (HTML/React)</Label>
                <Textarea
                  name="componentCode"
                  placeholder={`// Paste custom third-party widgets here (e.g. Trustpilot, Instagram feed code)\n\n<div class="tp-widget">...</div>`}
                  className="min-h-[300px] font-mono text-[10px] bg-slate-950 border-primary/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                Scan Pro Snippet
              </Button>
            </form>
          )}

          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-300/80 leading-relaxed italic">
              SOMA automated components are pre-optimized. This tool specifically audits your unique content and external integrations to ensure "Luxury for All".
            </p>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          <Card className={cn(
            "min-h-[500px] border-primary/20 bg-slate-900/30 transition-all duration-500",
            state.suggestions && "border-primary/50 shadow-gold-glow"
          )}>
            <CardHeader className="border-b border-primary/10 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-primary font-headline text-sm uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                Audit Intelligence Report
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <AnimatePresence mode="wait">
                {state.suggestions ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-sm prose-invert max-w-none"
                  >
                    <div className="space-y-4 text-slate-200 leading-relaxed">
                      {state.suggestions.split('\n').map((line, i) => (
                        <p key={i} className={cn(
                          line.startsWith('-') || line.startsWith('*') ? "pl-4 border-l-2 border-primary/30" : ""
                        )}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ) : state.error ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
                    <p className="text-destructive font-bold">{state.error}</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center opacity-40">
                    <Monitor className="h-16 w-16 mb-4 text-slate-600" />
                    <p className="text-sm font-bold uppercase tracking-widest">Awaiting Transmission...</p>
                    <p className="text-xs mt-2 max-w-xs">Run an automated audit to receive strategic accessibility feedback.</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={cn("text-sm font-medium leading-none", className)}>{children}</label>;
}
