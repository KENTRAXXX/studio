'use server';

/**
 * @fileOverview Provides accessibility suggestions for UI components.
 * Refactored for resilience on Cloudflare.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AccessibilitySuggestionsInputSchema = z.object({
  componentCode: z.string().describe('The code of the UI component to analyze.'),
});
export type AccessibilitySuggestionsInput = z.infer<typeof AccessibilitySuggestionsInputSchema>;

const AccessibilitySuggestionsOutputSchema = z.object({
  suggestions: z.string().describe('Suggestions for improving accessibility.'),
});
export type AccessibilitySuggestionsOutput = z.infer<typeof AccessibilitySuggestionsOutputSchema>;

const generateFallbackSuggestions = () => ({
    suggestions: "1. Ensure all interactive elements have visible focus states.\n2. Verify that your color contrast ratio meets WCAG 2.1 AA standards (4.5:1).\n3. Add descriptive 'aria-label' attributes to any icons acting as buttons.\n4. Use semantic HTML landmarks like <header>, <main>, and <footer> to aid screen readers."
});

const prompt = ai.definePrompt({
  name: 'accessibilitySuggestionsPrompt',
  input: {schema: AccessibilitySuggestionsInputSchema},
  output: {schema: AccessibilitySuggestionsOutputSchema},
  prompt: `Review the following UI code for accessibility improvements: {{componentCode}}`,
});

export async function getAccessibilitySuggestions(input: AccessibilitySuggestionsInput): Promise<AccessibilitySuggestionsOutput> {
    try {
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return generateFallbackSuggestions();
        }
        const { output } = await prompt(input);
        return output || generateFallbackSuggestions();
    } catch (error) {
        console.error("AI A11y Error:", error);
        return generateFallbackSuggestions();
    }
}
