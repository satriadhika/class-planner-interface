import { HttpErrorResponse } from '@angular/common/http';

import { currentLang } from '../i18n/i18n';

/** Format error dari backend (Problem Details / RFC 9457). */
export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

/**
 * Pesan backend selalu bahasa Indonesia. Untuk tampilan bahasa Inggris, pesan diterjemahkan:
 * pertama dicocokkan teks persisnya (kode yang sama bisa punya beberapa pesan), lalu lewat kode error.
 * Pesan yang memuat data (nama kelas, NIS, daftar murid) diterjemahkan dengan pola supaya datanya tetap tampil.
 */
const EXACT_EN: Record<string, string> = {
  'Kuesioner sudah dikirim dan tidak bisa diubah.': 'The questionnaire has been submitted and can no longer be changed.',
  'Kelas tidak ditemukan.': 'Class not found.',
  'Siklus sudah disetujui dan tidak bisa diubah.': 'This cycle has been approved and can no longer be changed.',
  'Siklus sudah disetujui, nilai tidak bisa diubah.': 'This cycle has been approved, so grades can no longer be changed.',
  'Angkatan hanya bisa diubah saat siklus masih draf.': 'The year group can only be changed while the cycle is a draft.',
  'Hanya siklus berstatus draf yang bisa dihapus.': 'Only draft cycles can be deleted.',
  'Siklus tidak ditemukan.': 'Cycle not found.',
  'File kosong.': 'The file is empty.',
  'Kategori mapel harus UMUM atau PILIHAN.': 'Subject category must be UMUM (core) or PILIHAN (elective).',
  'Aturan pasangan tidak boleh ke mapel yang sama.': 'A pairing rule cannot point to the same subject.',
  'Rumpun harus IPA, IPS, atau kosong (netral).': 'Stream must be IPA (science), IPS (social), or empty (neutral).',
  'Hanya hasil pemerataan yang bisa disetujui.': 'Only balanced results can be approved.',
  'Jalankan pemerataan dulu untuk melihat penempatan.': 'Run balancing first to see the placements.',
  'Kelas hanya bisa dibatalkan sebelum pemilihan kelas dibuka.': 'Classes can only be cancelled before class selection opens.',
  'Tutup periode pemilihan kelas dulu sebelum pemerataan.': 'Close class selection before running balancing.',
  'Hasil kelas sudah disetujui dan tidak bisa diubah.': 'The class results have been approved and can no longer be changed.',
  'Jalankan pemerataan dulu.': 'Run balancing first.',
  'Bobot rapor + minat bakat + minat siswa harus 100%.': 'Report grades + aptitude + student interest weights must add up to 100%.',
  'Jurusan tidak ditemukan.': 'Major not found.',
  'Jurusan yang dipilih tidak tersedia.': 'The selected major is not available.',
  'NIS tidak bisa diubah. Hapus lalu tambah murid baru.': 'The NIS cannot be changed. Delete the student and add them again.',
  'Akun ini bukan akun murid.': 'This account is not a student account.',
  'Kelas final belum disetujui waka kurikulum.': 'Your final class has not been approved by the vice principal yet.',
  'Belum ada kelas yang disimpan.': 'No classes have been saved yet.',
  'Akun ini tidak terikat sekolah.': 'This account is not linked to a school.',
  'Belum ada murid di angkatan ini.': 'There are no students in this year group yet.',
  'Penempatan murid tidak ditemukan.': 'Student placement not found.',
  'Cita-cita wajib diisi.': 'Please fill in your career goal.',
  'Minat IPA dan IPS wajib diisi.': 'Please rate your interest in IPA and IPS.',
  'Pilihan jurusan 1 dan 2 wajib diisi.': 'Please choose major 1 and major 2.',
  'Kirim kuesioner dulu sebelum memilih kelas.': 'Submit the questionnaire before choosing a class.',
  'Pilihan jurusan 1 dan 2 harus berbeda.': 'Major 1 and major 2 must be different.',
  'Sekolah tidak ditemukan.': 'School not found.',
  'Periode pemilihan kelas sedang tidak dibuka.': 'Class selection is not open right now.',
  'Pemilihan kelas belum dibuka.': 'Class selection has not opened yet.',
  'Murid ini hanya cocok di satu kelas, jadi tidak bisa dipindah.': 'This student fits only one class, so they cannot be moved.',
  'Murid tidak ditemukan.': 'Student not found.',
  'Data murid tidak ditemukan.': 'Student data not found.',
  'Mapel tidak ditemukan.': 'Subject not found.',
  'Periode pengisian kuesioner sedang tidak dibuka.': 'The questionnaire is not open right now.',
  'Belum ada periode penjurusan yang dibuka untuk angkatanmu.': 'Subject selection has not opened for your year group yet.',
  'Terlalu banyak percobaan gagal. Coba lagi 1 jam lagi atau hubungi waka sekolahmu.':
    'Too many failed attempts. Try again in an hour or contact your school.',
  'Data tidak cocok. Periksa kembali kode sekolah, NIS, dan tanggal lahir.':
    'The details do not match. Check the school code, NIS, and date of birth.',
  'Data murid ini sudah terhubung dengan akun Google lain. Hubungi waka sekolahmu.':
    'This student is already linked to another Google account. Contact your school.',
  'File tidak bisa dibaca. Pastikan formatnya Excel (.xlsx atau .xls).': 'The file could not be read. Make sure it is an Excel file (.xlsx or .xls).',
  'Tidak ditemukan kolom NIS di file ini.': 'No NIS column was found in this file.',
  'Semester harus ganjil, genap, atau otomatis.': 'Semester must be odd (ganjil), even (genap), or automatic.',
  'Tidak ada kombinasi mapel yang memenuhi aturan pasangan.': 'No subject combination satisfies the pairing rules.',
  'Solusi belum ditemukan dalam batas waktu.': 'No solution was found within the time limit.',
  'Username atau password salah': 'Wrong username or password.',
  'Akun kamu dinonaktifkan. Hubungi waka sekolahmu.': 'Your account has been deactivated. Contact your school.',
  'Akun tidak aktif': 'This account is inactive.',
  'Token Google tidak valid. Silakan login ulang.': 'The Google sign-in is no longer valid. Please sign in again.',
  'Email Google belum terverifikasi': 'This Google email has not been verified.',
  'Akun Google tidak cocok dengan akun yang terdaftar': 'This Google account does not match the registered account.',
  'Akun guru kamu sedang menunggu persetujuan waka kurikulum.': 'Your teacher account is waiting for approval by the vice principal for curriculum.',
  'Sekolah kamu sedang dinonaktifkan. Hubungi admin Class Planner.': 'Your school has been deactivated. Contact the Class Planner admin.',
  'Email ini sudah terdaftar. Silakan masuk dengan Google.': 'This email is already registered. Please sign in with Google.',
  'Kode sekolah tidak ditemukan. Tanyakan ke waka kurikulum.': 'School code not found. Ask the vice principal for curriculum.',
  'Menu ini dinonaktifkan oleh admin Class Planner untuk sekolahmu.': 'This menu has been turned off for your school by the Class Planner admin.',
  'Guru tidak ditemukan.': 'Teacher not found.',
  'Akun waka tidak ditemukan.': 'Vice principal account not found.',
  'Isi email Google atau password supaya waka bisa login.': 'Fill in a Google email or a password so the vice principal can sign in.',
  'Akun tanpa password harus punya email Google.': 'An account without a password needs a Google email.',
  'Pilih sekolah terlebih dahulu.': 'Choose a school first.',
  'Komponen nilai tidak ditemukan.': 'Score component not found.',
  'Semester harus 1 sampai 6, atau otomatis.': 'Semester must be 1 to 6, or automatic.',
  'Halaman ini hanya untuk waka kurikulum dan guru BK.': 'This page is only for the vice principal for curriculum and counsellors.',
  'Setujui akun guru ini dulu sebelum dijadikan guru BK.': 'Approve this teacher account before making them a counsellor.',
  'Password lama salah.': 'The current password is wrong.',
  'Password baru harus berbeda dari password lama.': 'The new password must be different from the current one.',
  'Akun ini masuk dengan Google dan tidak memakai password.': 'This account signs in with Google and does not use a password.',
  'Format isi surat tidak valid.': 'The letter content format is invalid.',
};

