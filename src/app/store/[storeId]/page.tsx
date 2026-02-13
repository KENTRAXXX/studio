import { notFound } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, where, limit, or } from 'firebase/firestore';
import type { Metadata, ResolvingMetadata } from 'next';

import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { demoProducts } from '@/lib/demo-data';
import { HeroSection } from '@/components/store/hero-section';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';

const getFirestoreInstance = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};
const firestore = getFirestoreInstance();

type StorefrontProduct = {
    id: string;
    name: string;
    description: string;
    suggestedRetailPrice: number;
    wholesalePrice: number;
    imageUrl: string;
    productType: 'INTERNAL' | 'EXTERNAL';
    vendorId: string;
    isManagedBySoma: boolean;
};

async function resolveBoutique(identifier: string) {
    const storesRef = collection(firestore, 'stores');
    const q = query(
        storesRef, 
        or(
            where('userId', '==', identifier),
            where('customDomain', '==', identifier),
            where('slug', '==', identifier)
        ),
        limit(1)
    );
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data();
}

export async function generateMetadata(
  { params }: { params: Promise<{ storeId?: string; domain?: string; site?: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const identifier = resolvedParams.storeId || resolvedParams.domain || resolvedParams.site;
  const isDemoMode = identifier === 'demo';

  if (isDemoMode) {
    return {
      title: 'SOMA Demo Store | Luxury E-commerce Preview',
      description: 'Experience the high-fidelity SOMA storefront. Dynamic product syncing, luxury themes, and integrated checkout.',
    }
  }
  
  if (!identifier) {
    return {
        title: 'SOMA Store',
        description: 'Luxury goods and fine wares.'
    }
  }

  try {
    const storeData = await resolveBoutique(identifier);

    if (!storeData) {
      return {
        title: 'Store Not Found',
      }
    }

    const title = `${storeData.storeName} | SOMA Luxury Boutique`;
    const description = storeData.heroSubtitle || `Experience curated luxury at ${storeData.storeName}. Discover our exclusive collection of timeless assets.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: [storeData.heroImageUrl || ''],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [storeData.heroImageUrl || ''],
      },
      alternates: {
        canonical: storeData.customDomain ? `https://${storeData.customDomain}` : undefined,
      }
    }
  } catch (error) {
     return {
        title: 'SOMA Store',
        description: 'An error occurred while fetching store details.'
    }
  }
}

async function getProducts(siteId: string): Promise<StorefrontProduct[]> {
    const productsQuery = query(
        collection(firestore, `stores/${siteId}/products`),
        orderBy('name')
    );
    const productsSnap = await getDocs(productsQuery);
    return productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as StorefrontProduct));
}


export default async function StorefrontPage({ params }: { params: Promise<{ storeId?: string; domain?: string; site?: string }> }) {
  const resolvedParams = await params;
  const identifier = resolvedParams.storeId || resolvedParams.domain || resolvedParams.site;
  
  if (!identifier) {
    notFound();
  }

  const isDemoMode = identifier === 'demo';

  let storeData;
  let products;

  if (isDemoMode) {
    storeData = {
        heroTitle: 'The SOMA Experience',
        heroSubtitle: 'This is a preview of a live SOMA storefront.',
        heroImageUrl: PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl,
    };
    products = demoProducts.map(p => ({ 
        ...p, 
        price: p.retailPrice, 
        suggestedRetailPrice: p.retailPrice 
    })) as unknown as StorefrontProduct[];
  } else {
    try {
        storeData = await resolveBoutique(identifier);
        if (storeData) {
            products = await getProducts(storeData.userId);
        }
    } catch (error) {
        console.error("Failed to fetch storefront data:", error);
    }
  }

  if (!storeData && !isDemoMode) {
      notFound();
  }

  const heroTitle = storeData?.heroTitle || 'Elegance Redefined';
  const heroSubtitle = storeData?.heroSubtitle || 'Discover curated collections of timeless luxury.';
  const heroImageUrl = storeData?.heroImageUrl || PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl;
  
  return (
    <div>
      <StoreVisitorTracker storeId={storeData?.userId || identifier} />
      <HeroSection
        imageUrl={heroImageUrl}
        title={heroTitle}
        subtitle={heroSubtitle}
      />

      <section id="products" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center font-headline mb-10">Featured Products</h2>
        <ProductGrid products={products || []} storeId={storeData?.userId || identifier} />
      </section>
    </div>
  );
}
