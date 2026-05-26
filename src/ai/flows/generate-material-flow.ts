'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan Ringkasan Materi Ajar.
 * Mendukung analisis multimodal (PDF/Gambar) dan rendering LaTeX/Arab.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const MaterialGenerationInputSchema = z.object({
  jenjang: z.string(),
  kelas: z.string(),
  semester: z.string().optional(),
  subject: z.string(),
  topic: z.string(),
  subtopic: z.string().optional(),
  instruction: z.string().optional(),
  depth: z.enum(['dasar', 'menengah', 'mendalam']).default('menengah'),
  mediaDataUri: z.string().optional().describe('Materi dalam format Data URI (Base64)'),
  mediaMimeType: z.string().optional(),
});

export type MaterialGenerationInput = z.infer<typeof MaterialGenerationInputSchema>;

const MaterialGenerationOutputSchema = z.object({
  title: z.string().describe('Judul materi ajar yang dihasilkan'),
  content: z.string().describe('Konten materi ajar lengkap dalam format Markdown'),
});

export type MaterialGenerationOutput = z.infer<typeof MaterialGenerationOutputSchema>;

export async function generateMaterial(input: MaterialGenerationInput): Promise<MaterialGenerationOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi login berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini belum diatur di Pengaturan.");
  }

  const selectedModel = profile.ai_model || 'gemini-2.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model(selectedModel),
  });

  const response = await ai.generate({
    output: { schema: MaterialGenerationOutputSchema },
    prompt: [
        ...(input.mediaDataUri ? [{ media: { url: input.mediaDataUri, contentType: input.mediaMimeType } }] : []),
        { text: `Anda adalah pakar edukasi dan penulis buku ajar profesional di Indonesia.
Tugas Anda adalah membuat "Materi Ajar Terstruktur" untuk:
- Jenjang: ${input.jenjang}
- Kelas: ${input.kelas}
- Semester: ${input.semester || 'Tidak ditentukan'}
- Mata Pelajaran: ${input.subject}
- Topik Utama: ${input.topic}
- Sub-topik: ${input.subtopic || 'Umum'}
- Tingkat Kedalaman: ${input.depth}
- Instruksi Tambahan: ${input.instruction || 'Tidak ada'}

${input.mediaDataUri ? `PENTING: Gunakan materi dari file lampiran sebagai referensi utama.` : ''}

ATURAN FORMAT (SANGAT PENTING):
1. MATEMATIKA/IPA: Gunakan LaTeX untuk setiap rumus. 
   - Inline: \\( ... \\)
   - Blok: \\[ ... \\]
2. TABEL: Gunakan format tabel Markdown yang rapi.
3. BAHASA ARAB: Gunakan Unicode asli Arab (RTL) jika relevan.
4. STRUKTUR MATERI:
   - Pendahuluan: Gambaran umum yang inspiratif.
   - Peta Konsep/Poin Inti: Daftar konsep kunci yang harus dikuasai.
   - Penjelasan Materi: Penjelasan detail dengan bahasa yang sesuai usia siswa.
   - Contoh Kasus/Eksperimen: Contoh nyata di kehidupan sehari-hari atau percobaan sederhana.
   - Glosarium Singkat: Istilah-istilah sulit.

Gunakan format Markdown yang profesional dengan heading (#, ##, ###) dan list.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan materi. Periksa API Key Anda.");
  return result;
}
