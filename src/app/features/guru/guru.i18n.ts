import { Dictionary } from '../../core/i18n/i18n';

const id = {
  role: 'Guru',
  cycleStatus: 'Status penjurusan',
  noCycle: 'Belum ada siklus',
  flowTitle: 'Tahap penjurusan',
  noCycleText: 'Waka kurikulum belum membuat siklus penjurusan. Halaman ini akan menampilkan perkembangannya.',
  resultsTitle: 'Hasil penjurusan',
  resultsText: 'Lihat kelas 11, kombinasi mapel tiap kelas, dan daftar murid per kelas. Daftar kelas bisa dicetak.',
  open: 'Lihat hasil',
  accessTitle: 'Akses guru',
  accessText: 'Akun guru hanya bisa melihat data. Perubahan kelas atau penempatan murid dilakukan oleh waka kurikulum.',
  stats: 'Ringkasan',
  students: 'Murid angkatan',
  submitted: 'Kuesioner terkirim',
  classes: 'Kelas',
  placed: 'Ditempatkan',
  resultsIntro: 'Kelas 11 hasil penjurusan dan daftar muridnya. Data ini baca-saja.',
};

const en: typeof id = {
  role: 'Teacher',
  cycleStatus: 'Selection status',
  noCycle: 'No cycle yet',
  flowTitle: 'Selection steps',
  noCycleText: 'The vice principal for curriculum has not created a selection cycle yet. This page will show its progress.',
  resultsTitle: 'Selection results',
  resultsText: 'See the grade 11 classes, the subject combination of each class, and the students in each class. Class lists can be printed.',
  open: 'View results',
  accessTitle: 'Teacher access',
  accessText: 'Teacher accounts are view-only. Changes to classes or student placement are made by the vice principal for curriculum.',
  stats: 'Overview',
  students: 'Students in year group',
  submitted: 'Questionnaires submitted',
  classes: 'Classes',
  placed: 'Placed',
  resultsIntro: 'Grade 11 classes from subject selection and their student lists. This data is view-only.',
};

export const GURU_TEXT: Dictionary<typeof id> = { id, en };
