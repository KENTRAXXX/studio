'use server';

/**
 * @fileOverview Provides accessibility suggestions for UI components.
 * Upgraded to Gemini 2.5 Flash.
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

export async function getAccessibilitySuggestions(input: AccessibilitySuggestionsInput): Promise<AccessibilitySuggestionsOutput> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) {
            return generateFallbackSuggestions();
        }

        const { output } = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            output: { schema: AccessibilitySuggestionsOutputSchema },
            prompt: `Review the following UI code for accessibility improvements and provide a concise list of suggestions to meet SOMA luxury standards. Focus on semantic HTML, ARIA attributes, and keyboard navigation integrity:\n\n${input.componentCode}`,
        });

        if (!output) {
            return generateFallbackSuggestions();
        }

        return {
            suggestions: output.suggestions
        };
    } catch (error) {
        console.error("AI A11y Error (Handled):", error);
        return generateFallbackSuggestions();
    }
}
