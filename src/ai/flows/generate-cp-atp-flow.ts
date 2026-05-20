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

STRUKTUR DOKUMEN (WAJIB ADA):
1. CAPAIAN PEMBELAJARAN (CP): Tuliskan narasi CP sesuai elemen yang dipilih berdasarkan regulasi terbaru.
2. TUJUAN PEMBELAJARAN (TP): Pecah CP tersebut menjadi beberapa Tujuan Pembelajaran yang konkret (menggunakan kata kerja operasional).
3. ALUR TUJUAN PEMBELAJARAN (ATP): Susun TP tersebut ke dalam alur urutan pembelajaran yang logis dari mudah ke sulit atau dari konkret ke abstrak.
4. PERKIRAAN JAM PELAJARAN (JP): Berikan saran alokasi waktu untuk setiap TP.
5. KATA KUNCI & MATERI INTI: Daftar konsep utama yang harus dikuasai siswa.
6. PROFIL PELAJAR PANCASILA: Tentukan dimensi yang paling relevan dengan alur ini.

Gunakan bahasa yang sangat profesional namun praktis bagi guru. Gunakan format Markdown yang sangat rapi (gunakan tabel untuk ATP agar mudah dibaca) sehingga siap dipindahkan ke Google Docs.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan pemetaan kurikulum. Periksa kuota API Key Anda.");
  return result;
}
