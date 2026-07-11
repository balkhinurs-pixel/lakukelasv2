'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan Modul Ajar Terintegrasi.
 * Versi 1.x dengan Agent Awareness.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';
import { LAKUKELAS_SYSTEM_PROMPT } from '../system-prompt';

const ModulAjarInputSchema = z.object({
  kurikulumPath: z.enum(['dikbud', 'kemenag']),
  jenjang: z.string(),
  kelas: z.string(),
  subject: z.string(),
  topic: z.string(),
  alokasiWaktu: z.string(),
  jumlahPertemuan: z.number().default(1),
  profilPancasila: z.array(z.string()),
  profilRahmatanLilAlamin: z.array(z.string()).optional(),
  modelPembelajaran: z.string(),
  saranaPrasarana: z.string().optional(),
  targetSiswa: z.string().optional(),
  atpContent: z.string().optional(),
  pedagogicalPractice: z.string().optional(),
  deepLearningType: z.string().optional(),
});

export type ModulAjarInput = z.infer<typeof ModulAjarInputSchema>;

const ModulAjarOutputSchema = z.object({
  title: z.string(),
  content: z.string().describe('Markdown dengan Tabel untuk Identitas & Kegiatan'),
  lkpdPrompt: z.string(),
});

export type ModulAjarOutput = z.infer<typeof ModulAjarOutputSchema>;

export async function generateModulAjar(input: ModulAjarInput): Promise<ModulAjarOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, full_name, school_name, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) throw new Error("API Key belum diatur.");

  const selectedModel = profile.ai_model || 'gemini-1.5-flash';
  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
  });

  const response = await ai.generate({
    model: googleAI.model(selectedModel),
    system: LAKUKELAS_SYSTEM_PROMPT,
    output: { schema: ModulAjarOutputSchema },
    prompt: `Tugas: Susun Modul Ajar profesional untuk ${profile.school_name || 'Sekolah'} oleh ${profile.full_name}.
    Konteks: ${input.subject} Kelas ${input.kelas}, Materi: ${input.topic}.
    Kurikulum: ${input.kurikulumPath === 'kemenag' ? 'Kemenag (KBC)' : 'Kemdikbud'}.
    Metode: ${input.deepLearningType} dengan praktik ${input.pedagogicalPractice}.
    ${input.atpContent ? `Referensi ATP: ${input.atpContent}` : ''}
    
    Wajib menggunakan tabel Markdown untuk identitas dan langkah pembelajaran per pertemuan.`
  });

  const result = response.output;
  if (!result) throw new Error("Gagal merumuskan modul.");
  return result;
}
