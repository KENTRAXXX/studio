'use server';

/**
 * @fileOverview AI flow for analyzing product images with integrated market research.
 * Upgraded to Gemini 2.5 Flash with strict 5-Step Curation Protocol enforcement.
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

/**
 * Tool for performing visual search and market research via SerpApi.
 */
const getMarketInsights = ai.defineTool(
  {
    name: 'getMarketInsights',
    description: 'Searches the web for the provided image to find similar products, competitor pricing, and material listings on sites like Amazon or Alibaba.',
    inputSchema: z.object({
      imageUrl: z.string().url().describe('The URL of the image to search for.'),
    }),
    outputSchema: z.object({
      foundSimilarItems: z.boolean(),
      competitorData: z.array(z.object({
          title: z.string(),
          price: z.string().optional(),
          source: z.string(),
          link: z.string(),
      })),
      marketSummary: z.string().describe('Summary of typical materials and pricing for this item type.'),
    }),
  },
  async (input) => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_')) {
        return {
            foundSimilarItems: false,
            competitorData: [],
            marketSummary: "Market research skipped: SERPAPI_API_KEY not configured.",
        };
    }

    try {
        const searchUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(input.imageUrl)}&api_key=${apiKey}`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        const visualMatches = data.visual_matches || [];
        const competitorData = visualMatches.slice(0, 5).map((match: any) => ({
            title: match.title,
            price: match.price?.extracted_value ? `$${match.price.extracted_value}` : 'Price hidden',
            source: match.source,
            link: match.link,
        }));

        return {
            foundSimilarItems: competitorData.length > 0,
            competitorData,
            marketSummary: competitorData.length > 0 
                ? `Found similar items across ${competitorData.length} platforms. Typical price point around ${competitorData[0].price}.`
                : "No exact visual matches found in high-fidelity indices.",
        };
    } catch (error) {
        console.error("SerpApi Error:", error);
        return {
            foundSimilarItems: false,
            competitorData: [],
            marketSummary: "Error during live market research phase.",
        };
    }
  }
);

const AnalyzeProductImageInputSchema = z.object({
  imageUrl: z.string().url().describe("The public URL of the product image to analyze."),
  userId: z.string().describe("The UID of the user requesting the analysis."),
  tier: z.string().optional().describe("The user's plan tier."),
});
export type AnalyzeProductImageInput = z.infer<typeof AnalyzeProductImageInputSchema>;

const AnalyzeProductImageOutputSchema = z.object({
  observedFeatures: z.object({
    materials: z.array(z.string()).describe('Specific materials identified.'),
    textures: z.array(z.string()).describe('Observable textures.'),
    colors: z.array(z.string()).describe('Dominant and accent colors.'),
    technicalSpecs: z.array(z.string()).describe('Technical details visible.'),
  }),
  marketResearch: z.object({
    averagePriceRange: z.string().describe('The identified price range.'),
    competitorMaterials: z.array(z.string()).describe('Materials listed for similar items.'),
    marketKeywords: z.array(z.string()).describe('High-volume keywords.'),
  }).optional(),
  suggestedName: z.string().describe('A sophisticated name for the product.'),
  description: z.string().describe('An evocative, luxury-standard product description.'),
  suggestedCategories: z.array(z.string()).describe('The most relevant categories.'),
  suggestedTags: z.array(z.string()).describe('A list of SEO tags.'),
  enterpriseDeepSchemes: z.string().optional().describe('Strategic market positioning advice.'),
});
export type AnalyzeProductImageOutput = z.infer<typeof AnalyzeProductImageOutputSchema>;

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
    suggestedTags: ["Luxury", "Curated", "New Arrival"],
});

/**
 * Analyzes a product image to generate luxury metadata.
 */
export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    const serpKey = process.env.SERPAPI_API_KEY;
    console.log(`[DEBUG] SERPAPI_API_KEY status: ${serpKey ? `****${serpKey.slice(-4)}` : 'MISSING'}`);

    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`[DEBUG] GEMINI_API_KEY status: ${apiKey ? `****${apiKey.slice(-4)}` : 'MISSING'}`);

    if (!apiKey || apiKey.includes('YOUR_')) {
        console.error("AI Configuration Error: GEMINI_API_KEY is missing.");
        throw new Error("AI Configuration Error: Missing GEMINI_API_KEY. Please configure your environment secrets.");
    }

    try {
        const isEnterprise = input.tier === 'ENTERPRISE';

        const { output } = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            tools: [getMarketInsights],
            output: { schema: AnalyzeProductImageOutputSchema },
            prompt: [
                { text: `You are an elite luxury commerce curator. 

MANDATORY 5-STEP CURATION PROTOCOL:
1. PERFORM A VISUAL-FIRST ANALYSIS: Deeply analyze the provided image to identify specific materials (silk, titanium, mahogany, etc.), textures, and manufacturing signatures.
2. MARKET RESEARCH: Use the 'getMarketInsights' tool to search for this specific item or identical premium models across the global web index.
3. ENRICHMENT: Synthesize visual data with research findings to identify technical specifications (movement type, fabric weight, heritage origin) that the photo alone cannot confirm.
4. RESTRICT BRANDING: Ensure the 'suggestedName' and 'description' are brand-agnostic. DO NOT mention 'SOMA' or any specific marketplace branding.
5. EXECUTIVE MARKETING COPY: Compose a narrative 'description' that targets high-net-worth individuals. Use evocative, precise language that justifies a premium price point.

NEGATIVE CONSTRAINT:
NEVER assume the product is a SOMA brand item during the analysis.

${isEnterprise ? '6. DEEP MARKET SCHEMING (ENTERPRISE UNLOCKED): Provide strategic advice on where this product sits in the current luxury competitive landscape.' : ''}

Available categories for selection: ${AVAILABLE_CATEGORIES.join(', ')}` },
                { media: { url: input.imageUrl } }
            ]
        });

        if (!output) throw new Error("AI returned an empty response.");

        // Robust serialization for Server Action reliability
        return JSON.parse(JSON.stringify(output));
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        
        if (error.message.includes("Missing GEMINI_API_KEY")) {
            throw error;
        }
        
        return generateFallbackMetadata();
    }
}
