'use server';

/**
 * @fileOverview AI flow for analyzing product images. 
 * Refactored for extreme resilience on Cloudflare using direct generation and stable model identifiers.
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

/**
 * Analyzes a product image to generate luxury metadata.
 * Uses direct generation for maximum stability on Cloudflare.
 */
export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) {
            console.warn("Gemini API key missing or placeholder. Using fallback.");
            return generateFallbackMetadata();
        }

        // Using gemini-1.5-flash for maximum performance and stability on serverless
        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            output: { schema: AnalyzeProductImageOutputSchema },
            prompt: [
                { text: `You are an elite luxury commerce curator. Analyze this product image and generate a sophisticated name, evocative description, categories from: ${AVAILABLE_CATEGORIES.join(', ')}, and SEO tags.` },
                { media: { url: input.imageUrl } }
            ]
        });

        if (!output) {
            throw new Error("Empty output from AI model.");
        }

        return {
            suggestedName: output.suggestedName || "New Discovery",
            description: output.description || "Luxury standard asset.",
            suggestedCategories: output.suggestedCategories || ["Accessories"],
            suggestedTags: output.suggestedTags || ["Luxury"]
        };
    } catch (error) {
        console.error("AI Analysis Error (Cloudflare Resilience):", error);
        // Ensure we ALWAYS return a valid object to avoid Server Action serialization errors
        return generateFallbackMetadata();
    }
}
