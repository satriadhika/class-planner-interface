/**
 * Identitas tampilan aplikasi. Kalau project lu sudah punya file ini, gabungkan field barunya
 * (address, phone, email, heroImages) ke file milik lu.
 *
 * - Logo sekolah (misalnya logo PGRI) taruh di: src/assets/images/logo.png
 *   Dipakai di pojok kiri atas dashboard, navigasi & footer halaman depan, dan kop surat.
 * - Foto sekolah untuk slider halaman depan: src/assets/images/hero-1.jpg, hero-2.jpg, hero-3.jpg
 *   (ukuran sekitar 1920×900). Kalau file tidak ada, slider tampil dengan latar navy tanpa foto.
 * - Nama di dashboard diambil dari nama sekolah di akun yang login; schoolName di bawah dipakai
 *   di halaman depan (belum login) dan sebagai cadangan.
 */
export const BRANDING = {
  appName: 'Class Planner',
  schoolName: 'SMA PGRI 3 Kota Bogor',
  tagline: 'Penjurusan kelas 11 yang terarah dan adil',
  logoUrl: '/assets/images/logo.png',
  /** Kosongkan ('') kalau tidak ingin ditampilkan di footer halaman depan. */
  address: '',
  phone: '',
  email: '',
  heroImages: ['/assets/images/hero-1.jpg', '/assets/images/hero-2.jpg', '/assets/images/hero-3.jpg'] as string[],
};
