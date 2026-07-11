import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Inisialisasi Global Genkit 1.x
 * Digunakan sebagai template dasar untuk seluruh Flows di LakuKelas.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-1.5-flash'), // Default model untuk efisiensi
});

export { z } from 'genkit';
