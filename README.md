
# SOMA Executive Platform

The Ultimate Design System for Luxury E-commerce.

## 🚀 Deployment Checklist

Follow these steps to deploy the SOMA platform to the Cloudflare global network.

### 1. Cloudflare Pages Setup
In your Cloudflare Pages dashboard, ensure the following settings:
- **Framework Preset**: `Next.js (App Router)`
- **Build Command**: `npm run build`
- **Build Output Directory**: `.next`
- **Node.js Version**: 18 or higher

### 2. Required Environment Variables
Copy and paste these into **Cloudflare Pages > Settings > Environment Variables**. 
*Note: Firebase credentials are already in the code and do not need to be added here.*

**Public / Client-Side**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`=your_cloud_name
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`=SomaDS
- `NEXT_PUBLIC_ROOT_DOMAIN`=your-app.pages.dev
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`=your_google_maps_key
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`=pk_test_...
- `NEXT_PUBLIC_ADMIN_GATE_CODE`=SOMA-SECRET-CODE-2024 (Required for Admin Signups)

**Private / Server-Side (Secrets)**
- `GOOGLE_GENAI_API_KEY`=your_gemini_key (Powers the AI Curation Intelligence)
- `PAYSTACK_SECRET_KEY`=sk_test_...
- `RESEND_API_KEY`=re_...

**Paystack Plan Codes**
- `NEXT_PUBLIC_SCALER_MONTHLY_PLAN_CODE`=PLN_...
- `NEXT_PUBLIC_SCALER_YEARLY_PLAN_CODE`=PLN_...
- `NEXT_PUBLIC_MERCHANT_MONTHLY_PLAN_CODE`=PLN_...
- `NEXT_PUBLIC_MERCHANT_YEARLY_PLAN_CODE`=PLN_...
- `NEXT_PUBLIC_ENTERPRISE_MONTHLY_PLAN_CODE`=PLN_...
- `NEXT_PUBLIC_ENTERPRISE_YEARLY_PLAN_CODE`=PLN_...
- `NEXT_PUBLIC_BRAND_MONTHLY_PLAN_CODE`=PLN_...
- `NEXT_PUBLIC_BRAND_YEARLY_PLAN_CODE`=PLN_...

### 3. Multi-Tenancy (KV Store)
For custom domain support, create a **KV Namespace** named `KV_BINDING` in your Cloudflare dashboard and bind it to your Pages project. This allows the middleware to resolve custom boutique domains to store IDs in real-time.

### 4. Deployment
For dynamic Next.js features to work on Cloudflare, it is recommended to use the Git integration rather than manual CLI uploads of the `.next` folder.

## Platform Integrity
- **Authenticity or Death**: Global policy for all suppliers.
- **SOMA Shield**: Centralized financial processing via Paystack.
- **Executive Curation**: AI-powered metadata and multi-asset visualization.
