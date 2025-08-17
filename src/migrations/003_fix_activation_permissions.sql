-- Migrasi untuk memperbaiki izin fungsi aktivasi
-- Jalankan perintah ini di SQL Editor Supabase Anda.

-- Mengubah pemilik fungsi ke 'postgres' (superuser) untuk memastikan
-- fungsi memiliki izin yang cukup untuk mengupdate tabel 'profiles'.
ALTER FUNCTION activate_account_with_code(text, uuid, text) OWNER TO postgres;
