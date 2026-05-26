'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan Modul Ajar (RPP) Profesional.
 * Mendukung Kurikulum Merdeka (Kemdikbud) dan Kurikulum Kemenag (KBC & PPRA).
 * Output dioptimalkan menggunakan tabel Markdown untuk tampilan standar kedinasan.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const ModulAjarInputSchema = z.object({
  kurikulumPath: z.enum(['dikbud', 'kemenag']).describe('Jalur kurikulum (Kemdikbud atau Kemenag)'),
  jenjang: z.string().describe('Jenjang sekolah (SD, SMP, SMA, dll)'),
  kelas: z.string().describe('Tingkat kelas'),
  subject: z.string().describe('Mata pelajaran'),
  topic: z.string().describe('Materi pokok atau Bab'),
  alokasiWaktu: z.string().describe('Jumlah Jam Pelajaran (JP)'),
  jumlahPertemuan: z.number().default(1).describe('Jumlah pertemuan yang direncanakan'),
  profilPancasila: z.array(z.string()).describe('Dimensi Profil Pelajar Pancasila'),
  profilRahmatanLilAlamin: z.array(z.string()).optional().describe('Dimensi Profil Pelajar Rahmatan Lil Alamin (Khusus Kemenag)'),
  modelPembelajaran: z.string().describe('Model seperti PBL, PjBL, atau Inkuiri'),
  saranaPrasarana: z.string().optional().describe('Fasilitas pendukung di sekolah'),
  targetSiswa: z.string().optional().describe('Karakteristik peserta didik'),
  atpContent: z.string().optional().describe('Konten referensi CP & ATP'),
  pedagogicalPractice: z.string().optional().describe('Praktik pedagogis utama'),
  deepLearningType: z.string().optional().describe('Kategori Deep Learning (Mindful, Meaningful, Joyful)'),
});

export type ModulAjarInput = z.infer<typeof ModulAjarInputSchema>;

const ModulAjarOutputSchema = z.object({
  title: z.string().describe('Judul Modul Ajar'),
  content: z.string().describe('Konten lengkap Modul Ajar dalam format Markdown dengan Tabel'),
  lkpdPrompt: z.string().describe('Prompt visual detail dalam bahasa Inggris untuk generator gambar AI (nanobana) guna membuat LKPD yang estetik'),
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

  const selectedModel = profile.ai_model || 'gemini-2.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model(selectedModel),
  });

  const isKemenag = input.kurikulumPath === 'kemenag';

  const response = await ai.generate({
    output: { schema: ModulAjarOutputSchema },
    prompt: `Anda adalah pakar pengembang kurikulum senior di Indonesia (Widyaiswara) yang sangat ahli dalam menyusun Modul Ajar Kurikulum Merdeka yang rapi, sistematis, dan profesional.

Tugas Anda adalah menyusun "Modul Ajar" (RPP) yang sangat detail untuk ${input.jumlahPertemuan} kali pertemuan.

KONTEKS KURIKULUM:
- Jalur: ${isKemenag ? 'KEMENTERIAN AGAMA (Kemenag) - Fokus pada Kurikulum Berbasis Cinta (KBC)' : 'KEMDIKBUDRISTEK (Kemdikbud)'}
- Nama Sekolah: ${profile.school_name || 'Sekolah Terkait'}
- Nama Guru: ${profile.full_name}
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.kelas} (${input.jenjang})
- Materi/Bab: ${input.topic}
- Alokasi Waktu: ${input.alokasiWaktu}
- Model Pembelajaran: ${input.modelPembelajaran}
- Profil Pelajar Pancasila: ${input.profilPancasila.join(', ')}
${isKemenag ? `- Profil Pelajar Rahmatan Lil Alamin (PPRA): ${input.profilRahmatanLilAlamin?.join(', ')}` : ''}
- Fokus Praktik Pedagogis: ${input.pedagogicalPractice}
- Pendekatan Deep Learning: ${input.deepLearningType}

${input.atpContent ? `REFERENSI ALUR TUJUAN PEMBELAJARAN (WAJIB DISINKRONKAN):
{{{atpContent}}}` : ''}

ATURAN FORMAT (SANGAT PENTING):
1. GUNAKAN TABEL MARKDOWN untuk bagian "Informasi Umum" (Identitas) dan "Kegiatan Pembelajaran".
2. GUNAKAN HURUF NORMAL (Sentence case). JANGAN kapital semua.
3. TUJUAN PEMBELAJARAN: Wajib mengandung unsur ABCD (Audience, Behavior, Condition, Degree).
4. KEGIATAN PEMBELAJARAN: Harus merinci langkah per pertemuan (Pertemuan 1, 2, dst). 
   - Masukkan tabel kegiatan dengan kolom: Tahap, Kegiatan (Detail Guru & Siswa), Alokasi Waktu.
   - Integrasikan pilar Deep Learning (${input.deepLearningType}) dan praktik ${input.pedagogicalPractice} secara eksplisit dalam instruksi guru.

STRUKTUR MODUL:
1. INFORMASI UMUM: (Gunakan TABEL untuk identitas guru, sekolah, kompetensi awal, sarana, dll).
2. KOMPONEN INTI: Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik.
3. KEGIATAN PEMBELAJARAN (DETAIL PER PERTEMUAN):
   Buat TABEL untuk setiap pertemuan. Sertakan detail Pendahuluan, Inti (sesuai sintaks model ${input.modelPembelajaran}), dan Penutup.
4. ASESMEN: (Gunakan TABEL untuk kriteria penilaian formatif dan sumatif).
5. LAMPIRAN: Ringkasan LKPD, Bahan Bacaan, Glosarium, Daftar Pustaka.

PROMPT LKPD VISUAL (OUTPUT TERPISAH):
Buatlah satu prompt bahasa Inggris yang sangat detail untuk generator gambar AI. Prompt ini harus menggambarkan desain Lembar Kerja Peserta Didik (Student Worksheet) yang estetik, bersih, dan sesuai dengan materi ${input.topic} untuk kelas ${input.kelas}. Gunakan gaya "minimalist educational design" atau "professional infographic style".

Gunakan bahasa yang formal, edukatif, dan sangat praktis untuk langsung dibawa guru ke dalam kelas.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan modul. Periksa kuota API Key Anda.");
  return result;
}
