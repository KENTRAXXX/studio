'use server';

/**
 * @fileOverview AI flow for analyzing product images. 
 * Refactored for visual-first accuracy and restricted branding protocols.
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
  observedFeatures: z.object({
    materials: z.array(z.string()).describe('Specific materials identified (e.g., "brushed titanium", "full-grain leather").'),
    textures: z.array(z.string()).describe('Observable textures (e.g., "matte", "pebbled", "high-polish").'),
    colors: z.array(z.string()).describe('Dominant and accent colors identified in the photo.'),
    technicalSpecs: z.array(z.string()).describe('Technical details visible (e.g., "GMT complication", "contrast stitching").'),
  }).describe('Raw visual data extracted directly from the image before generating copy.'),
  suggestedName: z.string().describe('A sophisticated name for the product based on visual features.'),
  description: z.string().describe('An evocative, luxury-standard product description. NO mention of branding until the final sentence.'),
  suggestedCategories: z.array(z.string()).describe('The most relevant categories.'),
  suggestedTags: z.array(z.string()).describe('A list of SEO tags.'),
});
export type AnalyzeProductImageOutput = z.infer<typeof AnalyzeProductImageOutputSchema>;

/**
 * Fallback generator for restricted or high-latency environments.
 * Maintains structural integrity with the updated schema.
 */
const generateFallbackMetadata = (): AnalyzeProductImageOutput => ({
    observedFeatures: {
        materials: ["Premium Materials"],
        textures: ["Refined"],
        colors: ["Neutral"],
        technicalSpecs: ["Luxury Craftsmanship"]
    },
    suggestedName: "New Luxury Discovery",
    description: "An exquisite addition to your collection, defined by its timeless silhouette and premium craftsmanship. This piece embodies the SOMA standard of excellence and heritage design.",
    suggestedCategories: ["Accessories"],
    suggestedTags: ["Luxury", "Curated", "New Arrival", "Exclusive", "Timeless"],
});

/**
 * Analyzes a product image to generate luxury metadata.
 * Implements a 3-step reasoning chain: Analysis -> Extraction -> Branding Restriction.
 */
export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) {
            console.warn("Gemini API key missing. Returning graceful fallback.");
            return generateFallbackMetadata();
        }

        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            output: { schema: AnalyzeProductImageOutputSchema },
            prompt: [
                { text: `You are an elite luxury commerce curator. 

INSTRUCTION SET:
1. PERFORM A VISUAL-FIRST ANALYSIS: Analyze the provided image with absolute precision. Describe materials, textures, and technical specs based ONLY on the photo.
2. RAW DATA EXTRACTION: Populate the 'observedFeatures' object first. This data must drive the subsequent copy.
3. RESTRICT BRANDING: Do NOT mention 'SOMA' or any platform branding in the 'suggestedName' or the body of the 'description'. 
4. FINAL MARKETING COPY: Mention the 'SOMA standard of excellence' or 'SOMA curated collection' ONLY in the final concluding sentence of the 'description'.

Available categories for selection: ${AVAILABLE_CATEGORIES.join(', ')}` },
                { media: { url: input.imageUrl } }
            ]
        });

        if (!output) {
            return generateFallbackMetadata();
        }

        return {
            observedFeatures: output.observedFeatures || generateFallbackMetadata().observedFeatures,
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
