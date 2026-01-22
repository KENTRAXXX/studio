# The Economic Engine of SOMA

This document provides a detailed breakdown of the platform's economic structure, outlining every revenue stream and the flow of funds for each user tier.

## Core Principle: Centralized Financial Processing

To ensure security, automated payment splitting, and a consistent user experience, **SOMA acts as the Merchant of Record for all transactions** that occur on any storefront powered by the platform. Customer payments are processed centrally through SOMA's integrated Paystack gateway, and funds are then distributed according to the user's tier and the type of product sold.

---

## 1. Mogul, Scaler, & Enterprise Tiers (Dropshipping Model)

This is the primary transaction model for users who are dropshipping products from the SOMA Master Catalog.

**Revenue Stream:** SOMA earns a **3% commission** calculated on the **wholesale price** of every dropshipped item sold.

### Flow of Funds:

1.  A customer purchases a product from a Mogul's storefront at the `retailPrice` set by the Mogul.
2.  The SOMA platform securely processes the full payment via Paystack.
3.  The platform automatically initiates a three-way split of the funds:
    *   **The Product Supplier (Seller/Brand):** Receives the `wholesalePrice` of the item, minus the platform's commission (see Section 2). This is logged to the supplier's `payouts_pending` ledger.
    *   **The Store Owner (Mogul):** Receives the profit, which is (`retailPrice` - `wholesalePrice`). This is logged to the Mogul's `payouts_pending` ledger.
    *   **SOMA Platform:** Earns a **3% commission** on the `wholesalePrice`. This is logged to the `revenue_logs` collection.

#### Example:

*   A **Seller** lists a watch with a `wholesalePrice` of **$250**.
*   A **Mogul** syncs this watch and sets their `retailPrice` to **$650**.
*   A customer buys the watch.

**Resulting Split:**
*   **Mogul's Profit:** $650 - $250 = **$400**
*   **SOMA's Revenue:** $250 * 3% = **$7.50**
*   **Seller's Payout:** $250 - $7.50 = **$242.50**

---

## 2. Seller & Brand Tiers (Supplier Model)

This model governs users who supply products to the Master Catalog for Moguls to dropship.

### A. Free "Seller" Tier

*   **Revenue Stream:** SOMA earns a **9% commission** on the wholesale price of every item sold.
*   **Subscription Fee:** $0. This low barrier to entry encourages a wide variety of suppliers to join the platform.

### B. Paid "Brand" Tier

*   **Revenue Stream 1 (SaaS):** A recurring subscription fee (**$21/month** or **$210/year**).
*   **Revenue Stream 2 (Commission):** A reduced **3% commission** on the wholesale price of every item sold. This is designed for established brands with higher sales volume.

---

## 3. Merchant Tier (Private Inventory Model)

This model is for users who sell their own products and manage their own inventory and fulfillment.

*   **Revenue Stream (SaaS):** SOMA's sole income from this tier is the recurring subscription fee (**$19.99/month** or **$199/year**).
*   **No Commission:** SOMA takes **$0 commission** on the sale of a Merchant's private inventory. The full sale amount (minus the standard Paystack payment processing fee) is credited to the Merchant's `payouts_pending` ledger.

In this model, SOMA's value proposition is providing the entire e-commerce infrastructure (storefront, hosting, dashboard, secure checkout) as a Software-as-a-Service product.

---

## 4. Payouts & Fund Management

*   **SOMA Wallet:** All earnings for all user types (Mogul profits, Seller payouts, Merchant sales) are first recorded in the `payouts_pending` Firestore collection. This acts as a secure, internal ledger.
*   **Withdrawal Requests:** To receive their money, users must submit a "Withdrawal Request" from their SOMA Wallet, providing their bank details.
*   **Platform Fee:** SOMA applies a **3% fee** to all withdrawals to cover administrative and processing costs.
*   **Manual Payouts:** A platform Administrator uses the `/admin/treasury` dashboard to review pending requests. The admin then manually processes the payment from SOMA's business bank account to the user's bank account and marks the request as "completed" in the system. This final step moves the records from `payouts_pending` to `payouts_completed`.
