'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Rocket, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

const templates = [
  { id: 'minimalist', name: 'The Minimalist' },
  { id: 'gold-standard', name: 'The Gold Standard' },
  { id: 'midnight-pro', name: 'The Midnight Pro' },
];

export default function MyStorePage() {
  const [selectedTemplate, setSelectedTemplate] = useState('gold-standard');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleLaunch = async () => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore is not available. Please try again later.",
      });
      return;
    }

    setIsLaunching(true);
    try {
        // In a real app, you would get the storeId from the authenticated user
        const storeId = "my-test-store"; 
        const storeRef = doc(firestore, 'stores', storeId);

        // Here you would typically upload files to Firebase Storage and get URLs
        const logoUrl = logoFile ? `/uploads/${logoFile.name}` : '';
        const faviconUrl = faviconFile ? `/uploads/${faviconFile.name}` : '';

        await setDoc(storeRef, {
            template: selectedTemplate,
            logoUrl: logoUrl,
            faviconUrl: faviconUrl,
            status: 'Live',
        }, { merge: true });

        toast({
            title: 'Your store is live!',
            description: 'Congratulations! Your store has been successfully launched.',
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: 'Launch Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsLaunching(false);
    }
  };


  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary">My Store Configuration</h1>
        <p className="text-muted-foreground">Customize the look and feel of your storefront.</p>
      </div>
      
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Template Selector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  'cursor-pointer transition-all duration-200 border-2 flex flex-col items-center justify-center p-6 text-center h-48',
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {selectedTemplate === template.id && (
                  <Check className="h-6 w-6 text-primary mt-2" />
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-primary/50">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Branding</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <Label htmlFor="store-logo" className="text-base">Store Logo</Label>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="store-logo" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted border-primary/30 hover:border-primary">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground"/>
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG (REC. 240x80px)</p>
                        </div>
                        <Input id="store-logo" type="file" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    </label>
                </div> 
                {logoFile && <p className="text-sm text-muted-foreground">Selected: {logoFile.name}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="favicon" className="text-base">Favicon</Label>
                <div className="flex items-center justify-center w-full">
                     <label htmlFor="favicon" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted border-primary/30 hover:border-primary">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground"/>
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">ICO, PNG, JPG (REC. 32x32px)</p>
                        </div>
                        <Input id="favicon" type="file" className="hidden" onChange={(e) => setFaviconFile(e.target.files?.[0] || null)} />
                    </label>
                </div>
                {faviconFile && <p className="text-sm text-muted-foreground">Selected: {faviconFile.name}</p>}
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
            size="lg" 
            className="w-full md:w-auto h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleLaunch}
            disabled={isLaunching}
        >
          <Rocket className="mr-2 h-5 w-5"/> 
          {isLaunching ? 'Launching...' : 'Launch Store'}
        </Button>
      </div>
    </div>
  );
}