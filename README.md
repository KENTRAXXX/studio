# SOMA Executive Platform

The Ultimate Design System for Luxury E-commerce.

## 🚀 Deployment Checklist (CRITICAL)

Follow these exact steps in your Cloudflare Pages dashboard to ensure the app functions correctly.

### 1. Build Settings
In **Settings > Build & deployments > Build settings**, click **Edit** and set:
- **Framework Preset**: `None`
- **Build Command**: `npm run pages:build`
- **Build Output Directory**: `.vercel/output/static`
- **Root Directory**: `/`

### 2. Environment Variables
Ensure these are added in **Settings > Environment Variables**.

**Public / Client-Side**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`=your_cloud_name
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`=SomaDS
- `NEXT_PUBLIC_ROOT_DOMAIN`=your-app.pages.dev
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`=pk_test_...
- `NEXT_PUBLIC_ADMIN_GATE_CODE`=SOMA-SECRET-CODE-2024

**Private / Server-Side (Secrets)**
- `GEMINI_API_KEY`=your_gemini_key
- `PAYSTACK_SECRET_KEY`=sk_test_...
- `RESEND_API_KEY`=re_...
- `SERPAPI_API_KEY`=your_serpapi_key

### 3. Compatibility Flags
In **Settings > Functions > Compatibility flags**, ensure:
- `nodejs_compat` is enabled for **both** Production and Preview.

### 4. Multi-Tenancy (KV Store)
Create a **KV Namespace** named `KV_BINDING` in your Cloudflare dashboard and bind it to your Pages project in **Settings > Functions > KV namespace bindings**.

## Platform Integrity
- **Authenticity or Death**: Global policy for all suppliers.
- **SOMA Shield**: Centralized financial processing via Paystack.
- **Executive Curation**: AI-powered metadata and multi-asset visualization.
