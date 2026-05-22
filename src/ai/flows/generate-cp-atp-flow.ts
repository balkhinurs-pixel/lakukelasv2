'use server';
/**
 * @fileOverview Flow Genkit untuk perumusan CP & ATP Kurikulum Merdeka.
 * Membantu guru memecah Capaian Pembelajaran menjadi Alur Tujuan Pembelajaran yang sistematis.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const CpAtpInputSchema = z.object({
  subject: z.string().describe('Mata pelajaran'),
  phase: z.string().describe('Fase pembelajaran (A-F)'),
  classLevel: z.string().describe('Tingkat kelas'),
  scope: z.string().describe('Ruang lingkup materi atau elemen CP'),
  additionalInfo: z.string().optional().describe('Instruksi tambahan'),
});

export type CpAtpInput = z.infer<typeof CpAtpInputSchema>;

const CpAtpOutputSchema = z.object({
  title: z.string().describe('Judul dokumen pemetaan'),
  content: z.string().describe('Konten lengkap CP & ATP dalam format Markdown'),
});

export type CpAtpOutput = z.infer<typeof CpAtpOutputSchema>;

export async function generateCpAtp(input: CpAtpInput): Promise<CpAtpOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi login berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini belum diatur di Pengaturan > Integrasi.");
  }

  const selectedModel = profile.ai_model || 'gemini-2.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model(selectedModel),
  });

  const response = await ai.generate({
    output: { schema: CpAtpOutputSchema },
    prompt: `Anda adalah pakar kurikulum nasional Indonesia yang sangat ahli dalam implementasi Kurikulum Merdeka.
Tugas Anda adalah membantu guru menyusun "Pemetaan Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP)" yang logis, terukur, dan sistematis.

INPUT KURIKULUM:
- Mata Pelajaran: ${input.subject}
- Fase: ${input.phase}
- Kelas: ${input.classLevel}
- Fokus Materi/Elemen: ${input.scope}
- Instruksi Tambahan: ${input.additionalInfo || 'Tidak ada'}

ATURAN PENULISAN (PENTING):
1. GUNAKAN HURUF NORMAL (Sentence case). JANGAN gunakan huruf kapital semua untuk isi teks. Huruf kapital hanya untuk judul atau awal kalimat.
2. STRUKTUR DOKUMEN (WAJIB ADA):
   - CAPAIAN PEMBELAJARAN (CP): Tuliskan narasi CP sesuai elemen.
   - TUJUAN PEMBELAJARAN (TP): Pecah menjadi beberapa TP yang konkret.
   - ALUR TUJUAN PEMBELAJARAN (ATP): WAJIB menggunakan format TABEL Markdown dengan kolom: No, TP, Lingkup Materi, Dimensi P3, Alokasi Waktu, dan Strategi Pembelajaran.
3. KATA KUNCI & MATERI INTI: Daftar konsep utama.
4. PROFIL PELAJAR PANCASILA: Tentukan dimensi yang relevan.

Gunakan bahasa yang sangat profesional namun praktis. Pastikan tabel Markdown dibuat dengan benar menggunakan pemisah pipe (|) dan garis header (---).`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan pemetaan kurikulum. Periksa kuota API Key Anda.");
  return result;
}
