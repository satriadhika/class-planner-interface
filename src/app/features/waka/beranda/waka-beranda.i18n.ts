import { Dictionary } from '../../../core/i18n/i18n';
import { IconName } from '../../../shared/icon/icon';

export interface NextStep {
  title: string;
  text: string;
  link: string;
  cta: string;
  icon: IconName;
}

export interface WakaHomeText {
  role: string;
  defaultCycle: string;
  cycleStatus: string;
  cohort: string;
  submitted: string;
  chosen: string;
  placed: string;
  nextStep: string;
  manageCycle: string;
  survey: string;
  monitor: string;
  sent: string;
  legendSent: string;
  legendDraft: string;
  legendNotStarted: string;
  dataTitle: string;
  students: string;
  subjects: string;
  grades: string;
  letterhead: string;
  scheduleTitle: string;
  surveyClose: string;
  selectionClose: string;
  academicYear: string;
  capacity: string;
  capacityValue: string;
  classes: string;
  notSet: string;
  emptyBefore: string;
  emptyLink: string;
  pendingTeachers: string;
  reviewTeachers: string;
  next: Record<string, NextStep>;
}

const LINKS = {
  DRAFT: ['/waka/siklus', 'repeat'],
  SURVEY_OPEN: ['/waka/kuesioner', 'clipboard'],
  SURVEY_CLOSED: ['/waka/kelas', 'layers'],
  CLASSES_GENERATED: ['/waka/kelas', 'layers'],
  SELECTION_OPEN: ['/waka/penempatan', 'shuffle'],
  SELECTION_CLOSED: ['/waka/penempatan', 'shuffle'],
  REBALANCED: ['/waka/penempatan', 'badge-check'],
  FINALIZED: ['/waka/penempatan', 'award'],
} as const satisfies Record<string, readonly [string, IconName]>;

type Copy = Record<keyof typeof LINKS, [title: string, text: string, cta: string]>;

function build(copy: Copy): Record<string, NextStep> {
  const out: Record<string, NextStep> = {};
  for (const key of Object.keys(LINKS) as (keyof typeof LINKS)[]) {
    const [link, icon] = LINKS[key];
    const [title, text, cta] = copy[key];
    out[key] = { title, text, cta, link, icon };
  }
  return out;
}

