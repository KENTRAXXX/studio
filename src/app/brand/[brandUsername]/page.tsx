import { redirect } from 'next/navigation';

/**
 * @fileOverview Legacy Brand Route Redirect
 * All branded traffic is now handled by the Multi-Tenancy Middleware via /[domain].
 */
export default async function LegacyBrandPage({ params }: { params: Promise<{ brandUsername: string }> }) {
    const { brandUsername } = await params;
    // Attempt to redirect to the new subdomain-style URL for continuity
    redirect(`https://${brandUsername}.somatoday.com`);
}
