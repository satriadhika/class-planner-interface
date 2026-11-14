import { Dictionary } from '../../../core/i18n/i18n';

const id = {
  title: 'Kuesioner',
  intro: 'Pantau murid yang sudah dan belum mengirim kuesioner. Kelas baru bisa dibentuk setelah semua murid mengirim.',
  reload: 'Muat ulang',
  submitted: 'Terkirim',
  stillDraft: 'Masih draf',
  notStarted: 'Belum mulai',
  all: 'Semua',
  draft: 'Draf',
  search: 'Cari nama / NIS',
  searchAria: 'Cari murid',
  colStudent: 'Murid',
  colClass: 'Kelas',
  colStatus: 'Status',
  colMajor1: 'Jurusan 1',
  colMajor2: 'Jurusan 2',
  colIpa: 'Minat IPA',
  colIps: 'Minat IPS',
  colSent: 'Dikirim',
  noData: 'Tidak ada data.',
};

const en: typeof id = {
  title: 'Questionnaire',
  intro: 'See which students have and have not submitted the questionnaire. Classes can only be formed once everyone has submitted.',
  reload: 'Reload',
  submitted: 'Submitted',
  stillDraft: 'Still a draft',
  notStarted: 'Not started',
  all: 'All',
  draft: 'Draft',
  search: 'Search name / NIS',
  searchAria: 'Search students',
  colStudent: 'Student',
  colClass: 'Class',
  colStatus: 'Status',
  colMajor1: 'Major 1',
  colMajor2: 'Major 2',
  colIpa: 'IPA interest',
  colIps: 'IPS interest',
  colSent: 'Submitted',
  noData: 'No data.',
};

export const WAKA_KUESIONER_TEXT: Dictionary<typeof id> = { id, en };
