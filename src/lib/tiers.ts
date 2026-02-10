/**
 * @fileOverview SOMA Strategic Tier Registry
 * Single Source of Truth for platform economics, feature entitlements, and routing.
 */

export type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN';

export interface TierConfig {
    id: PlanTier;
    label: string;
    portal: 'dashboard' | 'backstage' | 'admin';
    commissionRate: number; // The percentage SOMA takes (0.03 = 3%)
    entitlements: string[];
    features: {
        dropshipping: boolean;
        privateInventory: boolean;
        customDomains: boolean;
        analytics: 'basic' | 'advanced' | 'executive';
        academyAccess: boolean;
    };
}

export const TIER_REGISTRY: Record<PlanTier, TierConfig> = {
    MERCHANT: {
        id: 'MERCHANT',
        label: 'Merchant',
        portal: 'dashboard',
        commissionRate: 0, // Merchants pay SaaS fee, 0% platform commission on private stock
        entitlements: ['private_inventory', 'domain_management', 'basic_analytics'],
        features: {
            dropshipping: false,
            privateInventory: true,
            customDomains: true,
            analytics: 'basic',
            academyAccess: false
        }
    },
    SCALER: {
        id: 'SCALER',
        label: 'Scaler',
        portal: 'dashboard',
        commissionRate: 0.03, // SOMA takes 3% on dropship wholesale
        entitlements: ['dropshipping', 'academy', 'advanced_analytics'],
        features: {
            dropshipping: true,
            privateInventory: false,
            customDomains: true,
            analytics: 'advanced',
            academyAccess: true
        }
    },
    ENTERPRISE: {
        id: 'ENTERPRISE',
        label: 'Enterprise',
        portal: 'dashboard',
        commissionRate: 0.03,
        entitlements: ['dropshipping', 'private_inventory', 'academy', 'executive_analytics'],
        features: {
            dropshipping: true,
            privateInventory: true,
            customDomains: true,
            analytics: 'executive',
            academyAccess: true
        }
    },
    SELLER: {
        id: 'SELLER',
        label: 'Seller',
        portal: 'backstage',
        commissionRate: 0.09, // Free tier sellers pay 9% commission
        entitlements: ['supplier_portal', 'inventory_sync'],
        features: {
            dropshipping: false,
            privateInventory: false,
            customDomains: false,
            analytics: 'basic',
            academyAccess: false
        }
    },
    BRAND: {
        id: 'BRAND',
        label: 'Brand',
        portal: 'backstage',
        commissionRate: 0.03, // Paid brands pay reduced 3% commission
        entitlements: ['supplier_portal', 'inventory_sync', 'marketing_portal', 'concierge'],
        features: {
            dropshipping: false,
            privateInventory: false,
            customDomains: true, // Enabled for premium Brands
            analytics: 'advanced',
            academyAccess: false
        }
    },
    ADMIN: {
        id: 'ADMIN',
        label: 'Administrator',
        portal: 'admin',
        commissionRate: 0,
        entitlements: ['all_access'],
        features: {
            dropshipping: true,
            privateInventory: true,
            customDomains: true,
            analytics: 'executive',
            academyAccess: true
        }
    }
};

export function getTier(id?: string): TierConfig {
    return TIER_REGISTRY[id as PlanTier] || TIER_REGISTRY.SCALER;
}
