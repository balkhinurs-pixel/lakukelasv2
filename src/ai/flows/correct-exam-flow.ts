'use server';
/**
 * @fileOverview Flow Genkit untuk Koreksi LJK (OMR Vision) - V67.0 Optimized.
 * Meringkas instruksi teks (Prompt) untuk menghemat kuota Token (TPM) Gemini Free Tier.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const CorrectExamInputSchema = z.object({
  photoDataUri: z.string().describe("Data URI foto LJK (Base64)"),
  naskahId: z.string().describe("ID naskah sebagai referensi kunci jawaban"),
  correctAnswers: z.array(z.object({
    sort_order: z.number(),
    correct_answer: z.string(),
    question_type: z.string()
  })).describe("Daftar kunci jawaban dari database")
});

export type CorrectExamInput = z.infer<typeof CorrectExamInputSchema>;

const CorrectExamOutputSchema = z.object({
  detectedNis: z.string().describe("NIS 5 digit dari bulatan LJK"),
  studentAnswers: z.array(z.object({
    questionNum: z.number(),
    studentChoice: z.string(),
    isCorrect: z.boolean(),
    correctValue: z.string()
  })).describe("Hasil deteksi jawaban"),
  totalScore: z.number().describe("Skor 0-100"),
  analysis: z.string().describe("Catatan singkat kualitas foto")
});

export type CorrectExamOutput = z.infer<typeof CorrectExamOutputSchema>;

export async function correctExam(input: CorrectExamInput): Promise<CorrectExamOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini diperlukan.");
  }

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model('gemini-2.5-flash-image'),
  });

  const response = await ai.generate({
    output: { schema: CorrectExamOutputSchema },
    prompt: [
        { media: { url: input.photoDataUri, contentType: 'image/jpeg' } },
        { text: `Act as a high-precision OMR Scanner. 
LAYOUT:
- Use 4 black corner squares for alignment.
- NIS Column: Right side (5 columns of 0-9 bubbles).
- Answers: Sequentially numbered bubbles (A-E or B-S).

KEYS:
${input.correctAnswers.map(k => `No ${k.sort_order}: ${k.correct_answer}`).join('\n')}

TASK:
1. Extract 5-digit NIS from bubbles.
2. Detect filled bubbles for each question number.
3. Compare with KEYS and calculate score (0-100).
4. Identify multiple marks as wrong.
5. Report blur/angle issues in analysis field.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("AI failed to process image. Ensure 4 corner anchors are visible.");
  
  return result;
}
