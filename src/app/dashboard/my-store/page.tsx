
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Rocket, UploadCloud, ChevronRight, ChevronLeft, ShoppingBag, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createClientStore } from '@/ai/flows/create-client-store';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { masterCatalog } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { collection, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const progressSteps = [
    { progress: 25, message: 'Securing your custom domain...' },
    { progress: 50, message: 'Syncing with Master Warehouse...' },
    { progress: 75, message: 'Optimizing luxury theme assets...' },
    { progress: 100, message: 'Store Live!' },
];

const ChoosePathStep = ({ onSelectPath }: { onSelectPath: (path: 'MERCHANT' | 'DROPSHIP') => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
        >
            <h2 className="text-2xl font-bold font-headline text-primary mb-2">Choose Your Path</h2>
            <p className="text-muted-foreground mb-8">How do you want to build your empire?</p>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card onClick={() => onSelectPath('MERCHANT')} className="cursor-pointer hover:border-primary/80 hover:shadow-lg transition-all duration-200">
                    <CardHeader className="items-center">
                        <ShoppingBag className="h-12 w-12 text-primary mb-4" />
                        <CardTitle>I have my own products.</CardTitle>
                        <CardDescription>Sell your own unique goods. You manage inventory and fulfillment.</CardDescription>
                    </CardHeader>
                </Card>
                <Card onClick={() => onSelectPath('DROPSHIP')} className="cursor-pointer hover:border-primary/80 hover:shadow-lg transition-all duration-200">
                     <CardHeader className="items-center">
                        <Boxes className="h-12 w-12 text-primary mb-4" />
                        <CardTitle>I want to dropship.</CardTitle>
                        <CardDescription>Sell products from the SOMA Luxury Catalog without holding inventory.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </motion.div>
    )
}

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

const BrandingStep = ({ onNext, onBack, logoFile, setLogoFile, faviconFile, setFaviconFile }: { onNext: () => void, onBack: () => void, logoFile: File | null, setLogoFile: (file: File | null) => void, faviconFile: File | null, setFaviconFile: (file: File | null) => void }) => {
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
                        <label htmlFor="store-logo" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted border-primary/30 hover:border-primary bg-card">
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
                         <label htmlFor="favicon" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted border-primary/30 hover:border-primary bg-card">
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
            </div>
             <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button size="lg" className="h-12" onClick={onNext}>
                    Next <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </motion.div>
    );
};

const CollectionStep = ({ onBack, onLaunch, selectedProducts, setSelectedProducts }: any) => {
    const productsToShow = masterCatalog.slice(0, 6);
    
    const handleProductSelect = (productId: string, checked: boolean) => {
        setSelectedProducts((prev: string[]) => 
            checked ? [...prev, productId] : prev.filter(id => id !== productId)
        );
    }
    
    const getPlaceholderImage = (id: string) => {
        return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400';
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
        >
             <div>
                <h2 className="text-2xl font-bold font-headline text-primary">Curate Your Collection</h2>
                <p className="text-muted-foreground">Select at least 3 signature pieces to feature on your homepage.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {productsToShow.map((product) => (
                <div
                    key={product.id}
                    onClick={() => handleProductSelect(product.id, !selectedProducts.includes(product.id))}
                    className={cn(
                    'relative cursor-pointer transition-all duration-200 border-2 rounded-lg overflow-hidden',
                    selectedProducts.includes(product.id)
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    )}
                >
                    <div className="absolute top-2 right-2 z-10">
                        <Checkbox 
                            id={`product-${product.id}`}
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                        />
                    </div>
                    <div className="relative w-full aspect-square">
                        <Image src={getPlaceholderImage(product.imageId)} alt={product.name} fill className="object-cover" />
                    </div>
                     <div className="p-2 text-center bg-card">
                         <p className="text-sm font-semibold truncate">{product.name}</p>
                     </div>
                </div>
                ))}
            </div>
        
            <div className="flex justify-between items-center">
                 <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button 
                    size="lg" 
                    className="w-full md:w-auto h-16 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={onLaunch}
                    disabled={selectedProducts.length < 3}
                >
                    <Rocket className="mr-2 h-5 w-5"/> 
                    LAUNCH MY EMPIRE
                </Button>
            </div>
        </motion.div>
    );
}

