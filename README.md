# Dashboard CMS

Dashboard ini adalah sistem manajemen terpusat (CMS) untuk mengkoordinasikan komunikasi korporat dan aset informasi antara pusat dan kantor cabangng (Kancab). Dibangun menggunakan React 19, Vite, dan Supabase sebagai backend, aplikasi ini memastikan data dan dokumen internal terkelola dengan aman, terstruktur, dan efisien.

## 🌟 Fitur Utama

1. **Manajemen Siaran Pers**
   - Mendukung pendaftaran, validasi penomoran, dan manajemen metadata siaran pers (tanggal, kategori, cakupan, dll).
2. **Social Media Tracking (COMMANDO)**
   - Perangkat khusus untuk monitoring kalender dan pembuatan konten sosial media perusahaan di semua platform dan akun cabang.
3. **Roles & Permissions (Pusat & Cabang)**
   - Hierarki akses di mana admin pusat dapat memoderasi atau mendapatkan *overview* seluruh wilayah, sementara admin cabang mendapatkan kontrol atas informasi wilayah kerjanya.
4. **Monitoring Kantor Cabang**
   - Dashboard analitik dengan rendering peta dan data aktivitas setiap kantor cabang.
5. **Media Library (Aset Terpusat)**
   - Media storage untuk pengumpulan aset-aset foto/video beresolusi tinggi yang digunakan oleh tim public relations.
6. **Audit Trail**
   - Transparansi perubahan data dengan riwayat tercatat (siapa mengubah apa dan kapan) untuk mengamankan persetujuan (approval) konten.

## 🛠️ Tech Stack Dasar

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Backend & Database**: Supabase (PostgreSQL)
- **Maps**: MapLibre GL
- **Data Viz**: Recharts
- **Search Engine**: Fuse.js (Fuzzy search)
- **Ikons**: Lucide React

## 🚀 Setup Loka & Instalasi

### Prasyarat
- [Node.js](https://nodejs.org/) (disarankan v18 ke atas)
- Akun [Supabase](https://supabase.com/)

### 1. Kloning Repositori
```bash
git clone https://github.com/ExRen/DashboardCMS.git
```

### 2. Konfigurasi Environment Variables (`.env`)
Proyek ini menggunakan variabel lingkungan untuk menjaga agar kunci keamanan Anda tidak masuk dalam *source control*. Anda perlu membuat dua file `.env`.

**Di root folder (Untuk skrip migrasi Node):**
1. Salin file template:
   ```bash
   cp .env.example .env
   ```
2. Buka `.env` dan masukkan `SUPABASE_URL` dan `SUPABASE_KEY` (service_role key jika Anda bermaksud menjalankan script import).

**Di folder dashboard (Untuk web frontend):**
1. Salin file template:
   ```bash
   cd dashboard
   cp .env.example .env
   ```
2. Buka `dashboard/.env` dan masukkan:
   ```env
   VITE_SUPABASE_URL=https://<your_project_id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your_anon_key>
   ```

### 3. Instalasi Dependensi & Menjalankan Frontend
Masuk ke `dashboard` (jika belum berada di sana) lalu jalankan:

```bash
npm install
npm run dev
```

Aplikasi web dapat diakses melalui `http://localhost:5173`. 
> **Catatan**: Akun login awal menggunakan otentikasi Supabase. Silakan daftarkan *user* baru menggunakan form pendaftaran lalu atur `role`-nya melalui antarmuka tabel admin Supabase.

### 4. Setup Database & Skrip Migrasi
Semua struktur (tabel, skema, RLS, Storage) terdapat di direktori `supabase/`.
Untuk memigrasikan database melalui SQL Editor Supabase:
1. Jalankan `001_schema.sql` untuk schema awal.
2. Jalankan schema auth `009_auth_tables.sql` dst. berkaitan dengan role *Pusat/Cabang*.
3. Jika Anda memiliki file CSV *dump* dari sistem lama, letakkan di root repo dan gunakan node script berikut (pastikan sudah `npm install dotenv` di root):
   ```bash
   node import_csv.js
   node import_commando.js
   ```

## 🔐 Standar Keamanan

Repo ini dikonfigurasi agar tidak pernah mengirimkan (`push`) kredensial atau string *hardcoded* sensitif ke ranah publik.
- Seluruh rahasia wajib diamankan di `./.env` dan `dashboard/.env`.
- File asli dataset (ekstensi `.csv`, `.xlsx`) dan file error `.txt` diabaikan oleh `.gitignore`.
- RLS disediakan oleh Supabase untuk melindungi data di tingkat permintaan jaringan.

---
©Bimsky All rights reserved.
