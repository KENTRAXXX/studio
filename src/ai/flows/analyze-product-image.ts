'use server';

/**
 * @fileOverview AI flow for analyzing product images with integrated market research.
 * Implements a visual-first reasoning chain enriched by real-time competitor data.
 * Features a server-side Firestore Transaction for atomic credit governance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, runTransaction, increment } from 'firebase/firestore';
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
        // Use Google Lens search via SerpApi to find visual matches
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
                ? `Found similar items across ${competitorData.length} platforms. Typical price point around ${competitorData[0].price}. Listings mention premium materials.`
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
  tier: z.string().optional().describe("The user's plan tier, unlocking enhanced 'Market Scheming' if Enterprise."),
});
export type AnalyzeProductImageInput = z.infer<typeof AnalyzeProductImageInputSchema>;

const AnalyzeProductImageOutputSchema = z.object({
  observedFeatures: z.object({
    materials: z.array(z.string()).describe('Specific materials identified (e.g., "brushed titanium", "full-grain leather").'),
    textures: z.array(z.string()).describe('Observable textures (e.g., "matte", "pebbled").'),
    colors: z.array(z.string()).describe('Dominant and accent colors identified directly from pixels.'),
    technicalSpecs: z.array(z.string()).describe('Technical details visible (e.g., "GMT complication").'),
  }).describe('Raw visual data extracted directly from the image before generating copy.'),
  marketResearch: z.object({
    averagePriceRange: z.string().describe('The identified price range for similar items on the market.'),
    competitorMaterials: z.array(z.string()).describe('Materials listed for similar items on competitor sites (Amazon/Alibaba).'),
    marketKeywords: z.array(z.string()).describe('High-volume keywords used by competitors.'),
  }).optional(),
  suggestedName: z.string().describe('A sophisticated name for the product based on visual and market data.'),
  description: z.string().describe('An evocative, luxury-standard product description. Incorporate market research to fill in material gaps (e.g., "Likely 100% Egyptian Cotton"). NO mention of branding until the final sentence.'),
  suggestedCategories: z.array(z.string()).describe('The most relevant categories.'),
  suggestedTags: z.array(z.string()).describe('A list of SEO tags.'),
  enterpriseDeepSchemes: z.string().optional().describe('Strategic market positioning advice only for Enterprise users.'),
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
    suggestedTags: ["Luxury", "Curated", "New Arrival", "Exclusive", "Timeless"],
});

/**
 * Analyzes a product image to generate luxury metadata enriched by market research.
 * Implements a unified script for both new product enrichment and metadata refresh.
 * Performs a Firestore Transaction to atomically deduct credits before the AI call.
 */
export async function analyzeProductImage(input: AnalyzeProductImageInput): Promise<AnalyzeProductImageOutput> {
    const firestore = getDb();
    const userRef = doc(firestore, 'users', input.userId);

    // 1. ATOMIC CREDIT GOVERNANCE
    // We deduct the credit BEFORE the expensive AI call to prevent race conditions.
    try {
        await runTransaction(firestore, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error("User identity not found in registry.");
            
            const userData = userSnap.data();
            // Administrators enjoy an executive bypass for platform-wide curation
            if (userData.userRole === 'ADMIN') return;

            const currentCredits = userData.aiCredits ?? 0;
            if (currentCredits < 1) {
                throw new Error("INSUFFICIENT_CREDITS");
            }

            transaction.update(userRef, { aiCredits: increment(-1) });
        });
    } catch (error: any) {
        if (error.message === 'INSUFFICIENT_CREDITS') {
            throw new Error("Your strategic AI allocation has been exhausted. Please top up your credits in Store Settings.");
        }
        throw error;
    }

    // 2. AI INTELLIGENCE PHASE
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) {
            console.warn("Gemini API key missing. Returning graceful fallback.");
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
NEVER assume the product is a SOMA brand item during the analysis phase. Treat every image as a unique, unbranded mystery item that requires a 100% objective technical breakdown.

INSTRUCTION SET:
1. PERFORM A VISUAL-FIRST ANALYSIS: Analyze the provided image with absolute precision. Describe the materials, textures, colors, and technical specs based ONLY on the photo. Populate the 'observedFeatures' output field first.
2. MARKET RESEARCH: Use the 'getMarketInsights' tool to find this specific item on the web. Look for the average price, specific material compositions listed on competitor sites (Alibaba/Amazon), and high-performing keywords.
3. ENRICHMENT: Use the research data to fill in gaps that the photo cannot show (e.g., "Likely 100% Egyptian Cotton based on market listings").
4. RESTRICT BRANDING: Do NOT mention 'SOMA' or any platform branding in the 'suggestedName' or the body of the 'description'. 
5. FINAL MARKETING COPY: Compose the 'description' based strictly on the 'observedFeatures' and market data. Mention the 'SOMA standard of excellence' ONLY in the final concluding sentence of the 'description'.

${isEnterprise ? '6. DEEP MARKET SCHEMING (ENTERPRISE UNLOCKED): Provide a strategic analysis of how to position this item against the identified competitors to maximize luxury perception and margin.' : ''}

Available categories for selection: ${AVAILABLE_CATEGORIES.join(', ')}` },
                { media: { url: input.imageUrl } }
            ]
        });

        if (!output) {
            return generateFallbackMetadata();
        }

        return output;
    } catch (error) {
        console.error("AI Analysis Error (Handled):", error);
        return generateFallbackMetadata();
    }
}
