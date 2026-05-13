import { MetadataRoute } from 'next';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Server-side initialization to allow sitemap to fetch data
const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'tradewysetoday.com';
  const baseUrl = `https://${rootDomain}`;

  // 1. Core Platform Routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
        url: `${baseUrl}/legal/terms`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.3,
    },
  ];

  // 2. Dynamic Boutique (Tenant) Routes
  try {
    const db = getDb();
    const storesRef = collection(db, 'stores');
    const snap = await getDocs(storesRef);
    
    const boutiqueRoutes = snap.docs.map((doc) => {
      const data = doc.data();
      const domain = data.customDomain || `${data.slug}.${rootDomain}`;
      
      return {
        url: `https://${domain}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });

    return [...staticRoutes, ...boutiqueRoutes];
  } catch (error) {
    console.error('Error generating sitemap dynamic routes:', error);
    return staticRoutes;
  }
}
