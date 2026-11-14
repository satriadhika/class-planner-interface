import { Dictionary } from '../../../core/i18n/i18n';

const id = {
  title: 'Surat pernyataan',
  intro: 'Cetak atau simpan sebagai PDF, tanda tangani bersama orang tua/wali, lalu serahkan ke sekolah.',
  print: 'Cetak / simpan PDF',
  pending: 'Surat bisa diunduh setelah waka kurikulum menyetujui kelas final.',
  backHome: 'Kembali ke beranda',
  hint: 'Di dialog cetak, pilih tujuan "Simpan sebagai PDF" dan ukuran kertas A4.',
  officialNote: '',
};

const en: typeof id = {
  title: 'Statement letter',
  intro: 'Print it or save it as a PDF, sign it with your parent/guardian, then hand it in to the school.',
  print: 'Print / save PDF',
  pending: 'You can download the letter once the vice principal has approved your final class.',
  backHome: 'Back to home',
  hint: 'In the print dialog, choose "Save as PDF" as the destination and A4 as the paper size.',
  officialNote: 'The letter itself stays in Indonesian because it is an official school document.',
};

export const SURAT_TEXT: Dictionary<typeof id> = { id, en };
