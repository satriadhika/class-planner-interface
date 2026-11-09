/** Label tampilan yang dipakai di banyak halaman. */

export const CYCLE_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draf',
  SURVEY_OPEN: 'Kuesioner dibuka',
  SURVEY_CLOSED: 'Kuesioner ditutup',
  CLASSES_GENERATED: 'Kelas disimpan',
  SELECTION_OPEN: 'Pemilihan kelas dibuka',
  SELECTION_CLOSED: 'Pemilihan kelas ditutup',
  REBALANCED: 'Pemerataan selesai',
  FINALIZED: 'Disetujui (final)',
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

export const TRANSITION_LABEL: Record<string, string> = {
  SURVEY_OPEN: 'Buka kuesioner',
  SURVEY_CLOSED: 'Tutup kuesioner',
  SELECTION_OPEN: 'Buka pemilihan kelas',
  SELECTION_CLOSED: 'Tutup pemilihan kelas',
};

export const TIER_LABEL: Record<number, string> = {
  1: 'J1 & J2 lengkap',
  2: 'J1 lengkap, J2 sebagian',
  3: 'J1 sebagian, J2 ada',
  4: 'J1 lengkap, J2 tidak ada',
  5: 'J1 sebagian, J2 tidak ada',
};

export const CLASS_TYPE_LABEL: Record<string, string> = {
  FULL_IPA: 'Full IPA',
  FULL_IPS: 'Full IPS',
  CAMPURAN: 'Campuran',
};

export const SOURCE_LABEL: Record<string, string> = {
  CHOICE: 'Sesuai pilihan',
  REBALANCE: 'Pemerataan',
  MANUAL: 'Dipindah waka',
};

const DATE_TIME = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const DATE = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export function fmtDateTime(iso: string | null | undefined): string {
  return iso ? DATE_TIME.format(new Date(iso)) : '-';
}

export function fmtDate(iso: string | null | undefined): string {
  return iso ? DATE.format(new Date(iso)) : '-';
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
