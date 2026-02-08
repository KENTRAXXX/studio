import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Optimized Genkit initialization for Serverless/Edge environments.
 * Disables telemetry and logging to minimize gRPC/Node.js dependencies.
 */
export const ai = genkit({
  plugins: [googleAI()],
  telemetry: {
    disabled: true,
  },
});
