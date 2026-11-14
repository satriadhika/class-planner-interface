import { Dictionary } from '../../../core/i18n/i18n';
import { StageKey, StageStatus } from '../murid-progress.service';

export interface MuridHomeText {
  defaultCycle: string;
  progress: string;
  steps: string;
  retry: string;
  loadError: string;
  loading: string;
  noCycleTitle: string;
  noCycleText: string;
  nextStep: string;
  done: string;
  allDone: string;
  schedule: string;
  surveyClose: string;
  selectionClose: string;
  notSet: string;
  stepsTitle: string;
  myClass: string;
  activityTitle: string;
  noActivity: string;
  quickMenu: string;
  helpBefore: string;
  helpLink: string;
  overdue: string;
  today: string;
  daysLeft: string;
  status: Record<StageStatus, string>;
  stages: Record<StageKey, { label: string; description: string; cta: string }>;
  activity: Record<string, string>;
}

export const MURID_HOME_TEXT: Dictionary<MuridHomeText> = {
  id: {
    defaultCycle: 'Penjurusan kelas 11',
    progress: 'Progres penjurusan',
    steps: 'tahap',
    retry: 'Coba lagi',
    loadError: 'Progres penjurusan gagal dimuat. Coba muat ulang halaman.',
    loading: 'Memuat progres',
    noCycleTitle: 'Periode penjurusan belum dibuka.',
    noCycleText: 'Waka kurikulum akan membuka kuesioner untuk angkatanmu. Cek halaman ini lagi nanti.',
    nextStep: 'Langkah berikutnya',
    done: 'selesai',
    allDone: 'Semua tahap selesai. Kelas finalmu sudah ditetapkan.',
    schedule: 'Jadwal penting',
    surveyClose: 'Kuesioner ditutup',
    selectionClose: 'Pemilihan kelas ditutup',
    notSet: 'Belum ditentukan',
    stepsTitle: 'Tahap penjurusan',
    myClass: 'Kelas saya',
    activityTitle: 'Aktivitas terakhir',
    noActivity: 'Belum ada aktivitas.',
    quickMenu: 'Menu cepat',
    helpBefore: 'Ada kendala akun, data, atau pilihan kelas? Tanyakan ke waka kurikulum sekolahmu, atau baca',
    helpLink: 'panduan aplikasi',
    overdue: 'Sudah lewat',
    today: 'Hari ini',
    daysLeft: '{n} hari lagi',
    status: {
      done: 'Selesai',
      current: 'Sedang berjalan',
      locked: 'Belum dibuka',
      missed: 'Terlewat, hubungi waka kurikulum',
    },
    stages: {
      kuesioner: {
        label: 'Isi kuesioner',
        description: 'Tulis cita-citamu dan pilih jurusan kuliah 1 dan 2 yang kamu minati.',
        cta: 'Isi kuesioner',
      },
      'pilih-kelas': {
        label: 'Pilih kelas',
        description: 'Bandingkan persentase kecocokan setiap kelas, lalu pilih yang paling sesuai.',
        cta: 'Pilih kelas',
      },
      'kelas-final': {
        label: 'Kelas final',
        description: 'Kelasmu ditetapkan setelah pemerataan dan persetujuan waka kurikulum.',
        cta: 'Lihat kelas',
      },
      surat: {
        label: 'Surat pernyataan',
        description: 'Surat pernyataan bisa diunduh setelah waka menyetujui kelasmu.',
        cta: 'Unduh surat',
      },
    },
    activity: {
      QUESTIONNAIRE_OPENED: 'Membuka kuesioner',
      QUESTIONNAIRE_DRAFT_SAVED: 'Menyimpan draf kuesioner',
      QUESTIONNAIRE_SUBMITTED: 'Mengirim kuesioner',
      CLASS_CHOSEN: 'Memilih kelas',
      CLASS_CHANGED: 'Mengganti pilihan kelas',
      PLACEMENT_REBALANCED: 'Ditempatkan lewat pemerataan',
      PLACEMENT_MOVED: 'Dipindahkan oleh waka kurikulum',
      CLASS_FINALIZED: 'Kelas final disetujui',
    },
  },
  en: {
    defaultCycle: 'Grade 11 subject selection',
    progress: 'Selection progress',
    steps: 'steps',
    retry: 'Try again',
    loadError: 'Could not load your progress. Please reload the page.',
    loading: 'Loading progress',
    noCycleTitle: 'Subject selection has not opened yet.',
    noCycleText: 'The vice principal for curriculum will open the questionnaire for your year group. Check back here later.',
    nextStep: 'Next step',
    done: 'done',
    allDone: 'All steps are done. Your final class has been set.',
    schedule: 'Key dates',
    surveyClose: 'Questionnaire closes',
    selectionClose: 'Class selection closes',
    notSet: 'Not set yet',
    stepsTitle: 'Selection steps',
    myClass: 'My class',
    activityTitle: 'Recent activity',
    noActivity: 'No activity yet.',
    quickMenu: 'Quick links',
    helpBefore: 'Having trouble with your account, data, or class choice? Ask the vice principal for curriculum at your school, or read the',
    helpLink: 'user guide',
    overdue: 'Closed',
    today: 'Today',
    daysLeft: '{n} days left',
    status: {
      done: 'Done',
      current: 'In progress',
      locked: 'Not open yet',
      missed: 'Missed, contact the vice principal',
    },
    stages: {
      kuesioner: {
        label: 'Fill in the questionnaire',
        description: 'Share your goals and choose the university majors you are interested in as choice 1 and 2.',
        cta: 'Open questionnaire',
      },
      'pilih-kelas': {
        label: 'Choose a class',
        description: 'Compare the match score of each class, then choose the one that fits you best.',
        cta: 'Choose a class',
      },
      'kelas-final': {
        label: 'Final class',
        description: 'Your class is set after balancing and approval by the vice principal for curriculum.',
        cta: 'View class',
      },
      surat: {
        label: 'Statement letter',
        description: 'You can download the statement letter once your class has been approved.',
        cta: 'Download letter',
      },
    },
    activity: {
      QUESTIONNAIRE_OPENED: 'Opened the questionnaire',
      QUESTIONNAIRE_DRAFT_SAVED: 'Saved a questionnaire draft',
      QUESTIONNAIRE_SUBMITTED: 'Submitted the questionnaire',
      CLASS_CHOSEN: 'Chose a class',
      CLASS_CHANGED: 'Changed class choice',
      PLACEMENT_REBALANCED: 'Placed through balancing',
      PLACEMENT_MOVED: 'Moved by the vice principal',
      CLASS_FINALIZED: 'Final class approved',
    },
  },
};
