import { Metadata } from 'next';
import { getFirestore, collection, query, where, getDocs, limit, or } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import StoreLayout from '../store/[storeId]/layout';

const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

/**
 * @fileOverview Tenant Domain Layout Resolver (Server-Side for SEO)
 * Dynamically generates metadata for custom domains and specialized portals.
 */

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
    const { domain } = await params;
    const isAmbassador = domain?.toLowerCase().startsWith('ambassador');

    if (isAmbassador) {
        return {
            title: 'SOMA Ambassador Program | Performance Marketing Force',
            description: 'Earn high-yield $5.00 bounties by expanding the SOMA luxury ecosystem. Join our elite performance marketing force and track your results in real-time.',
            openGraph: {
                title: 'SOMA Ambassador Program',
                description: 'The executive choice for performance marketers.',
                images: [{ url: 'https://picsum.photos/seed/ambassador-og/1200/630' }]
            }
        };
    }

    try {
        const db = getDb();
        const storesRef = collection(db, 'stores');
        const q = query(
            storesRef, 
            or(
                where('customDomain', '==', domain.toLowerCase()),
                where('slug', '==', domain.toLowerCase()),
                where('userId', '==', domain.toLowerCase())
            ),
            limit(1)
        );
        const snap = await getDocs(q);
        const store = snap.empty ? null : snap.docs[0].data();

        if (!store) return { title: 'SOMA Boutique' };

        return {
            title: `${store.storeName} | SOMA Boutique`,
            description: store.heroSubtitle || 'Discover our curated luxury collection.',
            openGraph: {
                title: store.storeName,
                description: store.heroSubtitle,
                images: [store.heroImageUrl || ''],
            }
        };
    } catch (e) {
        return { title: 'SOMA Boutique' };
    }
}

export default async function TenantDomainLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const isAmbassador = domain?.toLowerCase().startsWith('ambassador');

  // Marketer Isolation: Skip boutique layout for the ambassador portal
  if (isAmbassador) {
    return (
      <div className="min-h-screen bg-black gold-mesh-gradient overflow-x-hidden">
        {children}
      </div>
    );
  }

  // Standard Boutique Layout for stores
  return <StoreLayout>{children}</StoreLayout>;
}