/**
 * Pesan berisi data: [pola Indonesia, pengganti Inggris]. Pola tidak dijangkar supaya juga berlaku
 * pada beberapa pesan yang digabung jadi satu (misalnya alasan pemerataan gagal).
 */
const PATTERNS_EN: [RegExp, string][] = [
  // hasil impor Excel
  [/(\S+) baris (\d+) \((.+?)\): nilai IPA\/IPS kosong\./, '$1 row $2 ($3): IPA/IPS grades are empty.'],
  [/(\S+) baris (\d+): NIS atau nama kosong\./, '$1 row $2: NIS or name is empty.'],
  [/(\S+) baris (\d+) \((.+?)\): murid baru butuh tanggal lahir dan angkatan\./, '$1 row $2 ($3): a new student needs a date of birth and year group.'],
  [/(\d+) NIS tidak ditemukan di angkatan (\d+): /, '$1 NIS not found in the class of $2: '],
  [/^(.+): semester ganjil\.$/, '$1: odd semester (ganjil).'],
  [/^(.+): semester genap\.$/, '$1: even semester (genap).'],
  [/^(.+): semester tidak terbaca, nilai disimpan tanpa semester\.$/, '$1: semester not found in the title, grades saved without a semester.'],
  // impor mapel & jurusan
  [/^Mapel: (\d+) baru, (\d+) diperbarui\.$/, 'Subjects: $1 new, $2 updated.'],
  [/^Jurusan: (\d+) baru, (\d+) diperbarui\.$/, 'Majors: $1 new, $2 updated.'],
  [/(\S+) baris (\d+): kode mapel (.*) tidak valid \(huruf\/angka, maksimal 30\)\./, '$1 row $2: subject code $3 is invalid (letters/digits, max 30).'],
  [/(\S+) baris (\d+): kode jurusan (.*) tidak valid \(huruf\/angka, maksimal 30\)\./, '$1 row $2: major code $3 is invalid (letters/digits, max 30).'],
  [/(\S+) baris (\d+) \((.+?)\): nama mapel kosong atau lebih dari 150 karakter\./, '$1 row $2 ($3): subject name is empty or longer than 150 characters.'],
  [/(\S+) baris (\d+) \((.+?)\): nama jurusan kosong atau lebih dari 150 karakter\./, '$1 row $2 ($3): major name is empty or longer than 150 characters.'],
  [/(\S+) baris (\d+) \((.+?)\): kategori harus UMUM atau PILIHAN\./, '$1 row $2 ($3): category must be UMUM or PILIHAN.'],
  [/(\S+) baris (\d+) \((.+?)\): rumpun harus IPA, IPS, atau kosong \(netral\)\./, '$1 row $2 ($3): stream must be IPA, IPS, or empty (neutral).'],
  [/(\S+) baris (\d+) \((.+?)\): mapel tidak dikenal: (.+)\./, '$1 row $2 ($3): unknown subjects: $4.'],
  [/(\S+) baris (\d+) \((.+?)\): isi minimal satu mapel di MAPEL WAJIB atau MAPEL PENDUKUNG\./, '$1 row $2 ($3): fill in at least one subject under MAPEL WAJIB or MAPEL PENDUKUNG.'],
  [/(\S+) baris (\d+) \((.+?)\): maksimal (\d+) mapel per jurusan, terisi (\d+)\./, '$1 row $2 ($3): at most $4 subjects per major, found $5.'],
  [/Tidak ada data\. File harus punya kolom KODE MAPEL dan\/atau KODE JURUSAN\./, 'No data found. The file needs a KODE MAPEL and/or KODE JURUSAN column.'],
  [/Mapel wajib harus dipilih juga sebagai mapel yang dibutuhkan\./, 'Required subjects must also be selected as needed subjects.'],
  // simulasi kelas & pemerataan
  [/Jumlah murid (\d+) tidak bisa dibagi ke (\d+) kelas berisi (\d+)–(\d+) murid\./, '$1 students cannot be split into $2 classes of $3–$4 students.'],
  [/Murid (\d+): tidak ada kombinasi kelas yang memuat mapel jurusan 1-nya\./, 'Student $1: no class combination includes their first-choice major subjects.'],
  [/Aturan wajib tidak bisa dipenuhi dengan (\d+) kelas\. Coba tambah jumlah kelas, longgarkan ukuran kelas, atau kurangi syarat minimal mapel\./,
    'The required rules cannot be met with $1 classes. Try adding classes, loosening class sizes, or lowering subject minimums.'],
  [/(\d+) murid dipindah ke kelas dengan kecocokan ≤ (\d+)% \(J1 tetap terpenuhi\), karena tidak ada kelas lain yang lebih cocok\./,
    '$1 students were moved to a class with a match of ≤ $2% (major 1 still covered) because no better class was available.'],
  [/Kelas (\S+) berisi (\d+) murid \(di luar ukuran rata (\d+)–(\d+)\) karena ada murid yang hanya cocok di kelas tertentu\./,
    'Class $1 has $2 students (outside the even size of $3–$4) because some students fit only that class.'],
  [/(\d+) murid tidak bisa dibagi ke (\d+) kelas \(maks (\d+) murid\/kelas\)\. Tambah jumlah kelas\./,
    '$1 students cannot be split into $2 classes (max $3 students/class). Add more classes.'],
  [/Kelas (\S+): (\d+) murid hanya cocok di kelas ini, melebihi batas (\d+)\. Perlu kelas tambahan dengan mapel yang sama\./,
    'Class $1: $2 students fit only this class, above the limit of $3. Another class with the same subjects is needed.'],
  [/Tidak bisa pindah dari (\S+) ke (\S+)\./, 'Cannot move from $1 to $2.'],
  [/, dan (\d+) lainnya/, ', and $1 more'],
  [/^(.+): semester tidak terbaca, pilih semester secara manual\.$/, '$1: semester not found in the title, choose the semester manually.'],
  [/^(.+): semester (\d)\.$/, '$1: semester $2.'],
  [/^(\d+) NIS tidak ditemukan di data murid: /, '$1 NIS not found in student data: '],
  [/(\S+) baris (\d+) \((.+?)\): tidak ada nilai mapel\./, '$1 row $2 ($3): no subject scores.'],
  [/(\S+) baris (\d+) \((.+?)\): nilai kosong atau di luar 0–(\S+)\./, '$1 row $2 ($3): score empty or outside 0–$4.'],
  [/^Kelas (.+) tidak memuat mapel wajib jurusan pilihan 1-mu\.$/, 'Class $1 does not include the required subjects for your first-choice major.'],
  [/^Kelas (.+) tidak memuat mapel wajib jurusan pilihan 1 murid ini\.$/, "Class $1 does not include the required subjects for this student's first-choice major."],
  [/^Kode (mapel|jurusan) (.+) sudah dipakai\.$/, 'Code $2 is already in use.'],
  [/^Nama kelas (.+) dipakai lebih dari sekali\.$/, 'Class name $1 is used more than once.'],
  [/^NIS (.+) sudah terdaftar\.$/, 'NIS $1 is already registered.'],
  [/^Status tidak dikenal: (.+)$/, 'Unknown status: $1'],
  [/^Tidak ada kelas yang memuat mapel jurusan 1 untuk: (.+)\. Ubah kombinasi kelas atau jurusan murid\.$/,
    "No class includes the first-choice major subjects for: $1. Change the class combinations or the students' majors."],
  [/^Total minimal kelas per mapel \((\d+)\) melebihi slot yang ada \((\d+) kelas × (\d+) mapel\)\.$/,
    'The minimum classes per subject add up to $1, more than the available slots ($2 classes × $3 subjects).'],
  [/^Kode mapel tidak dikenal: (.+)$/, 'Unknown subject code: $1'],
  [/^Akun (.+) belum terhubung\. Lengkapi kode sekolah, NIS, dan tanggal lahir\.$/,
    'Account $1 is not linked yet. Fill in the school code, NIS, and date of birth.'],
  [/^(\d+) murid belum mengirim kuesioner: (.+)\.$/, '$1 students have not submitted the questionnaire: $2.'],
  [/^(\d+) murid belum punya kelas: (.+)\. Jalankan pemerataan ulang\.$/, '$1 students have no class yet: $2. Run balancing again.'],
  [/^Angkatan (\d+) sudah punya siklus yang belum selesai\.$/, 'The class of $1 already has an unfinished cycle.'],
  [/^Kode sekolah (.+) sudah dipakai\.$/, 'School code $1 is already in use.'],
  [/^Username (.+) sudah dipakai di sekolah ini\.$/, 'Username $1 is already used at this school.'],
  [/^Email (.+) sudah dipakai akun lain\.$/, 'Email $1 is already used by another account.'],
  [/^Menu tidak dikenal: (.+)$/, 'Unknown menu: $1'],
];

