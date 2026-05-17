
'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan konten pendidikan (RPP & Soal).
 * Menggunakan API Key pribadi milik guru yang disimpan di profil database.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi login berakhir. Harap masuk kembali.");

  // Ambil API Key dari profil guru
  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini belum diatur. Harap isi di menu Pengaturan > Integrasi.");
  }

  // Inisialisasi instance Genkit lokal dengan API Key milik guru tersebut
  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model('gemini-2.0-flash'),
  });

  const response = await ai.generate({
    output: { schema: EducationContentOutputSchema },
    prompt: `Anda adalah asisten AI guru profesional di Indonesia. 
Tugas Anda adalah membantu guru membuat dokumen pembelajaran berkualitas tinggi.

${input.type === 'rpp' ? `
Buatlah RPP (Rencana Pelaksanaan Pembelajaran) yang lengkap dan inspiratif untuk:
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.classLevel}
- Materi: ${input.topic}
- Info Tambahan: ${input.additionalInfo || 'Tidak ada'}

Struktur RPP harus mencakup:
1. Identitas (Sekolah, Mapel, Kelas, Semester)
2. Kompetensi Inti / Tujuan Pembelajaran
3. Langkah-langkah Kegiatan (Pendahuluan, Inti, Penutup)
4. Media & Sumber Belajar
5. Penilaian (Asesmen)

Gunakan bahasa yang formal, edukatif, dan sesuai Kurikulum Merdeka.` : `
Buatlah Bank Soal yang komprehensif untuk:
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.classLevel}
- Materi: ${input.topic}
- Jumlah Soal: ${input.count || 10} soal
- Info Tambahan: ${input.additionalInfo || 'Tidak ada'}

Sediakan soal dalam bentuk Pilihan Ganda (beserta kunci jawaban) dan beberapa soal Esai (beserta pedoman penskoran).
Pastikan soal mencakup berbagai level kognitif (C1-C6).`}

Format output harus dalam Markdown yang rapi.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan konten AI. Pastikan API Key Anda valid.");
  return result;
}
