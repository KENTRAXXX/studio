'use server';

/**
 * @fileOverview AI flow for analyzing product images. 
 * Refactored for maximum stability on Cloudflare using nodejs_compat and graceful fallbacks.
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
 * Fallback generator for restricted or high-latency environments.
 * Prevents the "Unexpected response from server" error by always returning valid data.
 */
const generateFallbackMetadata = (): AnalyzeProductImageOutput => ({
    suggestedName: "New Luxury Discovery",
    description: "An exquisite addition to your collection, defined by its timeless silhouette and premium craftsmanship. This piece embodies the SOMA standard of excellence and heritage design.",
    suggestedCategories: ["Accessories"],
    suggestedTags: ["Luxury", "Curated", "New Arrival", "Exclusive", "Timeless"],
});

/**
 * Analyzes a product image to generate luxury metadata.
 * Uses direct ai.generate for stability on serverless runtimes.
 */
export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) {
            console.warn("Gemini API key missing. Returning graceful fallback.");
            return generateFallbackMetadata();
        }

        // Using gemini-1.5-flash for performance and edge stability
        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            output: { schema: AnalyzeProductImageOutputSchema },
            prompt: [
                { text: `You are an elite luxury commerce curator. Analyze this product image and generate a sophisticated name, evocative description, categories from: ${AVAILABLE_CATEGORIES.join(', ')}, and SEO tags.` },
                { media: { url: input.imageUrl } }
            ]
        });

        if (!output) {
            return generateFallbackMetadata();
        }

        return {
            suggestedName: output.suggestedName || "New Discovery",
            description: output.description || "Luxury standard asset.",
            suggestedCategories: output.suggestedCategories || ["Accessories"],
            suggestedTags: output.suggestedTags || ["Luxury"]
        };
    } catch (error) {
        console.error("AI Enrichment Error (Handled):", error);
        return generateFallbackMetadata();
    }
}
