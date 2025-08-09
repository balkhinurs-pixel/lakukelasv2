
# Panduan Konfigurasi Login Google di Supabase

Dokumen ini akan memandu Anda melalui proses penyiapan autentikasi Google OAuth 2.0 untuk aplikasi Anda yang menggunakan Supabase. Setelah mengikuti langkah-langkah ini, pengguna akan dapat mendaftar dan masuk ke aplikasi Anda menggunakan akun Google mereka.

## Daftar Isi
1. [Langkah 1: Buat Proyek di Google Cloud Console](#langkah-1-buat-proyek-di-google-cloud-console)
2. [Langkah 2: Konfigurasi Layar Persetujuan OAuth](#langkah-2-konfigurasi-layar-persetujuan-oauth)
3. [Langkah 3: Buat Kredensial OAuth 2.0](#langkah-3-buat-kredensial-oauth-20)
4. [Langkah 4: Konfigurasi Provider Google di Supabase](#langkah-4-konfigurasi-provider-google-di-supabase)
5. [Langkah 5: Tambahkan URL Pengalihan di Google](#langkah-5-tambahkan-url-pengalihan-di-google)

---

### Langkah 1: Buat Proyek di Google Cloud Console

Jika Anda belum memiliki proyek, Anda perlu membuatnya terlebih dahulu.

1.  Buka [Google Cloud Console](https://console.cloud.google.com/).
2.  Di bagian atas, klik pada menu dropdown proyek (di sebelah logo Google Cloud).
3.  Klik **"New Project"**.
4.  Beri nama proyek Anda (misalnya, "Lakukelas Auth") dan klik **"Create"**.

---

### Langkah 2: Konfigurasi Layar Persetujuan OAuth

Ini adalah layar yang akan dilihat pengguna saat mereka mencoba login dengan Google untuk pertama kalinya.

1.  Di menu navigasi kiri (ikon hamburger), pergi ke **APIs & Services > OAuth consent screen**.
2.  Pilih tipe pengguna **"External"** dan klik **"Create"**.
3.  Isi informasi yang diperlukan:
    -   **App name**: Nama aplikasi Anda (e.g., Lakukelas).
    -   **User support email**: Alamat email Anda.
    -   **App logo**: (Opsional) Logo aplikasi Anda.
    -   **Authorized domains**: Klik **"+ ADD DOMAIN"** dan tambahkan domain `vercel.app` jika Anda deploy di Vercel.
    -   **Developer contact information**: Masukkan alamat email Anda.
4.  Klik **"SAVE AND CONTINUE"**.
5.  Di halaman **Scopes**, klik **"SAVE AND CONTINUE"** (Anda tidak perlu menambahkan scope tambahan).
6.  Di halaman **Test users**, Anda bisa menambahkan email Anda untuk pengujian. Klik **"+ ADD USERS"** dan masukkan alamat email Anda. Klik **"SAVE AND CONTINUE"**.
7.  Tinjau ringkasan dan klik **"BACK TO DASHBOARD"**.
8.  Di dasbor Layar Persetujuan OAuth, klik **"PUBLISH APP"** dan konfirmasi untuk membuat aplikasi Anda tersedia bagi semua pengguna Google.

---

### Langkah 3: Buat Kredensial OAuth 2.0

Di sinilah Anda akan mendapatkan Client ID dan Client Secret.

1.  Di menu navigasi kiri, pergi ke **APIs & Services > Credentials**.
2.  Klik **"+ CREATE CREDENTIALS"** di bagian atas, lalu pilih **"OAuth client ID"**.
3.  Konfigurasi Client ID:
    -   **Application type**: Pilih **"Web application"**.
    -   **Name**: Beri nama, misalnya "Lakukelas Web Client".
4.  **JANGAN TAMBAHKAN URI PENGALIHAN DULU**. Kita akan melakukannya di langkah terakhir.
5.  Klik **"CREATE"**.
6.  Sebuah popup akan muncul menampilkan **Your Client ID** dan **Your Client Secret**.
    -   **Salin kedua nilai ini**. Anda akan membutuhkannya di langkah berikutnya. Simpan di tempat yang aman.



---

### Langkah 4: Konfigurasi Provider Google di Supabase

Sekarang, kita akan memasukkan kredensial yang didapat ke Supabase.

1.  Buka proyek Anda di [Dasbor Supabase](https://supabase.com/dashboard).
2.  Di menu kiri, navigasi ke **Authentication > Providers**.
3.  Temukan **Google** dalam daftar dan klik untuk mengaktifkannya.
4.  Tempelkan **Client ID** dan **Client Secret** yang telah Anda salin dari Google Cloud Console ke kolom yang sesuai.
5.  Pastikan tombol **"Enabled"** aktif.
6.  Klik **"Save"**.
7.  Setelah menyimpan, Anda akan melihat **Callback URL** yang disediakan oleh Supabase di bawah kolom Client Secret. **Salin URL ini**. URL ini akan terlihat seperti: `https://<ID-PROYEK-ANDA>.supabase.co/auth/v1/callback`.



---

### Langkah 5: Tambahkan URL Pengalihan di Google

Langkah terakhir adalah memberitahu Google ke mana harus mengirim pengguna setelah mereka berhasil login.

1.  Kembali ke halaman **Credentials** di Google Cloud Console.
2.  Klik pada nama Client ID yang telah Anda buat sebelumnya ("Lakukelas Web Client").
3.  Di bawah bagian **"Authorized redirect URIs"**, klik **"+ ADD URI"**.
4.  **Tempelkan Callback URL** yang telah Anda salin dari Supabase.
5.  Klik **"SAVE"** di bagian bawah.

**Selesai!** Login dengan Google sekarang seharusnya sudah berfungsi di aplikasi Anda. Pengguna dapat mengklik tombol "Masuk dengan Google" dan mengikuti alur autentikasi standar.
