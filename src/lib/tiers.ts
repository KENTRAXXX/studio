/**
 * @fileOverview Trade Wyse Strategic Tier Registry
 * Single Source of Truth for platform economics, feature entitlements, and routing.
 */

export type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN' | 'AMBASSADOR';

export interface TierConfig {
    id: PlanTier;
    label: string;
    portal: 'dashboard' | 'backstage' | 'admin' | 'ambassador';
    commissionRate: number; // The percentage Trade Wyse takes (0.03 = 3%)
    entitlements: string[];
    aiCreditsMonthly: number;
    businessSurcharge: {
        monthly: number;
        yearly: number;
    };
    teamSeats: {
        individual: number;
        business: number;
    };
    supportLevel: 'standard' | 'priority' | 'concierge';
    price: {
        monthly: number;
        yearly: number;
        free?: boolean;
    };
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
        commissionRate: 0,
        entitlements: ['private_inventory', 'domain_management', 'basic_analytics', 'concierge'],
        aiCreditsMonthly: 20,
        businessSurcharge: { monthly: 42.99, yearly: 429.90 },
        teamSeats: { individual: 1, business: 5 },
        supportLevel: 'standard',
        price: { monthly: 19.99, yearly: 199.90 },
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
        commissionRate: 0.03,
        entitlements: ['dropshipping', 'academy', 'advanced_analytics', 'concierge'],
        aiCreditsMonthly: 0,
        businessSurcharge: { monthly: 59.99, yearly: 599.90 },
        teamSeats: { individual: 1, business: 5 },
        supportLevel: 'standard',
        price: { monthly: 29.00, yearly: 290.00 },
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
        entitlements: ['dropshipping', 'private_inventory', 'academy', 'executive_analytics', 'concierge'],
        aiCreditsMonthly: 30,
        businessSurcharge: { monthly: 69.99, yearly: 699.90 },
        teamSeats: { individual: 1, business: 5 },
        supportLevel: 'priority',
        price: { monthly: 33.33, yearly: 333.30 },
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
        commissionRate: 0.09,
        entitlements: ['supplier_portal', 'inventory_sync', 'concierge'],
        aiCreditsMonthly: 0,
        businessSurcharge: { monthly: 0, yearly: 0 },
        teamSeats: { individual: 1, business: 1 },
        supportLevel: 'standard',
        price: { monthly: 0, yearly: 0, free: true },
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
        aiCreditsMonthly: 50,
        businessSurcharge: { monthly: 49.99, yearly: 499.90 },
        teamSeats: { individual: 1, business: 5 },
        supportLevel: 'priority',
        price: { monthly: 21.00, yearly: 210.00 },
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
        aiCreditsMonthly: 999999, // Effectively unlimited
        businessSurcharge: { monthly: 0, yearly: 0 },
        teamSeats: { individual: 999, business: 999 },
        supportLevel: 'concierge',
        price: { monthly: 0, yearly: 0, free: true },
        features: {
            dropshipping: true,
            privateInventory: true,
            customDomains: true,
            analytics: 'executive',
            academyAccess: true
        }
    },
    AMBASSADOR: {
        id: 'AMBASSADOR',
        label: 'Ambassador',
        portal: 'ambassador',
        commissionRate: 0,
        entitlements: ['marketing_kit', 'flat_rewards', 'referral_dashboard', 'concierge'],
        aiCreditsMonthly: 0,
        businessSurcharge: { monthly: 0, yearly: 0 },
        teamSeats: { individual: 1, business: 1 },
        supportLevel: 'standard',
        price: { monthly: 0, yearly: 0, free: true },
        features: {
            dropshipping: false,
            privateInventory: false,
            customDomains: false,
            analytics: 'basic',
            academyAccess: false
        }
    }
};

export function getTier(id?: string): TierConfig {
    return TIER_REGISTRY[id as PlanTier] || TIER_REGISTRY.SCALER;
}
