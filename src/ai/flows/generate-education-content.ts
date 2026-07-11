'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan konten pendidikan (RPP & Soal).
 * Dimodernisasi ke Genkit 1.x dengan Agent Awareness LakuKelas.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';
import { LAKUKELAS_SYSTEM_PROMPT } from '../system-prompt';

const EducationContentInputSchema = z.object({
  type: z.enum(['rpp', 'soal']).describe('Jenis dokumen yang ingin dibuat'),
  subject: z.string().describe('Mata pelajaran'),
  classLevel: z.string().describe('Tingkat kelas'),
  topic: z.string().describe('Topik atau materi pokok'),
  additionalInfo: z.string().optional().describe('Instruksi tambahan khusus'),
  count: z.number().optional().describe('Jumlah soal (jika tipe adalah soal)'),
});

export type EducationContentInput = z.infer<typeof EducationContentInputSchema>;

const EducationContentOutputSchema = z.object({
  title: z.string().describe('Judul dokumen yang dihasilkan'),
  content: z.string().describe('Konten dokumen dalam format Markdown'),
});

export type EducationContentOutput = z.infer<typeof EducationContentOutputSchema>;

export async function generateEducationContent(input: EducationContentInput): Promise<EducationContentOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key belum diatur di Pengaturan.");
  }

  const selectedModel = profile.ai_model || 'gemini-1.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
  });

  const response = await ai.generate({
    model: googleAI.model(selectedModel),
    system: LAKUKELAS_SYSTEM_PROMPT,
    output: { schema: EducationContentOutputSchema },
    prompt: `Tugas: Buat dokumen ${input.type === 'rpp' ? 'Modul Ajar / RPP' : 'Bank Soal'} profesional.
Detail Input:
- Mapel: ${input.subject}
- Kelas: ${input.classLevel}
- Topik: ${input.topic}
- Instruksi Tambahan: ${input.additionalInfo || 'Tidak ada'}
${input.type === 'soal' ? `- Jumlah: ${input.count || 10} soal` : ''}

Pastikan struktur dokumen lengkap, menggunakan tabel Markdown untuk identitas, dan rumus menggunakan LaTeX.`
  });

  const result = response.output;
  if (!result) throw new Error("AI gagal merespon. Periksa kuota API Key Anda.");
  return result;
}
