import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'tradewysetoday.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/admin/',
          '/backstage/',
          '/dashboard/',
          '/login',
          '/signup',
          '/payout-confirmed',
        ],
      },
    ],
    sitemap: `https://${rootDomain}/sitemap.xml`,
  };
}
