import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization for Trade Wyse.
 * Configured for standard Node.js runtime on Vercel.
 * Telemetry is enabled by default for production observability.
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY })
  ],
});
