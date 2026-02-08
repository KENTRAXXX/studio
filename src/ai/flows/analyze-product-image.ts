'use server';

/**
 * @fileOverview AI flow for analyzing product images. 
 * Includes a resilient fallback for environments where Gemini is restricted.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AVAILABLE_CATEGORIES = [
    "Watches", "Leather Goods", "Jewelry", "Fragrance", "Apparel", 
    "Accessories", "Home Decor", "Electronics", "Fine Art",
    "Spirits & Wine", "Travel Gear", "Beauty & Skincare",
    "Wellness", "Collectibles", "Automotive", "Gourmet Food",
    "Furniture", "Digital Assets"
];

const AnalyzeProductImageInputSchema = z.object({
  imageUrl: z.string().url().describe("The public URL of the product image to analyze."),
});
export type AnalyzeProductImageInput = z.infer<typeof AnalyzeProductImageInputSchema>;

const AnalyzeProductImageOutputSchema = z.object({
  suggestedName: z.string().describe('A sophisticated name for the product.'),
  description: z.string().describe('An evocative, luxury-standard product description.'),
  suggestedCategories: z.array(z.string()).describe('The most relevant categories.'),
  suggestedTags: z.array(z.string()).describe('A list of SEO tags.'),
});
export type AnalyzeProductImageOutput = z.infer<typeof AnalyzeProductImageOutputSchema>;

/**
 * Fallback generator for restricted environments (e.g. Edge without API keys)
 */
const generateFallbackMetadata = (): AnalyzeProductImageOutput => ({
    suggestedName: "New Luxury Discovery",
    description: "An exquisite addition to your collection, defined by its timeless silhouette and premium craftsmanship. This piece embodies the SOMA standard of excellence.",
    suggestedCategories: ["Accessories"],
    suggestedTags: ["Luxury", "Curated", "New Arrival", "Exclusive", "Timeless"],
});

const prompt = ai.definePrompt({
  name: 'analyzeProductImagePrompt',
  input: { schema: AnalyzeProductImageInputSchema },
  output: { schema: AnalyzeProductImageOutputSchema },
  prompt: `You are an elite luxury commerce curator. Analyze the product in this image: {{media url=imageUrl}}
  Generate a sophisticated name, evocative description, categories from: ${AVAILABLE_CATEGORIES.join(', ')}, and SEO tags.`,
});

export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    try {
        // Only attempt AI call if API Key is detected, otherwise return fallback immediately
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            console.warn("Gemini API key missing. Using resilient fallback.");
            return generateFallbackMetadata();
        }

        const { output } = await prompt(input);
        return output || generateFallbackMetadata();
    } catch (error) {
        console.error("AI Analysis Error (Cloudflare Resilience):", error);
        return generateFallbackMetadata();
    }
}
