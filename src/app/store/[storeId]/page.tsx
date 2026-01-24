'use server';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Metadata, ResolvingMetadata } from 'next';

import { initializeFirebase } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { demoProducts } from '@/lib/demo-data';
import { HeroSection } from '@/components/store/hero-section';
import { ProductGrid } from '@/components/store/product-grid';

export const runtime = 'edge';

// Initialize Firebase for server-side usage
const { firestore } = initializeFirebase();

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

// This function generates dynamic metadata for each store page
export async function generateMetadata(
  { params }: { params: { storeId: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const storeId = params.storeId;
  const isDemoMode = storeId === 'demo';

  if (isDemoMode) {
    return {
      title: 'SOMA Demo Store',
      description: 'A preview of a live SOMA storefront experience.',
    }
  }
  
  if (!storeId) {
    return {
        title: 'SOMA Store',
        description: 'Luxury goods and fine wares.'
    }
  }

  try {
    const storeRef = doc(firestore, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);
    const storeData = storeSnap.data();

    if (!storeData) {
      return {
        title: 'Store Not Found',
      }
    }

    return {
      title: storeData.storeName || 'SOMA Store',
      description: storeData.heroSubtitle || 'Discover curated collections of timeless luxury.',
      openGraph: {
        images: [storeData.heroImageUrl || ''],
      },
    }
  } catch (error) {
     return {
        title: 'SOMA Store',
        description: 'An error occurred while fetching store details.'
    }
  }
}


async function getStoreData(storeId: string) {
    const storeRef = doc(firestore, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);
    return storeSnap.data();
}

async function getProducts(storeId: string): Promise<StorefrontProduct[]> {
    const productsQuery = query(
        collection(firestore, `stores/${storeId}/products`),
        orderBy('name')
    );
    const productsSnap = await getDocs(productsQuery);
    return productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as StorefrontProduct));
}


export default async function StorefrontPage({ params }: { params: { storeId: string } }) {
  const storeId = params.storeId;
  if (!storeId) {
    notFound();
  }

  const isDemoMode = storeId === 'demo';

  // Fetch data on the server
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
    })) as StorefrontProduct[];
  } else {
    try {
        [storeData, products] = await Promise.all([
            getStoreData(storeId),
            getProducts(storeId)
        ]);
    } catch (error) {
        console.error("Failed to fetch storefront data:", error);
        // Render a fallback or error state if necessary
    }
  }

  // Hero section data
  const heroTitle = storeData?.heroTitle || 'Elegance Redefined';
  const heroSubtitle = storeData?.heroSubtitle || 'Discover curated collections of timeless luxury.';
  const heroImageUrl = storeData?.heroImageUrl || PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl;
  
  return (
    <div>
      {/* Hero Section - remains a Server Component, but interactivity is moved to its own Client Component */}
      <HeroSection
        imageUrl={heroImageUrl}
        title={heroTitle}
        subtitle={heroSubtitle}
      />

      {/* Product Grid - data is fetched on server and passed to the client component */}
      <section id="products" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center font-headline mb-10">Featured Products</h2>
        <ProductGrid products={products || []} storeId={storeId} />
      </section>
    </div>
  );
}