const ProductUploadStep = ({ onBack, onLaunch }: { onBack: () => void, onLaunch: (firstProduct: any) => void }) => {
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const canLaunch = productName && price && stock && description && imageUrl;

    const handleLaunch = () => {
        const firstProduct = {
            name: productName,
            suggestedRetailPrice: parseFloat(price),
            stock: parseInt(stock, 10),
            description,
            imageUrl,
            isManagedBySoma: false,
            productType: 'INTERNAL',
        };
        onLaunch(firstProduct);
    };

    return (
         <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
        >
             <div>
                <h2 className="text-2xl font-bold font-headline text-primary">Upload Your First Product</h2>
                <p className="text-muted-foreground">Add a signature item to get your store started.</p>
            </div>
             <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., 'The Olympian Chronograph'"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image-url">Product Image URL</Label>
                        <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://your-cdn.com/image.jpg"/>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..."/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="650.00"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="100"/>
                    </div>
                 </div>
             </div>
             <div className="flex justify-between items-center">
                 <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button 
                    size="lg" 
                    className="w-full md:w-auto h-16 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleLaunch}
                    disabled={!canLaunch}
                >
                    <Rocket className="mr-2 h-5 w-5"/> 
                    LAUNCH MY EMPIRE
                </Button>
            </div>
         </motion.div>
    )
}

