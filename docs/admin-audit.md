# SOMA Executive Administrator: Role & Work Audit

This document serves as the official operational guide for the **Administrator** role within the SOMA ecosystem.

## 1. Executive Role & Access
Admins are the "Master Architects" of SOMA.
- **Identity**: Identified by `userRole: 'ADMIN'` in Firestore.
- **Permissions**: Full CRUD access across all platform collections.
- **Bypass Logic**: Admins bypass the `hasAccess` (payment) requirement and do not require a provisioned store instance to access their dashboard.

## 2. Core Operational Modules

### A. Concierge Management (`/admin/concierge`)
- **Workflow**: Monitor the `concierge_tickets` collection.
- **Task**: Respond to strategic inquiries from elite Brand Partners.
- **Automation**: Resolving a ticket triggers the `sendConciergeResponseEmail` Genkit flow.

### B. Verification Queue (`/admin/verification-queue`)
- **Workflow**: Audit new `SELLER` and `BRAND` applications.
- **Verification**: Inspect Government ID URLs and verified warehouse addresses.
- **Governance**: Approve for immediate launch or "Reject with Feedback" to request changes.

### C. Master Catalog Curation (`/admin/curation`)
- **Workflow**: Review products in the `Pending_Master_Catalog`.
- **Standards**: Verify 1:1 luxury photography and ensure a minimum 15% profit margin for Moguls.
- **Activation**: Synchronizing approved items makes them live globally.

### D. Treasury & Financials (`/admin/treasury`)
- **Workflow**: Process `withdrawal_requests` marked as `pending`.
- **Tasks**: Verify bank details, initiate transfers, and mark as "Paid."
- **Ledger Audit**: Monitor the platform's 3% commission revenue via `revenue_logs`.

### E. Referral Audit & Settlement (`/admin/referrals`)
- **Risk Analysis**: Identity risk flagging for self-referral detection.
- **Settlement**: Manually releasing rewards from `pending_maturity` status after 14 days.
- **Intelligence**: Tracking Viral Coefficient (K) and CPA (Cost Per Acquisition).

### F. User & Order Governance
- **User Management (`/admin/users`)**: Identity control, role adjustments, and account suspension.
- **Global Orders (`/admin/orders`)**: Real-time monitoring of all platform transactions.
- **Catalog Editor (`/admin/catalog`)**: Direct control over the live Master Catalog inventory.

## 3. Guiding Principles
- **Integrity First**: Admins are the final line of defense for the "Authenticity or Death" policy.
- **Strategic Growth**: Using the Growth Intelligence Hub to optimize acquisition efficiency.
- **Elite Experience**: Ensuring partners and Moguls receive high-fidelity support through the Concierge.
