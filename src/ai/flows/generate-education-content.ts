'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan konten pendidikan (RPP & Soal).
 */

import { ai, z } from '@/ai/genkit';

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

const prompt = ai.definePrompt({
  name: 'educationContentPrompt',
  input: { schema: EducationContentInputSchema },
  output: { schema: EducationContentOutputSchema },
  prompt: `Anda adalah asisten AI guru profesional di Indonesia. 
Tugas Anda adalah membantu guru membuat dokumen pembelajaran berkualitas tinggi.

{{#if (eq type 'rpp')}}
Buatlah RPP (Rencana Pelaksanaan Pembelajaran) yang lengkap dan inspiratif untuk:
- Mata Pelajaran: {{{subject}}}
- Kelas: {{{classLevel}}}
- Materi: {{{topic}}}
- Info Tambahan: {{{additionalInfo}}}

Struktur RPP harus mencakup:
1. Identitas (Sekolah, Mapel, Kelas, Semester)
2. Kompetensi Inti / Tujuan Pembelajaran
3. Langkah-langkah Kegiatan (Pendahuluan, Inti, Penutup)
4. Media & Sumber Belajar
5. Penilaian (Asesmen)

Gunakan bahasa yang formal, edukatif, dan sesuai Kurikulum Merdeka.
{{else}}
Buatlah Bank Soal yang komprehensif untuk:
- Mata Pelajaran: {{{subject}}}
- Kelas: {{{classLevel}}}
- Materi: {{{topic}}}
- Jumlah Soal: {{{count}}} soal
- Info Tambahan: {{{additionalInfo}}}

Sediakan soal dalam bentuk Pilihan Ganda (beserta kunci jawaban) dan beberapa soal Esai (beserta pedoman penskoran).
Pastikan soal mencakup berbagai level kognitif (C1-C6).
{{/if}}

Format output harus dalam Markdown yang rapi.`,
});

export async function generateEducationContent(input: EducationContentInput): Promise<EducationContentOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error("Gagal menghasilkan konten AI.");
  return output;
}
