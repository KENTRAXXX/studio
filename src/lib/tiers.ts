
/**
 * @fileOverview SOMA Strategic Tier Registry
 * Single Source of Truth for platform economics, feature entitlements, and routing.
 */

export type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN' | 'AMBASSADOR';

export interface TierConfig {
    id: PlanTier;
    label: string;
    portal: 'dashboard' | 'backstage' | 'admin' | 'ambassador';
    commissionRate: number; // The percentage SOMA takes (0.03 = 3%)
    entitlements: string[];
    features: {
        dropshipping: boolean;
        privateInventory: boolean;
        customDomains: boolean;
        analytics: 'basic' | 'advanced' | 'executive';
        academyAccess: boolean;
    };
    discountedMonthly?: number;
    discountedYearly?: number;
}

export const TIER_REGISTRY: Record<PlanTier, TierConfig> = {
    MERCHANT: {
        id: 'MERCHANT',
        label: 'Merchant',
        portal: 'dashboard',
        commissionRate: 0, 
        entitlements: ['private_inventory', 'domain_management', 'basic_analytics'],
        features: {
            dropshipping: false,
            privateInventory: true,
            customDomains: true,
            analytics: 'basic',
            academyAccess: false
        },
        discountedMonthly: 15.00,
        discountedYearly: 150.00
    },
    SCALER: {
        id: 'SCALER',
        label: 'Scaler',
        portal: 'dashboard',
        commissionRate: 0.03, 
        entitlements: ['dropshipping', 'academy', 'advanced_analytics'],
        features: {
            dropshipping: true,
            privateInventory: false,
            customDomains: true,
            analytics: 'advanced',
            academyAccess: true
        },
        discountedMonthly: 23.00,
        discountedYearly: 230.00
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
        },
        discountedMonthly: 26.66,
        discountedYearly: 266.00
    },
    SELLER: {
        id: 'SELLER',
        label: 'Seller',
        portal: 'backstage',
        commissionRate: 0.09, 
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
        commissionRate: 0.03, 
        entitlements: ['supplier_portal', 'inventory_sync', 'marketing_portal', 'concierge'],
        features: {
            dropshipping: false,
            privateInventory: false,
            customDomains: false,
            analytics: 'advanced',
            academyAccess: false
        },
        discountedMonthly: 16.80,
        discountedYearly: 168.00
    },
    AMBASSADOR: {
        id: 'AMBASSADOR',
        label: 'Ambassador',
        portal: 'ambassador',
        commissionRate: 0,
        entitlements: ['marketing_terminal', 'flat_commissions', 'referral_links'],
        features: {
            dropshipping: false,
            privateInventory: false,
            customDomains: false,
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
