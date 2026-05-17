
'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan konten pendidikan (RPP & Soal).
 * Menggunakan API Key pribadi milik guru yang disimpan di profil database.
 * Menggunakan model Gemini 1.5 Flash untuk efisiensi kuota free tier.
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

  // Inisialisasi instance Genkit lokal dengan model 1.5 Flash agar hemat kuota
  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model('gemini-1.5-flash'),
  });

  const response = await ai.generate({
    output: { schema: EducationContentOutputSchema },
    prompt: `Anda adalah asisten AI guru profesional di Indonesia yang ahli dalam kurikulum terbaru (Kurikulum Merdeka).
Tugas Anda adalah membantu guru membuat dokumen pembelajaran yang sangat detail, sistematis, dan siap pakai.

${input.type === 'rpp' ? `
Buatlah Modul Ajar / RPP (Rencana Pelaksanaan Pembelajaran) yang komprehensif untuk:
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.classLevel}
- Materi: ${input.topic}
- Instruksi Khusus: ${input.additionalInfo || 'Tidak ada'}

Struktur Dokumen harus mengikuti urutan berikut:
1. INFORMASI UMUM: Identitas (Nama Guru, Sekolah, Tahun), Kompetensi Awal, Profil Pelajar Pancasila, Sarana & Prasarana, Target Peserta Didik, Model Pembelajaran yang digunakan.
2. KOMPONEN INTI: Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Persiapan Pembelajaran.
3. KEGIATAN PEMBELAJARAN: Langkah-langkah detail (Pendahuluan, Inti - menggunakan sintaks model tertentu, Penutup).
4. ASESMEN: Rencana Asesmen Formatif dan Sumatif.
5. LAMPIRAN: Lembar Kerja Peserta Didik (LKPD), Bahan Bacaan Guru & Siswa, Glosarium, Daftar Pustaka.

Gunakan bahasa yang formal, inspiratif, dan mudah dipahami.` : `
Buatlah Bank Soal yang mendalam dan bervariasi untuk:
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.classLevel}
- Materi: ${input.topic}
- Jumlah Soal: ${input.count || 10} soal
- Instruksi Khusus: ${input.additionalInfo || 'Tidak ada'}

Struktur Dokumen harus mencakup:
1. KISI-KISI SINGKAT: Capaian Pembelajaran, Alur Tujuan Pembelajaran, dan Level Kognitif (C1-C6).
2. PILIHAN GANDA: Sajikan ${input.count || 10} soal pilihan ganda dengan 5 opsi (A, B, C, D, E). Sertakan kunci jawaban di bawah setiap soal.
3. SOAL ESAI: Sajikan 5 soal esai yang melatih kemampuan berpikir kritis (HOTS). Sertakan pedoman penskoran/rubrik penilaian untuk setiap soal esai.

Pastikan soal kontekstual dengan kehidupan sehari-hari di Indonesia.`}

Gunakan format Markdown yang rapi dengan heading, list, dan tabel jika diperlukan agar mudah dibaca di Google Docs.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan konten AI. Pastikan API Key Anda valid dan memiliki sisa kuota.");
  return result;
}
