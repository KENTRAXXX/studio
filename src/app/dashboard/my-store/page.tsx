'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle, UploadCloud } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const templates = [
  { id: 'luxe', name: 'Luxe Minimal', description: 'Clean, modern, and product-focused.' },
  { id: 'vogue', name: 'Vogue Editorial', description: 'Bold typography and large images.' },
  { id: 'atelier', name: 'Atelier Showcase', description: 'Elegant and artistic layout.' },
];

export default function MyStorePage() {
  const [selectedTemplate, setSelectedTemplate] = useState('luxe');
  const storeLogo = PlaceHolderImages.find(img => img.id === 'store-logo');
  const storeFavicon = PlaceHolderImages.find(img => img.id === 'store-favicon');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">My Store</h1>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Template Selector</CardTitle>
          <CardDescription>Choose the foundational layout for your luxury storefront.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  'cursor-pointer transition-all duration-300 border-2',
                  selectedTemplate === template.id
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-transparent hover:border-primary/50'
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {template.name}
                    {selectedTemplate === template.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Store Logo</CardTitle>
            <CardDescription>Upload your brand's logo (recommended: 400x160px).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full h-24 rounded-md border border-dashed border-muted-foreground/50 flex items-center justify-center">
              {storeLogo && <Image src={storeLogo.imageUrl} alt="Store Logo" width={200} height={80} data-ai-hint={storeLogo.imageHint}/>}
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="logo-upload">
                <Button variant="outline" asChild className="cursor-pointer">
                  <span><UploadCloud className="mr-2 h-4 w-4"/> Upload Logo</span>
                </Button>
              </Label>
              <Input id="logo-upload" type="file" className="hidden" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Store Favicon</CardTitle>
            <CardDescription>Upload your site icon (recommended: 64x64px).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="w-24 h-24 rounded-md border border-dashed border-muted-foreground/50 flex items-center justify-center">
              {storeFavicon && <Image src={storeFavicon.imageUrl} alt="Store Favicon" width={64} height={64} data-ai-hint={storeFavicon.imageHint}/>}
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="favicon-upload">
                 <Button variant="outline" asChild className="cursor-pointer">
                  <span><UploadCloud className="mr-2 h-4 w-4"/> Upload Favicon</span>
                </Button>
              </Label>
              <Input id="favicon-upload" type="file" className="hidden" />
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="flex justify-end">
           <Button size="lg" className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
               Launch Store
           </Button>
       </div>
    </div>
  );
}
