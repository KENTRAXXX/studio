'use server';

/**
 * @fileOverview AI flow for analyzing product images with integrated market research.
 * Refactored for high stability in serverless environments by using memory-only cache.
 * Restored original executive prompt instructions and negative constraints.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, increment, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Optimized Firestore initialization for Server Actions.
 * Uses memoryLocalCache to prevent persistence-related 500 errors in serverless runtimes.
 */
const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    try {
        return getFirestore(app);
    } catch (e) {
        return initializeFirestore(app, { localCache: memoryLocalCache() });
    }
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
 * Restored original instructions and negative constraints.
 */
export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    const firestore = getDb();
    const userRef = doc(firestore, 'users', input.userId);

    // 1. CREDIT GOVERNANCE
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
        console.error("Credit check failure details:", error);
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

NEGATIVE CONSTRAINT:
NEVER assume the product is a SOMA brand item during the analysis.

INSTRUCTION SET:
1. PERFORM A VISUAL-FIRST ANALYSIS: Analyze the provided image and extract technical data.
2. MARKET RESEARCH: Use the 'getMarketInsights' tool to find the specific item or similar models on the web.
3. ENRICHMENT: Use the research data to fill in gaps that the photo alone cannot provide (e.g. MSRP, known variants).
4. RESTRICT BRANDING: Do NOT mention 'SOMA' or any platform branding. This metadata must be brand-agnostic.
5. FINAL MARKETING COPY: Compose the 'description' based strictly on the visual and research evidence. Use evocative, luxury-standard language.

${isEnterprise ? '6. DEEP MARKET SCHEMING (ENTERPRISE UNLOCKED): Provide strategic positioning advice.' : ''}

Available categories for selection: ${AVAILABLE_CATEGORIES.join(', ')}` },
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