const DeploymentOverlay = ({ messages, onComplete }: { messages: string[], onComplete: () => void }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        if (currentMessageIndex < messages.length - 1) {
            const timer = setTimeout(() => {
                setCurrentMessageIndex(prev => prev + 1);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            const finalTimer = setTimeout(onComplete, 1500);
            return () => clearTimeout(finalTimer);
        }
    }, [currentMessageIndex, messages, onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
        >
            <div className="relative flex items-center justify-center">
                <motion.div
                    className="absolute h-48 w-48 rounded-full border-4 border-primary/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    className="absolute h-64 w-64 rounded-full border-4 border-dashed border-primary/50"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                />
                <Rocket className="w-16 h-16 text-primary" />
            </div>
            <AnimatePresence mode="wait">
                <motion.p
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-xl text-primary-foreground mt-12 font-medium"
                >
                    {messages[currentMessageIndex]}
                </motion.p>
            </AnimatePresence>
        </motion.div>
    );
};


export default function MyStorePage() {
  const [step, setStep] = useState(0); 
  const [storeType, setStoreType] = useState<'MERCHANT' | 'DROPSHIP' | null>(null);
  const [storeName, setStoreName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile();
  const firestore = useFirestore();

  const handleLaunch = async (firstProduct?: any) => {
    if (!user || !firestore || !storeType || !userProfile) return;
    setIsLaunching(true);

    try {
        const userId = user.uid; 
        const storeRef = doc(firestore, 'stores', userId);
        const userRef = doc(firestore, 'users', userId);
        
        const logoUrl = logoFile ? `/uploads/${logoFile.name}` : '';
        const faviconUrl = faviconFile ? `/uploads/${faviconFile.name}` : '';
        
        const planTier = userProfile.planTier || (storeType === 'MERCHANT' ? 'MERCHANT' : 'SCALER');
        const userRole = (planTier === 'SELLER' || planTier === 'BRAND') ? 'SELLER' : 'MOGUL';

        // 1. Update User Profile (Client Side)
        await updateDoc(userRef, {
            hasAccess: true,
            planTier: planTier,
            userRole: userRole,
            paidAt: new Date().toISOString(),
        }).catch(async (err) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { hasAccess: true, planTier },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw err;
        });

        // 2. Create Store Configuration (Client Side)
        const storeConfig = {
            userId: userId,
            instanceId: crypto.randomUUID(),
            theme: 'Gold Standard',
            currency: 'USD',
            createdAt: new Date().toISOString(),
            storeName: storeName || "My SOMA Store",
            logoUrl: logoUrl,
            faviconUrl: faviconUrl,
            heroImageUrl: '',
            heroTitle: 'Welcome to Your Store',
            heroSubtitle: 'Discover curated collections of timeless luxury.',
            status: 'Live',
        };

        await setDoc(storeRef, storeConfig).catch(async (err) => {
            const permissionError = new FirestorePermissionError({
                path: storeRef.path,
                operation: 'create',
                requestResourceData: storeConfig,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw err;
        });

        // 3. Handle Product Selection / Upload
        if (storeType === 'MERCHANT' && firstProduct) {
            const productsRef = collection(storeRef, 'products');
            const productDocRef = doc(productsRef);
            await setDoc(productDocRef, {
                ...firstProduct,
                vendorId: userId,
            });
        } else if (storeType === 'DROPSHIP') {
            const productsRef = collection(storeRef, 'products');
            const batch = writeBatch(firestore);
            const productsToSync = masterCatalog.filter(p => selectedProducts.includes(p.id));
            
            productsToSync.forEach(product => {
                const newProductRef = doc(productsRef, product.id);
                batch.set(newProductRef, {
                    name: product.name,
                    suggestedRetailPrice: product.retailPrice,
                    wholesalePrice: product.masterCost,
                    description: `A high-quality ${product.name.toLowerCase()} from our master collection.`,
                    imageUrl: product.imageId,
                    productType: 'INTERNAL',
                    vendorId: 'admin',
                    isManagedBySoma: true,
                });
            });
            await batch.commit();
        }

        // 4. Trigger Welcome Email (Server Side)
        await createClientStore({
            userId,
            email: user.email!,
            storeName: storeConfig.storeName,
        });

    } catch (error: any) {
        setIsLaunching(false);
        toast({
            variant: "destructive",
            title: 'Launch Failed',
            description: error.message || 'An unexpected error occurred during launch.',
        });
    }
  };

  const onLaunchComplete = () => {
      toast({
          title: 'Your empire is live!',
          description: 'Congratulations! Your store has been successfully launched.',
      });
      router.push('/dashboard');
  }
  
  const handlePathSelection = (path: 'MERCHANT' | 'DROPSHIP') => {
      setStoreType(path);
      setStep(1);
  }

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const wizardSteps = useMemo(() => {
    const commonSteps = [
        <NameStep key="step1" storeName={storeName} setStoreName={setStoreName} onNext={nextStep} />,
        <BrandingStep key="step2" onNext={nextStep} onBack={prevStep} logoFile={logoFile} setLogoFile={setLogoFile} faviconFile={faviconFile} setFaviconFile={setFaviconFile} />
    ];
    if (storeType === 'MERCHANT') {
        return [
            ...commonSteps,
            <ProductUploadStep key="step3-merchant" onBack={prevStep} onLaunch={handleLaunch} />
        ];
    }
    if (storeType === 'DROPSHIP') {
        return [
            ...commonSteps,
            <CollectionStep key="step3-dropship" onBack={prevStep} onLaunch={() => handleLaunch()} selectedProducts={selectedProducts} setSelectedProducts={setSelectedProducts} />
        ];
    }
    return [];
  }, [storeType, storeName, logoFile, faviconFile, selectedProducts]);

  const currentStepComponent = step === 0 
    ? <ChoosePathStep onSelectPath={handlePathSelection} />
    : wizardSteps[step - 1];

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {isLaunching && (
          <DeploymentOverlay 
            messages={progressSteps.map(p => p.message)}
            onComplete={onLaunchComplete}
          />
        )}
      </AnimatePresence>

      <div className="mb-12">
        <h1 className="text-3xl font-bold font-headline text-primary">SOMA Launch Wizard</h1>
        <p className="text-muted-foreground">Follow the steps to configure and launch your new luxury storefront.</p>
        <Progress value={storeType ? (step / wizardSteps.length) * 100 : 0} className="w-full h-2 mt-4 bg-muted border border-primary/20" />
      </div>
      
      <Card className="border-primary/50">
        <CardContent className="p-6 md:p-10">
            <AnimatePresence mode="wait">
                {currentStepComponent}
            </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
