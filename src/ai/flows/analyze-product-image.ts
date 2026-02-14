'use server';

/**
 * @fileOverview AI flow for analyzing product images with integrated market research.
 * Refactored for high stability in serverless environments by removing transactions.
 * Features atomic credit governance using Firestore field increments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

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
  userId: z.string().describe("The UID of the user requesting the analysis for credit verification."),
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
 * Uses getDoc + updateDoc instead of runTransaction for high-stability server action execution.
 */
export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    const firestore = getDb();
    const userRef = doc(firestore, 'users', input.userId);

    // 1. CREDIT GOVERNANCE (Stability Refactor)
    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User identity not found.");
        
        const userData = userSnap.data();
        
        // Admins bypass credits
        if (userData.userRole !== 'ADMIN') {
            const currentCredits = userData.aiCredits ?? 0;
            if (currentCredits < 1) {
                throw new Error("INSUFFICIENT_CREDITS");
            }
            // Atomic decrement
            await updateDoc(userRef, { aiCredits: increment(-1) });
        }
    } catch (error: any) {
        if (error.message === 'INSUFFICIENT_CREDITS') {
            throw new Error("Your strategic AI allocation has been exhausted.");
        }
        console.error("Credit check failure:", error);
        throw new Error("Identity verification failed. AI engine offline.");
    }

    // 2. AI INTELLIGENCE PHASE
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) {
            return generateFallbackMetadata();
        }

        const isEnterprise = input.tier === 'ENTERPRISE';

        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            tools: [getMarketInsights],
            output: { schema: AnalyzeProductImageOutputSchema },
            prompt: [
                { text: `You are an elite luxury commerce curator. 

INSTRUCTION SET:
1. PERFORM A VISUAL-FIRST ANALYSIS: Describe materials, textures, colors, and technical specs based ONLY on the photo.
2. MARKET RESEARCH: Use 'getMarketInsights' to find this specific item on the web.
3. ENRICHMENT: Use research data to fill in gaps.
4. BRANDING: Mention 'SOMA standard of excellence' ONLY in the final concluding sentence.

${isEnterprise ? '6. DEEP MARKET SCHEMING (ENTERPRISE UNLOCKED): Provide strategic positioning advice.' : ''}

Available categories: ${AVAILABLE_CATEGORIES.join(', ')}` },
                { media: { url: input.imageUrl } }
            ]
        });

        if (!output) throw new Error("AI returned an empty response.");

        return output;
    } catch (error) {
        console.error("AI Generation Error:", error);
        return generateFallbackMetadata();
    }
}
