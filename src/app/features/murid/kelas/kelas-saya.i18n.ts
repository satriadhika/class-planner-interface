import { Dictionary } from '../../../core/i18n/i18n';

const id = {
  title: 'Kelas saya',
  intro: 'Kelas 11 yang sudah ditetapkan dan disetujui waka kurikulum.',
  pending:
    'Kelas final belum disetujui. Setelah pemilihan kelas ditutup, waka kurikulum meratakan jumlah murid per kelas lalu menyetujui hasilnya.',
  backHome: 'Kembali ke beranda',
  academicYear: 'Tahun ajaran',
  classPrefix: 'Kelas',
  match: 'kecocokan',
  tierPrefix: 'P',
  classSize: 'murid di kelas ini',
  approved: 'Disetujui {date}.',
  viewLetter: 'Lihat surat pernyataan',
  source: {
    CHOICE: 'Sesuai kelas yang kamu pilih.',
    REBALANCE: 'Ditempatkan lewat pemerataan supaya jumlah murid tiap kelas seimbang.',
    MANUAL: 'Ditetapkan oleh waka kurikulum.',
  } as Record<string, string>,
};

const en: typeof id = {
  title: 'My class',
  intro: 'Your grade 11 class, set and approved by the vice principal for curriculum.',
  pending:
    'Your final class has not been approved yet. After class selection closes, the vice principal balances the class sizes and then approves the result.',
  backHome: 'Back to home',
  academicYear: 'Academic year',
  classPrefix: 'Class',
  match: 'match',
  tierPrefix: 'P',
  classSize: 'students in this class',
  approved: 'Approved {date}.',
  viewLetter: 'View statement letter',
  source: {
    CHOICE: 'This is the class you chose.',
    REBALANCE: 'Placed through balancing so every class has a similar number of students.',
    MANUAL: 'Assigned by the vice principal for curriculum.',
  },
};

export const KELAS_SAYA_TEXT: Dictionary<typeof id> = { id, en };
