# Panduan Deployment ke Vercel dan Supabase

Dokumen ini akan memandu Anda melalui proses deployment aplikasi Next.js ini menggunakan Vercel untuk hosting dan Supabase sebagai backend (database, autentikasi, dll).

## Daftar Isi
1.  [Prasyarat](#1-prasyarat)
2.  [Langkah 1: Setup Proyek Supabase](#2-langkah-1-setup-proyek-supabase)
3.  [Langkah 2: Setup Tabel Database](#3-langkah-2-setup-tabel-database)
4.  [Langkah 3: Deploy ke Vercel](#4-langkah-3-deploy-ke-vercel)
5.  [Langkah 4: Konfigurasi Environment Variables](#5-langkah-4-konfigurasi-environment-variables)
6.  [Langkah Selanjutnya](#6-langkah-selanjutnya)

---

### 1. Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Akun **GitHub** (atau GitLab/Bitbucket).
- Akun **Supabase** ([Daftar di sini](https://supabase.com/dashboard)).
- Akun **Vercel** ([Daftar di sini](https://vercel.com/signup)).
- Akun **Duitku** (Sandbox atau Production) untuk payment gateway.

---

### 2. Langkah 1: Setup Proyek Supabase

Supabase akan kita gunakan sebagai database dan backend.

1.  **Buat Proyek Baru**:
    -   Masuk ke [Dashboard Supabase](https://supabase.com/dashboard).
    -   Klik **"New Project"**.
    -   Isi nama proyek Anda dan buat kata sandi database yang kuat.
    -   Pilih region server yang paling dekat dengan target pengguna Anda.
    -   Klik **"Create new project"**. Proses ini mungkin memerlukan beberapa menit.

2.  **Ambil Kunci API**:
    -   Setelah proyek selesai dibuat, buka proyek Anda.
    -   Di menu samping, navigasi ke **Project Settings** (ikon roda gigi) > **API**.
    -   Di halaman ini, Anda akan menemukan:
        -   **Project URL** (dibawah `URL`).
        -   **Project API Keys** > `anon` `public`.
    -   Salin kedua nilai ini. Kita akan membutuhkannya nanti. **Jaga kerahasiaan kunci ini**.

---

### 3. Langkah 2: Setup Tabel Database

Kita perlu membuat tabel di database Supabase untuk menyimpan data aplikasi.

1.  **Buka SQL Editor**:
    -   Di menu samping Supabase, klik ikon **SQL Editor** (terlihat seperti `>_`).
    -   Klik **"+ New query"**.

2.  **Jalankan Skrip SQL**:
    -   Buka file `schema.sql` yang ada di direktori root proyek ini.
    -   Salin **seluruh isi** file `schema.sql`.
    -   Tempelkan skrip tersebut ke dalam editor SQL di Supabase.
    -   Klik tombol **"RUN"**.

Ini akan secara otomatis membuat semua tabel yang diperlukan (`users`, `profiles`, `classes`, `students`, `subjects`, dll.) dengan struktur dan relasi yang benar.

---

### 4. Langkah 3: Deploy ke Vercel

Vercel akan kita gunakan untuk hosting aplikasi Next.js Anda.

1.  **Push Kode ke GitHub**:
    -   Pastikan proyek ini sudah ada di repositori GitHub Anda.

2.  **Impor Proyek ke Vercel**:
    -   Masuk ke [Dashboard Vercel](https://vercel.com/dashboard).
    -   Klik **"Add New..."** > **"Project"**.
    -   Pilih repositori GitHub yang ingin Anda deploy.
    -   Vercel akan otomatis mendeteksi bahwa ini adalah proyek Next.js. Biarkan semua pengaturan default.

3.  **Konfigurasi Environment Variables**:
    -   Sebelum menekan tombol "Deploy", buka bagian **"Environment Variables"**.
    -   Di sini, kita akan menambahkan kunci API yang telah kita dapatkan dari Supabase dan Duitku. Lihat langkah berikutnya untuk detailnya.

---

### 5. Langkah 4: Konfigurasi Environment Variables

Variabel ini penting agar aplikasi Anda bisa terhubung ke layanan eksternal seperti Supabase dan Duitku.

-   Buka `.env.example` (jika ada) di proyek ini untuk melihat daftar variabel yang dibutuhkan.
-   Di pengaturan proyek Vercel (saat akan deploy atau di menu *Settings* > *Environment Variables*), tambahkan variabel berikut satu per satu:

| Nama Variabel                  | Nilai                                                                   | Deskripsi                                 |
| ------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------- |
| `DUITKU_MERCHANT_CODE`         | `Dapatkan dari akun Duitku Anda`                                        | Kode Merchant Duitku Anda.                |
| `DUITKU_API_KEY`               | `Dapatkan dari akun Duitku Anda`                                        | Kunci API Duitku Anda.                    |
| `NEXT_PUBLIC_APP_URL`          | `URL yang diberikan oleh Vercel setelah deploy`                         | URL utama aplikasi Anda (misal: `https://nama-proyek.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL`     | `URL proyek Supabase Anda`                                              | Salin dari pengaturan API Supabase.       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| `Kunci anon public Supabase Anda`                                       | Salin dari pengaturan API Supabase.       |

-   Setelah semua variabel ditambahkan, klik tombol **"Deploy"** di Vercel.

Vercel akan mulai membangun dan men-deploy aplikasi Anda. Setelah selesai, Anda akan mendapatkan URL publik untuk mengakses aplikasi Anda!

---

### 6. Langkah Selanjutnya

Saat ini, aplikasi masih menggunakan data placeholder. Langkah pengembangan selanjutnya adalah:
1.  **Integrasi Supabase Client**: Gunakan `@supabase/supabase-js` di dalam kode Next.js Anda untuk berinteraksi dengan database.
2.  **Ganti Data Placeholder**: Ubah semua pemanggilan data statis (dari `placeholder-data.ts`) menjadi pemanggilan data dinamis dari database Supabase Anda.
3.  **Implementasi Autentikasi**: Gantikan halaman login statis dengan sistem autentikasi Supabase untuk mengelola login guru.
4.  **Bangun API Endpoint**: Buat API endpoint di Next.js (misalnya di `app/api`) untuk menangani callback dari Duitku.
