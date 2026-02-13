'use client';

import { notFound, useParams } from 'next/navigation';
import { HeroSection } from '@/components/store/hero-section';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, or, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { demoProducts } from '@/lib/demo-data';

export default function StorefrontPage() {
  const params = useParams();
  const identifier = (params.storeId || params.domain || params.site) as string;
  const firestore = useFirestore();

  if (!identifier) {
    notFound();
  }

  const isDemoMode = identifier === 'demo';

  // 1. Resolve Store Identity
  const storeQuery = useMemoFirebase(() => {
    if (!firestore || isDemoMode) return null;
    return query(
        collection(firestore, 'stores'),
        or(
            where('userId', '==', identifier),
            where('customDomain', '==', identifier),
            where('slug', '==', identifier)
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
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background px-4">
            <div className="bg-primary/10 p-6 rounded-full">
                <Box className="h-16 w-16 text-primary opacity-20" />
            </div>
            <h1 className="text-3xl font-bold font-headline text-primary uppercase tracking-widest text-center">Boutique Not Found</h1>
            <p className="text-muted-foreground text-center max-w-sm">
                The boutique at "{identifier}" is not currently provisioned in our network.
            </p>
            <Button variant="outline" className="border-primary/50" asChild>
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
    <div>
      <StoreVisitorTracker storeId={storeId || identifier} />
      <HeroSection
        imageUrl={heroImageUrl}
        title={heroTitle}
        subtitle={heroSubtitle}
      />

      <section id="products" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center font-headline mb-10">Featured Products</h2>
        <ProductGrid products={finalProducts || []} storeId={storeId || identifier} />
      </section>
    </div>
  );
}
