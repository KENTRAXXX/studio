'use server';

/**
 * @fileOverview Provides accessibility suggestions for UI components.
 *
 * - getAccessibilitySuggestions - A function that takes component code as input and returns accessibility improvement suggestions.
 * - AccessibilitySuggestionsInput - The input type for the getAccessibilitySuggestions function.
 * - AccessibilitySuggestionsOutput - The return type for the getAccessibilitySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AccessibilitySuggestionsInputSchema = z.object({
  componentCode: z
    .string()
    .describe('The code of the UI component to analyze for accessibility.'),
});
export type AccessibilitySuggestionsInput = z.infer<
  typeof AccessibilitySuggestionsInputSchema
>;

const AccessibilitySuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'A list of suggestions for improving the accessibility of the component.'
    ),
});
export type AccessibilitySuggestionsOutput = z.infer<
  typeof AccessibilitySuggestionsOutputSchema
>;

export async function getAccessibilitySuggestions(
  input: AccessibilitySuggestionsInput
): Promise<AccessibilitySuggestionsOutput> {
  return accessibilitySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'accessibilitySuggestionsPrompt',
  input: {schema: AccessibilitySuggestionsInputSchema},
  output: {schema: AccessibilitySuggestionsOutputSchema},
  prompt: `You are an AI assistant that reviews UI component code and provides suggestions for improving its accessibility.

  Analyze the following component code and provide a list of specific, actionable suggestions to improve its accessibility. Focus on aspects like ARIA attributes, semantic HTML, color contrast, keyboard navigation, and screen reader compatibility. Be concise and prioritize the most impactful changes.

  Component Code:
  {{componentCode}}`,
});

const accessibilitySuggestionsFlow = ai.defineFlow(
  {
    name: 'accessibilitySuggestionsFlow',
    inputSchema: AccessibilitySuggestionsInputSchema,
    outputSchema: AccessibilitySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
