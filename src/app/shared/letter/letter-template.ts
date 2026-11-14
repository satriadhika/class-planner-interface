/**
 * Isi surat pernyataan yang bisa diubah waka. Disimpan di backend sebagai JSON (school.letterTemplate).
 *
 * Teks boleh memuat:
 *  - isian otomatis dalam kurung kurawal, misalnya {nama} atau {kelas} (daftar di LETTER_FIELDS)
 *  - **teks tebal** dengan dua bintang
 *  - baris baru (Enter)
 * Teks selalu ditampilkan sebagai teks biasa, bukan HTML.
 */
export interface LetterTemplate {
  title: string;
  subtitle: string;
  opening: string;
  body: string;
  closing: string;
  /** Kota di tanggal surat; kosong = ambil dari bagian terakhir alamat sekolah */
  city: string;
  signParent: string;
  signStudent: string;
  signPrincipal: string;
  showParent: boolean;
  showPrincipal: boolean;
}

export const DEFAULT_LETTER: LetterTemplate = {
  title: 'SURAT PERNYATAAN\nPEMILIHAN MATA PELAJARAN PILIHAN',
  subtitle: 'Tahun Ajaran {tahun_ajaran}',
  opening: 'Yang bertanda tangan di bawah ini:',
  body: 'menyatakan bersedia mengikuti pembelajaran di **Kelas {kelas}** pada kelas 11 dengan mata pelajaran pilihan sebagai berikut:',
  closing:
    'Mata pelajaran pilihan tersebut akan diikuti sampai kelas 12. Surat pernyataan ini dibuat dengan sadar dan atas persetujuan orang tua/wali.',
  city: '',
  signParent: 'Mengetahui,\nOrang tua/wali',
  signStudent: 'Murid',
  signPrincipal: 'Mengetahui,\nKepala Sekolah',
  showParent: true,
  showPrincipal: true,
};

/** Isian otomatis yang bisa dipakai di teks surat. */
export const LETTER_FIELDS = [
  'nama',
  'nis',
  'nisn',
  'kelas_asal',
  'kelas',
  'tahun_ajaran',
  'jurusan1',
  'jurusan2',
  'sekolah',
  'kepala_sekolah',
] as const;

export type LetterField = (typeof LETTER_FIELDS)[number];
export type LetterValues = Record<LetterField, string>;

/** JSON dari backend → template lengkap. Field yang hilang atau salah tipe diganti isi bawaan. */
export function parseLetter(json: string | null | undefined): LetterTemplate {
  if (!json) return { ...DEFAULT_LETTER };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ...DEFAULT_LETTER };
  }
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_LETTER };
  const r = raw as Record<string, unknown>;
  const out = { ...DEFAULT_LETTER };
  for (const key of Object.keys(DEFAULT_LETTER) as (keyof LetterTemplate)[]) {
    const def = DEFAULT_LETTER[key];
    if (typeof r[key] === typeof def) (out as Record<string, unknown>)[key] = r[key];
  }
  return out;
}

/** Template → JSON untuk disimpan. Kalau sama persis dengan bawaan, simpan null. */
export function serializeLetter(t: LetterTemplate): string | null {
  const same = (Object.keys(DEFAULT_LETTER) as (keyof LetterTemplate)[]).every((k) => t[k] === DEFAULT_LETTER[k]);
  return same ? null : JSON.stringify(t);
}

/** Satu potong teks hasil isian; bold = di dalam **...**. */
export interface Segment {
  text: string;
  bold: boolean;
}

/** Isi {isian}, lalu pecah per baris dan per bagian tebal. */
export function renderLetterText(text: string, values: LetterValues): Segment[][] {
  const filled = text.replace(/\{([a-z_0-9]+)\}/g, (m, key: string) =>
    key in values ? values[key as LetterField] : m,
  );
  return filled.split('\n').map((line) =>
    line
      .split(/\*\*/)
      .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
      .filter((s) => s.text !== ''),
  );
}
