
# SOMA Executive Platform

The Ultimate Design System for Luxury E-commerce.

## 🚀 Deployment Checklist

Follow these steps to deploy the SOMA platform to Cloudflare Pages.

### 1. Cloudflare Pages Setup
In your Cloudflare Pages dashboard, ensure the following settings:
- **Framework Preset**: `Next.js`
- **Build Command**: `npm run build`
- **Build Output Directory**: `.vercel/output/static`
- **Node.js Version**: 18 or higher

### 2. Required Environment Variables
Ensure these are added in **Cloudflare Pages > Settings > Environment Variables**.

**Public / Client-Side**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`=your_cloud_name
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`=SomaDS
- `NEXT_PUBLIC_ROOT_DOMAIN`=your-app.pages.dev
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`=pk_test_...
- `NEXT_PUBLIC_ADMIN_GATE_CODE`=SOMA-SECRET-CODE-2024

**Private / Server-Side (Secrets)**
- `GOOGLE_GENAI_API_KEY`=your_gemini_key
- `PAYSTACK_SECRET_KEY`=sk_test_...
- `RESEND_API_KEY`=re_...

### 3. Multi-Tenancy (KV Store)
For custom domain support, create a **KV Namespace** named `KV_BINDING` in your Cloudflare dashboard and bind it to your Pages project.

### 4. Dynamic Features
The project uses `@cloudflare/next-on-pages` to enable Next.js 15 App Router features on Cloudflare Workers. The build script automatically handles this transformation.

## Platform Integrity
- **Authenticity or Death**: Global policy for all suppliers.
- **SOMA Shield**: Centralized financial processing via Paystack.
- **Executive Curation**: AI-powered metadata and multi-asset visualization.
