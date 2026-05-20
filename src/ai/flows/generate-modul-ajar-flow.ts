'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan Modul Ajar (RPP) Kurikulum Merdeka.
 * Menggunakan model dinamis sesuai preferensi guru.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const ModulAjarInputSchema = z.object({
  jenjang: z.string().describe('Jenjang sekolah (SD, SMP, SMA, dll)'),
  kelas: z.string().describe('Tingkat kelas'),
  subject: z.string().describe('Mata pelajaran'),
  topic: z.string().describe('Materi pokok atau Bab'),
  alokasiWaktu: z.string().describe('Jumlah Jam Pelajaran (JP)'),
  profilPancasila: z.array(z.string()).describe('Dimensi Profil Pelajar Pancasila yang disasar'),
  modelPembelajaran: z.string().describe('Model seperti PBL, PjBL, atau Inkuiri'),
  saranaPrasarana: z.string().optional().describe('Fasilitas pendukung di sekolah'),
  targetSiswa: z.string().optional().describe('Karakteristik peserta didik'),
});

export type ModulAjarInput = z.infer<typeof ModulAjarInputSchema>;

const ModulAjarOutputSchema = z.object({
  title: z.string().describe('Judul Modul Ajar'),
  content: z.string().describe('Konten lengkap Modul Ajar dalam format Markdown'),
});

export type ModulAjarOutput = z.infer<typeof ModulAjarOutputSchema>;

export async function generateModulAjar(input: ModulAjarInput): Promise<ModulAjarOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi login berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, full_name, school_name, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini belum diatur di Pengaturan > Integrasi.");
  }

  // Gunakan model pilihan user atau fallback ke 2.5-flash
  const selectedModel = profile.ai_model || 'gemini-2.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model(selectedModel),
  });

  const response = await ai.generate({
    output: { schema: ModulAjarOutputSchema },
    prompt: `Anda adalah pakar pengembang kurikulum dan guru penggerak senior di Indonesia.
Tugas Anda adalah menyusun "Modul Ajar" (RPP) yang sangat detail, sistematis, dan profesional sesuai standar Kurikulum Merdeka.

IDENTITAS INPUT:
- Sekolah: ${profile.school_name || 'Sekolah Terkait'}
- Nama Guru: ${profile.full_name}
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.kelas}
- Jenjang: ${input.jenjang}
- Materi: ${input.topic}
- Alokasi Waktu: ${input.alokasiWaktu}
- Model Pembelajaran: ${input.modelPembelajaran}
- Profil Pelajar Pancasila: ${input.profilPancasila.join(', ')}
- Sarana & Prasarana: ${input.saranaPrasarana || 'Standar Ruang Kelas'}
- Target Siswa: ${input.targetSiswa || 'Peserta didik reguler'}

STRUKTUR MODUL (WAJIB ADA):
1. INFORMASI UMUM: Identitas Modul, Kompetensi Awal, Profil Pelajar Pancasila, Sarana & Prasarana, Target Peserta Didik, Model Pembelajaran.
2. KOMPONEN INTI: Tujuan Pembelajaran (ABCD format), Pemahaman Bermakna, Pertanyaan Pemantik, Persiapan Pembelajaran.
3. KEGIATAN PEMBELAJARAN: Langkah-langkah detail per fase (Pendahuluan, Inti, Penutup) dengan alokasi menit. Sertakan sintaks ${input.modelPembelajaran}.
4. ASESMEN: Rencana Asesmen Formatif (awal & proses) dan Sumatif. Sertakan instrumen singkat (rubrik/checklist).
5. PENGAYAAN & REMEDIAL: Strategi untuk siswa cepat dan siswa yang butuh bantuan.
6. REFLEKSI: Refleksi guru dan siswa.
7. LAMPIRAN: Bahan Bacaan Guru & Siswa, Glosarium, Daftar Pustaka.

Gunakan bahasa yang formal namun inspiratif. Gunakan format Markdown yang sangat rapi (heading, bullet points, table) agar mudah dibaca di Google Docs.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan modul. Periksa kuota API Key Anda.");
  return result;
}