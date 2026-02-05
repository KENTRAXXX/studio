# SOMA Executive Platform

The Ultimate Design System for Luxury E-commerce.

## Deployment Environment Variables

Configure these variables in your hosting provider (e.g., Cloudflare Pages) to ensure full system functionality.

### 1. Media & Assets (Cloudinary)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=SomaDS`

### 2. Infrastructure
- `NEXT_PUBLIC_ROOT_DOMAIN=your-app.pages.dev`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key`

### 3. Payments (Paystack)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`
- `PAYSTACK_SECRET_KEY=sk_test_...`

### 4. Intelligence & Communication
- `GOOGLE_GENAI_API_KEY=your_gemini_key`
- `RESEND_API_KEY=re_...`

### 5. Paystack Plan Codes
- `NEXT_PUBLIC_SCALER_MONTHLY_PLAN_CODE=PLN_...`
- `NEXT_PUBLIC_SCALER_YEARLY_PLAN_CODE=PLN_...`
- `NEXT_PUBLIC_MERCHANT_MONTHLY_PLAN_CODE=PLN_...`
- `NEXT_PUBLIC_MERCHANT_YEARLY_PLAN_CODE=PLN_...`
- `NEXT_PUBLIC_ENTERPRISE_MONTHLY_PLAN_CODE=PLN_...`
- `NEXT_PUBLIC_ENTERPRISE_YEARLY_PLAN_CODE=PLN_...`
- `NEXT_PUBLIC_BRAND_MONTHLY_PLAN_CODE=PLN_...`
- `NEXT_PUBLIC_BRAND_YEARLY_PLAN_CODE=PLN_...`

## Note on Multi-Tenancy
For custom domain support on Cloudflare, ensure you create a **KV Namespace** named `DOMAIN_MAP` and bind it to your project. This is used by the middleware to resolve boutique hostnames to store IDs.