/** Terjemahan per kode, kalau teksnya tidak cocok dengan daftar di atas. */
const CODE_EN: Record<string, string> = {
  AUTH_FAILED: 'Sign-in failed. Please try again.',
  CYCLE_FINALIZED: 'This cycle has been approved and can no longer be changed.',
  CYCLE_NOT_FOUND: 'Cycle not found.',
  INVALID_STATUS: 'This action is not available at the current cycle status.',
  QUESTIONNAIRE_INCOMPLETE: 'Please complete the questionnaire.',
  NOT_FOUND: 'Data not found.',
};

/** Terjemahkan satu pesan backend ke bahasa aktif. Teks yang tidak dikenali dikembalikan apa adanya. */
export function translateMessage(text: string, code?: string | null): string {
  if (currentLang() === 'id') return text;
  const exact = EXACT_EN[text.trim()];
  if (exact) return exact;
  let out = text.trim();
  for (const [re, en] of PATTERNS_EN) {
    out = out.replace(new RegExp(re.source, 'g'), en);
  }
  if (out !== text.trim()) return out;
  return (code && CODE_EN[code]) || text;
}

const GENERIC = {
  id: { fallback: 'Terjadi kesalahan. Coba lagi.', offline: 'Tidak bisa terhubung ke server. Periksa koneksi internet kamu.' },
  en: { fallback: 'Something went wrong. Please try again.', offline: 'Cannot reach the server. Check your internet connection.' },
};

/** Ambil pesan yang layak ditampilkan ke user dari error HTTP (dalam bahasa aktif). */
export function problemMessage(error: unknown, fallback?: string): string {
  const text = GENERIC[currentLang()];
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return text.offline;
    const body = error.error as Problem | null;
    if (body && typeof body === 'object') {
      if (body.detail) return translateMessage(body.detail, body.code);
      if (body.title) return translateMessage(body.title, body.code);
    }
  }
  return fallback ?? text.fallback;
}

/** Ambil `code` bisnis dari error (misal 'STUDENT_LOCKED'), untuk logika khusus di UI. */
export function problemCode(error: unknown): string | null {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    return (error.error as Problem).code ?? null;
  }
  return null;
}
