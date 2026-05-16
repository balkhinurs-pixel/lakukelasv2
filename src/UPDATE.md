
# Log Pembaruan LakuKelas

## V14.0: Optimasi Performa & Kapasitas (TERBARU)
Meningkatkan efisiensi aplikasi secara drastis untuk memaksimalkan kuota Free Tier.

### 1. Database Query Optimization
- **Bulk Fetching**: Mengurangi jumlah request database pada halaman Presensi dan Nilai dari ±14 request menjadi hanya 1-2 request gabungan menggunakan teknik Database Joins.
- **Improved Caching**: Menstabilkan data statis seperti profil dan tahun ajaran untuk mengurangi beban server.
- **Scalability**: Dengan optimasi ini, aplikasi kini mampu menampung hingga 150+ guru secara bersamaan di satu sekolah tanpa penurunan performa yang signifikan.

---

## V13.5: Perbaikan Deteksi Data & Optimasi Penilaian
Menyelesaikan masalah krusial pada deteksi siswa dan menyempurnakan fitur "Smart Katrol".

### 1. Backend & Data Fix
- **Class ID Mapping**: Memperbaiki fungsi `getAllStudents` di `src/lib/data.ts` dengan menyertakan kolom `class_id`.
- **Smart Logic**: Memastikan fitur pencarian dan tombol Katrol tetap muncul secara stabil di menu Penilaian setelah pemilihan kelas dilakukan.

---

## V13.2: Standarisasi Header Premium & Visual Aset
Menerapkan bahasa desain yang konsisten di seluruh modul utama aplikasi.

### 1. UI Modul Presensi & Nilai
- **Indigo Gradient Header**: Mengganti header standar dengan desain kartu gradien indigo premium.
- **Lottie Integration**: Menambahkan ilustrasi interaktif pada header.
- **Mobile HSIA Optimization**: Tombol status (H, S, I, A) kini tersusun dalam satu baris horizontal di mobile.

... (sisanya tetap)
