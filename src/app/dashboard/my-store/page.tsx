'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Rocket, UploadCloud, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createClientStore } from '@/ai/flows/create-client-store';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';

const templates = [
  { id: 'minimalist', name: 'The Minimalist' },
  { id: 'gold-standard', name: 'The Gold Standard' },
  { id: 'midnight-pro', name: 'The Midnight Pro' },
];

const progressSteps = [
    { progress: 25, message: 'Building your luxury storefront...' },
    { progress: 65, message: 'Importing premium catalog...' },
    { progress: 100, message: 'Going Live!' },
];

const NameStep = ({ storeName, setStoreName, onNext }: { storeName: string, setStoreName: (name: string) => void, onNext: () => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid md:grid-cols-2 gap-12 items-center"
        >
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold font-headline text-primary">Name Your Empire</h2>
                    <p className="text-muted-foreground">This will be displayed on your invoices and storefront.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="store-name" className="text-base">Store Name</Label>
                    <Input 
                        id="store-name"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g., 'Elegance & Co.'"
                        className="border-primary/50 focus-visible:ring-primary h-12 text-lg"
                    />
                </div>
                <div className="flex justify-end">
                    <Button size="lg" className="h-12" onClick={onNext} disabled={!storeName}>
                       Next: Branding <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
                 <div className="relative w-full max-w-sm h-56 rounded-lg bg-gradient-to-br from-yellow-900 via-yellow-700 to-amber-500 p-6 shadow-2xl shadow-primary/20 flex flex-col justify-center items-center border-4 border-yellow-400/50">
                    <AnimatePresence mode="wait">
                         <motion.h3 
                            key={storeName}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-4xl font-serif text-white tracking-wider text-center"
                         >
                            {storeName || 'Your Store Name'}
                         </motion.h3>
                    </AnimatePresence>
                    <p className="text-sm text-yellow-200/80 mt-2 font-serif">Luxury Goods & Fine Wares</p>
                </div>
            </div>
        </motion.div>
    );
};

const BrandingStep = ({ onNext, onBack, logoFile, setLogoFile, faviconFile, setFaviconFile, isLaunching }: { onNext: () => void, onBack: () => void, logoFile: File | null, setLogoFile: (file: File | null) => void, faviconFile: File | null, setFaviconFile: (file: File | null) => void, isLaunching: boolean }) => {
    return (
         <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-2xl font-bold font-headline text-primary">Upload Your Branding</h2>
                <p className="text-muted-foreground">Optional. You can always add these later.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <Label htmlFor="store-logo" className="text-base">Store Logo</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="store-logo" className={cn("flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg bg-card", !isLaunching && "cursor-pointer hover:bg-muted border-primary/30 hover:border-primary")}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground"/>
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG (REC. 240x80px)</p>
                            </div>
                            <Input id="store-logo" type="file" className="hidden" disabled={isLaunching} onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                        </label>
                    </div> 
                    {logoFile && <p className="text-sm text-muted-foreground">Selected: {logoFile.name}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="favicon" className="text-base">Favicon</Label>
                    <div className="flex items-center justify-center w-full">
                         <label htmlFor="favicon" className={cn("flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg bg-card", !isLaunching && "cursor-pointer hover:bg-muted border-primary/30 hover:border-primary")}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground"/>
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">ICO, PNG, JPG (REC. 32x32px)</p>
                            </div>
                            <Input id="favicon" type="file" className="hidden" disabled={isLaunching} onChange={(e) => setFaviconFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>
                    {faviconFile && <p className="text-sm text-muted-foreground">Selected: {faviconFile.name}</p>}
                </div>
            </div>
             <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button size="lg" className="h-12" onClick={onNext}>
                    Next: Template <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </motion.div>
    );
};

const TemplateStep = ({ onBack, onLaunch, selectedTemplate, setSelectedTemplate, isLaunching, launchProgress, progressMessage }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
        >
             <div>
                <h2 className="text-2xl font-bold font-headline text-primary">Choose Your Aesthetic</h2>
                <p className="text-muted-foreground">Select a template that best represents your brand.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map((template) => (
                <Card
                    key={template.id}
                    onClick={() => !isLaunching && setSelectedTemplate(template.id)}
                    className={cn(
                    'cursor-pointer transition-all duration-200 border-2 flex flex-col items-center justify-center p-6 text-center h-48',
                    selectedTemplate === template.id
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50',
                    isLaunching && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {selectedTemplate === template.id && (
                    <Check className="h-6 w-6 text-primary mt-2" />
                    )}
                </Card>
                ))}
            </div>
            
            {isLaunching && (
                <Card className="border-primary/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-full">
                                <Progress value={launchProgress} className="w-full h-3 bg-muted border border-primary/20" />
                                <p className="text-center text-sm text-primary font-medium mt-2">{progressMessage}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        
            <div className="flex justify-between items-center">
                 <Button variant="ghost" onClick={onBack} disabled={isLaunching}>
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button 
                    size="lg" 
                    className="w-full md:w-auto h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={onLaunch}
                    disabled={isLaunching}
                >
                    <Rocket className="mr-2 h-5 w-5"/> 
                    {isLaunching ? 'Provisioning Store...' : 'Launch Store'}
                </Button>
            </div>
        </motion.div>
    );
}

export default function MyStorePage() {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('gold-standard');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  const handleLaunch = async () => {
    setIsLaunching(true);

    try {
        const userId = "my-test-store"; 
        
        const logoUrl = logoFile ? `/uploads/${logoFile.name}` : '';
        const faviconUrl = faviconFile ? `/uploads/${faviconFile.name}` : '';

        for (const step of progressSteps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setLaunchProgress(step.progress);
            setProgressMessage(step.message);
        }

        await createClientStore({
            userId,
            template: selectedTemplate,
            logoUrl,
            faviconUrl,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: 'Your store is live!',
            description: 'Congratulations! Your store has been successfully launched.',
        });

        router.push('/dashboard');

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: 'Launch Failed',
            description: error.message || 'An unexpected error occurred.',
        });
        setLaunchProgress(0);
        setProgressMessage('');
    } finally {
        setIsLaunching(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="space-y-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold font-headline text-primary">SOMA Store Launcher</h1>
        <p className="text-muted-foreground">Follow the steps to configure and launch your new luxury storefront.</p>
        <Progress value={(step / 3) * 100} className="w-full h-2 mt-4 bg-muted border border-primary/20" />
      </div>
      
      <Card className="border-primary/50">
        <CardContent className="p-6 md:p-10">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <NameStep 
                        key="step1"
                        storeName={storeName} 
                        setStoreName={setStoreName}
                        onNext={nextStep} 
                    />
                )}
                {step === 2 && (
                    <BrandingStep 
                        key="step2"
                        onNext={nextStep} 
                        onBack={prevStep}
                        logoFile={logoFile}
                        setLogoFile={setLogoFile}
                        faviconFile={faviconFile}
                        setFaviconFile={setFaviconFile}
                        isLaunching={isLaunching}
                    />
                )}
                 {step === 3 && (
                    <TemplateStep
                        key="step3" 
                        onBack={prevStep}
                        onLaunch={handleLaunch}
                        selectedTemplate={selectedTemplate}
                        setSelectedTemplate={setSelectedTemplate}
                        isLaunching={isLaunching}
                        launchProgress={launchProgress}
                        progressMessage={progressMessage}
                    />
                )}
            </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

    