export const WAKA_HOME_TEXT: Dictionary<WakaHomeText> = {
  id: {
    role: 'Waka kurikulum',
    defaultCycle: 'Penjurusan kelas 11',
    cycleStatus: 'Status siklus',
    cohort: 'Murid angkatan {year}',
    submitted: 'Kuesioner terkirim',
    chosen: 'Sudah memilih kelas',
    placed: 'Ditempatkan',
    nextStep: 'Langkah berikutnya',
    manageCycle: 'Atur siklus',
    survey: 'Kuesioner murid',
    monitor: 'Pantau',
    sent: 'terkirim',
    legendSent: 'Terkirim',
    legendDraft: 'Draf',
    legendNotStarted: 'Belum mulai',
    dataTitle: 'Kelengkapan data',
    students: 'Data murid',
    subjects: 'Mapel & jurusan',
    grades: 'Nilai & minat bakat',
    letterhead: 'Kop surat sekolah',
    scheduleTitle: 'Jadwal & kapasitas',
    surveyClose: 'Kuesioner ditutup',
    selectionClose: 'Pemilihan kelas ditutup',
    academicYear: 'Tahun ajaran',
    capacity: 'Kapasitas kelas',
    capacityValue: 'maks {n} murid',
    classes: '{n} kelas',
    notSet: 'Belum diatur',
    emptyBefore: 'Belum ada siklus penjurusan.',
    emptyLink: 'Buat siklus pertama',
    pendingTeachers: '{n} guru menunggu persetujuan akun.',
    reviewTeachers: 'Tinjau di Data guru',
    next: build({
      DRAFT: ['Siapkan siklus', 'Lengkapi data murid, mapel, jurusan, dan nilai, lalu buka kuesioner.', 'Atur siklus'],
      SURVEY_OPEN: ['Kuesioner sedang berjalan', 'Pantau murid yang belum mengirim. Kuesioner bisa ditutup setelah semua murid mengirim.', 'Pantau kuesioner'],
      SURVEY_CLOSED: ['Bentuk kelas', 'Jalankan simulasi kombinasi mapel per kelas, lalu simpan yang paling pas.', 'Simulasi kelas'],
      CLASSES_GENERATED: ['Buka pemilihan kelas', 'Kelas sudah disimpan. Buka pemilihan supaya murid bisa memilih kelasnya.', 'Lihat kelas'],
      SELECTION_OPEN: ['Murid sedang memilih kelas', 'Pantau jumlah murid yang sudah memilih, lalu tutup pemilihan.', 'Pantau pemilihan'],
      SELECTION_CLOSED: ['Jalankan pemerataan', 'Sistem memindahkan murid dari kelas yang kelebihan dengan tetap menjaga kecocokan.', 'Pemerataan'],
      REBALANCED: ['Tinjau & setujui', 'Periksa hasil penempatan, pindahkan murid secara manual bila perlu, lalu setujui.', 'Tinjau penempatan'],
      FINALIZED: ['Penjurusan selesai', 'Hasil sudah final. Murid bisa melihat kelas dan mengunduh surat pernyataan.', 'Lihat hasil'],
    }),
  },
  en: {
    role: 'Vice principal (curriculum)',
    defaultCycle: 'Grade 11 subject selection',
    cycleStatus: 'Cycle status',
    cohort: 'Students, class of {year}',
    submitted: 'Questionnaires submitted',
    chosen: 'Chose a class',
    placed: 'Placed',
    nextStep: 'Next step',
    manageCycle: 'Manage cycle',
    survey: 'Student questionnaire',
    monitor: 'Monitor',
    sent: 'submitted',
    legendSent: 'Submitted',
    legendDraft: 'Draft',
    legendNotStarted: 'Not started',
    dataTitle: 'Data checklist',
    students: 'Students',
    subjects: 'Subjects & majors',
    grades: 'Grades & aptitude',
    letterhead: 'School letterhead',
    scheduleTitle: 'Schedule & capacity',
    surveyClose: 'Questionnaire closes',
    selectionClose: 'Class selection closes',
    academicYear: 'Academic year',
    capacity: 'Class capacity',
    capacityValue: 'max {n} students',
    classes: '{n} classes',
    notSet: 'Not set',
    emptyBefore: 'There is no selection cycle yet.',
    emptyLink: 'Create the first cycle',
    pendingTeachers: '{n} teacher(s) waiting for account approval.',
    reviewTeachers: 'Review in Teachers',
    next: build({
      DRAFT: ['Prepare the cycle', 'Complete student, subject, major, and grade data, then open the questionnaire.', 'Manage cycle'],
      SURVEY_OPEN: ['Questionnaire in progress', 'Keep an eye on students who have not submitted. You can close the questionnaire once everyone has.', 'Monitor questionnaire'],
      SURVEY_CLOSED: ['Form the classes', 'Simulate subject combinations per class, then save the best fit.', 'Simulate classes'],
      CLASSES_GENERATED: ['Open class selection', 'Classes are saved. Open selection so students can choose their class.', 'View classes'],
      SELECTION_OPEN: ['Students are choosing classes', 'Track how many students have chosen, then close selection.', 'Monitor selection'],
      SELECTION_CLOSED: ['Run balancing', 'The system moves students out of over-full classes while keeping their match as high as possible.', 'Balancing'],
      REBALANCED: ['Review & approve', 'Check the placements, move students manually if needed, then approve.', 'Review placements'],
      FINALIZED: ['Selection complete', 'Results are final. Students can view their class and download the statement letter.', 'View results'],
    }),
  },
};
