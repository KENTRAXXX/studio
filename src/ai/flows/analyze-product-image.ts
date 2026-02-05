'use server';

/**
 * @fileOverview AI flow for analyzing product images to generate metadata.
 *
 * - analyzeProductImage - A function that handles the product analysis process.
 * - AnalyzeProductImageInput - The input type for the analyzeProductImage function.
 * - AnalyzeProductImageOutput - The return type for the analyzeProductImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AVAILABLE_CATEGORIES = [
    "Watches", 
    "Leather Goods", 
    "Jewelry", 
    "Fragrance", 
    "Apparel", 
    "Accessories", 
    "Home Decor", 
    "Electronics",
    "Fine Art",
    "Spirits & Wine",
    "Travel Gear",
    "Beauty & Skincare",
    "Wellness",
    "Collectibles",
    "Automotive",
    "Gourmet Food",
    "Furniture",
    "Digital Assets"
];

const AnalyzeProductImageInputSchema = z.object({
  imageUrl: z
    .string()
    .url()
    .describe("The public URL of the product image to analyze."),
});
export type AnalyzeProductImageInput = z.infer<typeof AnalyzeProductImageInputSchema>;

const AnalyzeProductImageOutputSchema = z.object({
  suggestedName: z.string().describe('A sophisticated name for the product.'),
  description: z.string().describe('An evocative, luxury-standard product description.'),
  suggestedCategories: z.array(z.string()).describe('The most relevant categories from the provided list.'),
  suggestedTags: z.array(z.string()).describe('A list of 5-8 high-conversion SEO tags.'),
});
export type AnalyzeProductImageOutput = z.infer<typeof AnalyzeProductImageOutputSchema>;

export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
  return analyzeProductImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeProductImagePrompt',
  input: { schema: AnalyzeProductImageInputSchema },
  output: { schema: AnalyzeProductImageOutputSchema },
  prompt: `You are an elite luxury commerce curator specializing in high-end global fashion, accessories, and lifestyle goods.
  
  Analyze the product in this image: {{media url=imageUrl}}
  
  Based on the visual details, generate the following metadata for a luxury marketplace catalog:
  
  1. **Suggested Name**: Create a sophisticated, unique, and evocative name for the product itself. 
     CRITICAL: Do NOT include the word "SOMA" in the product name. The name should reflect the item's design, material, or heritage (e.g., 'The Obsidian Chronograph' instead of 'SOMA Watch').
  
  2. **Description**: Write a compelling, evocative, and luxury-standard description (min 3 sentences). Highlight craftsmanship, materials, and emotional appeal. Focus on the product's story.
  
  3. **Categories**: Choose the 1-3 most appropriate categories from this list ONLY: ${AVAILABLE_CATEGORIES.join(', ')}.
  
  4. **Tags**: Generate 5-8 SEO-optimized tags that describe the style, materials, and target occasion.
  
  Ensure the tone is high-end, exclusive, and professional.`,
});

const analyzeProductImageFlow = ai.defineFlow(
  {
    name: 'analyzeProductImageFlow',
    inputSchema: AnalyzeProductImageInputSchema,
    outputSchema: AnalyzeProductImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate product metadata.");
    }
    return output;
  }
);
