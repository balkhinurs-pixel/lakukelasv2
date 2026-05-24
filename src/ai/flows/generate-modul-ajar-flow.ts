'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan Modul Ajar (RPP) Profesional.
 * Mendukung Kurikulum Merdeka (Kemdikbud) dan Kurikulum Kemenag (KBC & PPRA).
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

  const selectedModel = profile.ai_model || 'gemini-2.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model(selectedModel),
  });

  const isKemenag = input.kurikulumPath === 'kemenag';

  const response = await ai.generate({
    output: { schema: ModulAjarOutputSchema },
    prompt: `Anda adalah pakar pengembang kurikulum senior di Indonesia yang ahli dalam Kurikulum Merdeka (Kemdikbud) dan Kurikulum Madrasah (Kemenag).
Tugas Anda adalah menyusun "Modul Ajar" (RPP) yang sangat detail untuk ${input.jumlahPertemuan} kali pertemuan.

KONTEKS KURIKULUM:
- Jalur: ${isKemenag ? 'KEMENTERIAN AGAMA (Kemenag) - Fokus pada Kurikulum Berbasis Cinta (KBC)' : 'KEMDIKBUDRISTEK (Kemdikbud)'}
- Sekolah: ${profile.school_name || 'Sekolah Terkait'}
- Nama Guru: ${profile.full_name}
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.kelas} (${input.jenjang})
- Materi: ${input.topic}
- Alokasi Waktu: ${input.alokasiWaktu} untuk ${input.jumlahPertemuan} Pertemuan
- Model: ${input.modelPembelajaran}
- Profil Pelajar Pancasila: ${input.profilPancasila.join(', ')}
${isKemenag ? `- Profil Pelajar Rahmatan Lil Alamin (PPRA): ${input.profilRahmatanLilAlamin?.join(', ')}` : ''}
- Praktik Pedagogis: ${input.pedagogicalPractice}
- Pendekatan Deep Learning: ${input.deepLearningType}

${input.atpContent ? `REFERENSI CP & ATP:
{{{atpContent}}}` : ''}

STRUKTUR MODUL (HARUS PROFESIONAL):
1. INFORMASI UMUM: Identitas, Kompetensi Awal, Profil Pelajar, Sarana, Target Siswa, Model Pembelajaran.
2. KOMPONEN INTI: Tujuan Pembelajaran (ABCD), Pemahaman Bermakna, Pertanyaan Pemantik.
3. KEGIATAN PEMBELAJARAN (DETAIL PER PERTEMUAN):
   Urutkan dari Pertemuan 1 sampai Pertemuan ${input.jumlahPertemuan}. Setiap pertemuan harus mencakup:
   - Pendahuluan (Orientasi, Apersepsi, Motivasi).
   - Inti (Langkah-langkah Model ${input.modelPembelajaran} dikombinasikan dengan Praktik ${input.pedagogicalPractice}).
   - Penutup (Refleksi, Umpan Balik, Tindak Lanjut).
   ${isKemenag ? '- Integrasikan nilai-nilai KBC (Kurikulum Berbasis Cinta) dalam interaksi guru-siswa.' : ''}
   - Pastikan prinsip Deep Learning (${input.deepLearningType}) terlihat nyata dalam langkah kegiatan.

4. ASESMEN: Diagnostik, Formatif, Sumatif (Sertakan instrumen singkat).
5. LAMPIRAN: LKPD singkat, Bahan Bacaan, Glosarium, Daftar Pustaka.

Gunakan bahasa yang formal, inspiratif, dan sangat praktis bagi guru. Format Markdown harus sangat rapi dengan heading, tabel, dan bullet points.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan modul. Periksa kuota API Key Anda.");
  return result;
}
