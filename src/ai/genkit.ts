import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Optimized Genkit initialization for Serverless/Edge environments.
 * Disables telemetry and logging to minimize gRPC/Node.js dependencies
 * which often cause timeouts or crashes on Cloudflare.
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY })
  ],
  telemetry: {
    disabled: true,
  },
});
