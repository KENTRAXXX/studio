'use client';

import { notFound, useParams } from 'next/navigation';
import { HeroSection } from '@/components/store/hero-section';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, or, orderBy, doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Box, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { demoProducts } from '@/lib/demo-data';

/**
 * @fileOverview Reactive Boutique Storefront.
 * Orchestrates store resolution and product display using robust multi-tenancy logic.
 */
export default function StorefrontPage() {
  const params = useParams();
  const identifier = (params.storeId || params.domain || params.site) as string;
  const firestore = useFirestore();

  if (!identifier) {
    notFound();
  }

  const isDemoMode = identifier === 'demo';

  // Robust Identity Resolution: Standardized across all storefront entries
  const storeQuery = useMemoFirebase(() => {
    if (!firestore || isDemoMode) return null;
    
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const originalIdentifier = identifier;
    const normalizedIdentifier = identifier.toLowerCase();
    
    let slug = normalizedIdentifier;
    if (normalizedIdentifier.endsWith(`.${rootDomain}`)) {
        slug = normalizedIdentifier.replace(`.${rootDomain}`, '');
    }
    if (slug.startsWith('www.')) {
        slug = slug.replace('www.', '');
    }

    return query(
        collection(firestore, 'stores'),
        or(
            where('userId', '==', originalIdentifier), // Case-sensitive UID match
            where('customDomain', '==', normalizedIdentifier),
            where('slug', '==', slug)
        ),
        limit(1)
    );
  }, [firestore, identifier, isDemoMode]);

  const { data: storeDocs, loading: storeLoading } = useCollection<any>(storeQuery);
  const storeData = storeDocs?.[0];
  const storeId = storeData?.userId;

  // 2. Fetch Provisioned Products
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId || isDemoMode) return null;
    return query(
        collection(firestore, `stores/${storeId}/products`),
        orderBy('name', 'asc')
    );
  }, [firestore, storeId, isDemoMode]);

  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  const isLoading = (storeLoading || productsLoading) && !isDemoMode;

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!storeData && !isDemoMode) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background px-4 text-center">
            <div className="bg-primary/10 p-6 rounded-full border border-primary/20">
                <Box className="h-16 w-16 text-primary opacity-20" />
            </div>
            <h1 className="text-3xl font-bold font-headline text-primary uppercase tracking-widest">Boutique Not Found</h1>
            <p className="text-muted-foreground max-sm leading-relaxed">
                The boutique at "{identifier}" is not currently provisioned in the SOMA network.
            </p>
            <Button variant="outline" className="border-primary/50 text-primary mt-4" asChild>
                <Link href={`https://${rootDomain}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Platform Home
                </Link>
            </Button>
        </div>
    );
  }

  const finalStoreData = isDemoMode ? {
    heroTitle: 'The SOMA Experience',
    heroSubtitle: 'This is a preview of a live SOMA storefront.',
    heroImageUrl: PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl,
  } : storeData;

  const finalProducts = isDemoMode ? demoProducts.map(p => ({ 
    ...p, 
    price: p.retailPrice, 
    suggestedRetailPrice: p.retailPrice 
  })) : products;

  const heroTitle = finalStoreData?.heroTitle || 'Elegance Redefined';
  const heroSubtitle = finalStoreData?.heroSubtitle || 'Discover curated collections of timeless luxury.';
  const heroImageUrl = finalStoreData?.heroImageUrl || PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl;
  
  return (
    <div className="min-h-screen bg-background">
      <StoreVisitorTracker storeId={storeId || identifier} />
      
      <HeroSection
        imageUrl={heroImageUrl}
        title={heroTitle}
        subtitle={heroSubtitle}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
                <h2 className="text-4xl font-bold font-headline text-white tracking-tighter uppercase">Signature Collection</h2>
                <p className="text-slate-500 italic">Curated assets from the {finalStoreData?.storeName || 'Boutique'} archives.</p>
            </div>
            {!isDemoMode && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 shadow-gold-glow">
                    <Zap className="h-4 w-4 text-primary fill-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Real-time Global Sync Active</span>
                </div>
            )}
        </div>

        <ProductGrid products={finalProducts || []} storeId={storeId || identifier} />
      </main>
    </div>
  );
}