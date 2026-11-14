import { Dictionary, currentLang } from '../../core/i18n/i18n';

/** Label tampilan yang dipakai di banyak halaman. */

export const CYCLE_STATUS_TEXT: Dictionary<Record<string, string>> = {
  id: {
    DRAFT: 'Draf',
    SURVEY_OPEN: 'Kuesioner dibuka',
    SURVEY_CLOSED: 'Kuesioner ditutup',
    CLASSES_GENERATED: 'Kelas disimpan',
    SELECTION_OPEN: 'Pemilihan kelas dibuka',
    SELECTION_CLOSED: 'Pemilihan kelas ditutup',
    REBALANCED: 'Pemerataan selesai',
    FINALIZED: 'Disetujui (final)',
  },
  en: {
    DRAFT: 'Draft',
    SURVEY_OPEN: 'Questionnaire open',
    SURVEY_CLOSED: 'Questionnaire closed',
    CLASSES_GENERATED: 'Classes saved',
    SELECTION_OPEN: 'Class selection open',
    SELECTION_CLOSED: 'Class selection closed',
    REBALANCED: 'Balancing done',
    FINALIZED: 'Approved (final)',
  },
};

/** Urutan status untuk stepper. */
export const CYCLE_FLOW = [
  'DRAFT',
  'SURVEY_OPEN',
  'SURVEY_CLOSED',
  'CLASSES_GENERATED',
  'SELECTION_OPEN',
  'SELECTION_CLOSED',
  'REBALANCED',
  'FINALIZED',
] as const;

export const TRANSITION_TEXT: Dictionary<Record<string, string>> = {
  id: {
    SURVEY_OPEN: 'Buka kuesioner',
    SURVEY_CLOSED: 'Tutup kuesioner',
    SELECTION_OPEN: 'Buka pemilihan kelas',
    SELECTION_CLOSED: 'Tutup pemilihan kelas',
  },
  en: {
    SURVEY_OPEN: 'Open questionnaire',
    SURVEY_CLOSED: 'Close questionnaire',
    SELECTION_OPEN: 'Open class selection',
    SELECTION_CLOSED: 'Close class selection',
  },
};

/** Tingkat kecocokan kelas dengan jurusan 1 (J1) dan jurusan 2 (J2). */
export const TIER_TEXT: Dictionary<Record<number, string>> = {
  id: {
    1: 'J1 & J2 lengkap',
    2: 'J1 lengkap, J2 sebagian',
    3: 'J1 sebagian, J2 ada',
    4: 'J1 lengkap, J2 tidak ada',
    5: 'J1 sebagian, J2 tidak ada',
  },
  en: {
    1: 'M1 & M2 complete',
    2: 'M1 complete, M2 partial',
    3: 'M1 partial, M2 present',
    4: 'M1 complete, no M2',
    5: 'M1 partial, no M2',
  },
};

export const CLASS_TYPE_TEXT: Dictionary<Record<string, string>> = {
  id: { FULL_IPA: 'Full IPA', FULL_IPS: 'Full IPS', CAMPURAN: 'Campuran' },
  en: { FULL_IPA: 'All science (IPA)', FULL_IPS: 'All social (IPS)', CAMPURAN: 'Mixed' },
};

export const SOURCE_TEXT: Dictionary<Record<string, string>> = {
  id: { CHOICE: 'Sesuai pilihan', REBALANCE: 'Pemerataan', MANUAL: 'Dipindah waka' },
  en: { CHOICE: 'Own choice', REBALANCE: 'Balancing', MANUAL: 'Moved by vice principal' },
};

const LOCALE = { id: 'id-ID', en: 'en-GB' } as const;

/** Tanggal + jam singkat sesuai bahasa aktif; kosong → "-". */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Intl.DateTimeFormat(LOCALE[currentLang()], { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

/** Tanggal panjang sesuai bahasa aktif, misalnya "14 November 2026"; kosong → "-". */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Intl.DateTimeFormat(LOCALE[currentLang()], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

/** ISO dari backend → nilai <input type="datetime-local"> (waktu lokal). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Nilai <input type="datetime-local"> → ISO dengan zona waktu, atau null. */
export function fromLocalInput(value: string | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}
