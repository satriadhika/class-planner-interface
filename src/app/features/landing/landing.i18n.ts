import { Dictionary } from '../../core/i18n/i18n';

/** Semua teks halaman depan. Bentuk 'en' wajib sama dengan 'id' (dicek TypeScript). */
export interface LandingText {
  nav: { about: string; majors: string; steps: string; faq: string; signIn: string; dashboard: string; menu: string; home: string };
  hero: {
    label: string;
    of: string;
    prev: string;
    next: string;
    goTo: string;
    signInSchool: string;
    slides: { kicker: string; title: string; text: string; more: string }[];
    mock: { klass: string; yours: string; match: string; forMajor: string; major1: string; major2: string; complete: string; students: string; canChange: string; subjects: string[]; extra: string };
  };
  strip: { label: string; items: { title: string; text: string }[] };
  welcome: { eyebrow: string; title: string; lead: string; seat: string; badge: string; points: { title: string; text: string }[] };
  rumpun: { eyebrow: string; title: string; note: string; more: string; support: string; count: string; etc: string; groups: { name: string; majors: string[]; subjects: string[] }[] };
  steps: {
    eyebrow: string;
    title: string;
    note: string;
    form: { major1: string; major2: string; interest: string };
    start: string;
    stage: string;
    featuredTitle: string;
    featuredText: string;
    items: { title: string; text: string }[];
  };
  facts: { value: string; label: string }[];
  faq: { eyebrow: string; title: string; note: string; items: { q: string; a: string }[] };
  cta: { title: string; text: string; button: string };
  footer: { tagline: string; pages: string; contact: string; contactFallback: string; poweredBy: string };
}

export const LANDING_TEXT: Dictionary<LandingText> = {
  // ================================================================ Indonesia
  id: {
    nav: {
      about: 'Tentang',
      majors: 'Pilihan jurusan',
      steps: 'Tahapan',
      faq: 'Tanya jawab',
      signIn: 'Masuk',
      dashboard: 'Buka dashboard',
      menu: 'Menu',
      home: 'halaman depan',
    },
    hero: {
      label: 'Sorotan',
      of: 'dari',
      prev: 'Slide sebelumnya',
      next: 'Slide berikutnya',
      goTo: 'Ke slide',
      signInSchool: 'Masuk dengan akun sekolah',
      slides: [
        {
          kicker: 'Penjurusan kelas 11',
          title: 'Pilih mapel yang mengantarmu ke jurusan impian',
          text: 'Tulis dua jurusan kuliah incaranmu. Sekolah menyusun kelas dengan mapel yang kamu butuhkan.',
          more: 'Lihat tahapan',
        },
        {
          kicker: 'Kelas yang cocok',
          title: 'Lihat seberapa cocok setiap kelas sebelum memilih',
          text: 'Setiap kelas punya persentase kecocokan dari pilihan jurusan, nilai rapor, dan minatmu.',
          more: 'Pilihan jurusan',
        },
        {
          kicker: 'Adil untuk semua',
          title: 'Jumlah murid rata, pilihanmu tetap diutamakan',
          text: 'Kalau satu kelas terlalu penuh, sistem memindahkan sesedikit mungkin murid ke kelas yang tetap sesuai jurusannya.',
          more: 'Tanya jawab',
        },
      ],
      mock: {
        klass: 'Kelas C',
        yours: '✓ Pilihanmu',
        match: '% cocok denganmu',
        forMajor: 'Untuk',
        major1: 'Kedokteran',
        major2: 'Teknik Mesin',
        complete: 'Lengkap',
        students: 'murid di kelas ini',
        canChange: 'masih bisa ganti',
        subjects: ['Biologi', 'Fisika', 'Kimia', 'Matematika Lanjut'],
        extra: 'Geografi',
      },
    },
    strip: {
      label: 'Ringkasan langkah',
      items: [
        { title: 'Isi kuesioner', text: 'Tulis dua jurusan kuliah incaranmu dan minatmu.' },
        { title: 'Pilih kelas', text: 'Bandingkan persentase kecocokan tiap kelas.' },
        { title: 'Kelas final', text: 'Disetujui sekolah, lalu cetak surat pernyataan.' },
      ],
    },
    welcome: {
      eyebrow: 'Selamat datang',
      title: 'Penjurusan kelas 11 di {school}',
      lead:
        'Di Kurikulum Merdeka, kamu memilih sendiri mapel yang dipelajari di kelas 11 dan 12. Supaya pilihan itu nyambung dengan jurusan kuliah yang kamu incar, kamu menulis cita-citamu, sekolah menyusun kelas, lalu kamu memilih kelas yang paling cocok.',
      seat: 'Kursimu di kelas 11',
      badge: 'mapel pilihan\nsesuai cita-cita',
      points: [
        { title: 'Terarah', text: 'Mapel kelasmu mengikuti kebutuhan jurusan kuliah pilihanmu.' },
        { title: 'Adil', text: 'Jumlah murid tiap kelas dibuat rata, pilihanmu tetap diutamakan.' },
        { title: 'Terbuka', text: 'Kamu bisa lihat seberapa cocok setiap kelas sebelum memilih.' },
      ],
    },
    rumpun: {
      eyebrow: 'Pilihan jurusan',
      title: 'Mau kuliah di bidang apa?',
      note: 'Contoh mapel pilihan yang biasanya dibutuhkan. Daftar lengkap jurusan ada di kuesioner.',
      more: 'dan jurusan lainnya',
      support: 'Mapel pendukung',
      count: 'jurusan',
      etc: ', dan lainnya.',
      groups: [
        { name: 'Kesehatan', majors: ['Kedokteran', 'Farmasi', 'Gizi', 'Keperawatan'], subjects: ['Biologi', 'Kimia'] },
        { name: 'Teknik & sains', majors: ['Teknik Sipil', 'Teknik Mesin', 'Informatika', 'Fisika'], subjects: ['Matematika Lanjut', 'Fisika', 'Informatika'] },
        { name: 'Sosial & hukum', majors: ['Hukum', 'Psikologi', 'Ilmu Komunikasi', 'Hubungan Internasional'], subjects: ['Sosiologi', 'Bahasa Inggris Lanjut'] },
        { name: 'Bisnis & ekonomi', majors: ['Manajemen', 'Akuntansi', 'Ekonomi Pembangunan', 'Bisnis Digital'], subjects: ['Ekonomi', 'Matematika Lanjut'] },
      ],
    },
    steps: {
      eyebrow: 'Tahapan',
      title: 'Dari kuesioner sampai kelas final',
      note: 'Tanggal pastinya diumumkan waka kurikulum dan tampil di dashboard setelah kamu masuk.',
      form: { major1: 'Jurusan pilihan 1', major2: 'Jurusan pilihan 2', interest: 'Minat IPA' },
      start: 'mulai',
      stage: 'tahap',
      featuredTitle: 'Kuesioner minat & jurusan',
      featuredText:
        'Tahap paling penting. Ceritakan dua jurusan kuliah incaranmu dan seberapa besar minatmu pada bidang IPA dan IPS. Dari jawaban seluruh angkatan inilah kelas disusun.',
      items: [
        { title: 'Kelas disusun', text: 'Sekolah menentukan kombinasi mapel tiap kelas dari kebutuhan seluruh angkatan.' },
        { title: 'Pilih kelas', text: 'Bandingkan kecocokan tiap kelas. Pilihan masih bisa diganti dua kali.' },
        { title: 'Pemerataan', text: 'Kelas yang terlalu penuh diratakan, dengan pindahan sesedikit mungkin.' },
        { title: 'Kelas final', text: 'Waka kurikulum memeriksa dan menyetujui pembagian kelas.' },
        { title: 'Surat pernyataan', text: 'Cetak surat, tanda tangani bersama orang tua, serahkan ke sekolah.' },
      ],
    },
    facts: [
      { value: '2', label: 'jurusan kuliah yang bisa kamu tulis' },
      { value: '5', label: 'mapel pilihan di setiap kelas' },
      { value: '2×', label: 'kesempatan mengganti pilihan kelas' },
      { value: '36', label: 'murid paling banyak per kelas' },
    ],
    faq: {
      eyebrow: 'Tanya jawab',
      title: 'Yang sering ditanyakan',
      note: 'Belum terjawab? Tanyakan ke wali kelas atau waka kurikulum.',
      items: [
        {
          q: 'Akun apa yang dipakai untuk masuk?',
          a: 'Akun Google sekolah, misalnya belajar.id. Saat pertama masuk, kamu mengisi kode sekolah, NIS, dan tanggal lahir untuk mengaktifkan akun.',
        },
        {
          q: 'Apakah kelas yang saya pilih langsung final?',
          a: 'Belum. Kalau satu kelas peminatnya terlalu banyak, sistem meratakan jumlah murid. Kamu tetap ditempatkan di kelas yang memuat mapel jurusan pilihan pertamamu.',
        },
        {
          q: 'Bagaimana persentase kecocokan dihitung?',
          a: 'Dari seberapa lengkap mapel untuk jurusan pilihan 1 dan 2 ada di kelas itu, ditambah posisimu di angkatan untuk nilai rapor, minat bakat, dan minat IPA/IPS yang kamu isi di kuesioner.',
        },
        { q: 'Bisakah saya mengganti pilihan kelas?', a: 'Bisa, paling banyak dua kali selama masa pemilihan masih dibuka.' },
        {
          q: 'Kapan saya dapat surat pernyataan?',
          a: 'Setelah waka kurikulum menyetujui kelas final. Surat bisa dicetak atau disimpan sebagai PDF dari dashboard.',
        },
      ],
    },
    cta: {
      title: 'Siap memetakan masa depanmu?',
      text: 'Masuk dengan akun Google sekolah (belajar.id) untuk melihat tahap yang sedang berjalan.',
      button: 'Masuk sekarang',
    },
    footer: {
      tagline: 'Penjurusan kelas 11 yang terarah dan adil',
      pages: 'Halaman',
      contact: 'Hubungi sekolah',
      contactFallback: 'Hubungi tata usaha sekolah.',
      poweredBy: 'Penjurusan dengan',
    },
  },

  // ================================================================ English
  en: {
    nav: {
      about: 'About',
      majors: 'Fields of study',
      steps: 'Steps',
      faq: 'FAQ',
      signIn: 'Sign in',
      dashboard: 'Open dashboard',
      menu: 'Menu',
      home: 'home page',
    },
    hero: {
      label: 'Highlights',
      of: 'of',
      prev: 'Previous slide',
      next: 'Next slide',
      goTo: 'Go to slide',
      signInSchool: 'Sign in with your school account',
      slides: [
        {
          kicker: 'Grade 11 subject selection',
          title: 'Choose subjects that lead to your dream major',
          text: 'Tell us the two university majors you are aiming for. Your school builds classes around the subjects you need.',
          more: 'See the steps',
        },
        {
          kicker: 'Classes that fit',
          title: 'See how well each class fits you before you choose',
          text: 'Every class shows a match score based on your chosen majors, report grades, and interests.',
          more: 'Fields of study',
        },
        {
          kicker: 'Fair for everyone',
          title: 'Balanced class sizes, with your choice put first',
          text: 'If a class gets too full, the system moves as few students as possible, always to a class that still suits their major.',
          more: 'FAQ',
        },
      ],
      mock: {
        klass: 'Class C',
        yours: '✓ Your choice',
        match: '% match for you',
        forMajor: 'For',
        major1: 'Medicine',
        major2: 'Mechanical Eng.',
        complete: 'Complete',
        students: 'students in this class',
        canChange: 'changes left',
        subjects: ['Biology', 'Physics', 'Chemistry', 'Advanced Maths'],
        extra: 'Geography',
      },
    },
    strip: {
      label: 'Steps at a glance',
      items: [
        { title: 'Fill in the questionnaire', text: 'Name your two target majors and your interests.' },
        { title: 'Choose a class', text: 'Compare the match score of every class.' },
        { title: 'Final class', text: 'Approved by the school, then print your statement letter.' },
      ],
    },
    welcome: {
      eyebrow: 'Welcome',
      title: 'Grade 11 subject selection at {school}',
      lead:
        'Under the Merdeka Curriculum, you choose the elective subjects you study in grades 11 and 12. To make sure those choices match the university major you are aiming for, you share your goals, the school builds the classes, and you pick the class that fits you best.',
      seat: 'Your seat in grade 11',
      badge: 'elective subjects\nfor your goals',
      points: [
        { title: 'Focused', text: 'Your class subjects follow what your chosen majors need.' },
        { title: 'Fair', text: 'Class sizes are kept balanced, and your choice comes first.' },
        { title: 'Transparent', text: 'You can see how well each class fits you before you choose.' },
      ],
    },
    rumpun: {
      eyebrow: 'Fields of study',
      title: 'What do you want to study at university?',
      note: 'Examples of the electives usually needed. The full list of majors is in the questionnaire.',
      more: 'and more majors',
      support: 'Supporting subjects',
      count: 'majors',
      etc: ', and more.',
      groups: [
        { name: 'Health', majors: ['Medicine', 'Pharmacy', 'Nutrition', 'Nursing'], subjects: ['Biology', 'Chemistry'] },
        { name: 'Engineering & science', majors: ['Civil Engineering', 'Mechanical Engineering', 'Informatics', 'Physics'], subjects: ['Advanced Maths', 'Physics', 'Informatics'] },
        { name: 'Social sciences & law', majors: ['Law', 'Psychology', 'Communication Studies', 'International Relations'], subjects: ['Sociology', 'Advanced English'] },
        { name: 'Business & economics', majors: ['Management', 'Accounting', 'Development Economics', 'Digital Business'], subjects: ['Economics', 'Advanced Maths'] },
      ],
    },
    steps: {
      eyebrow: 'Steps',
      title: 'From questionnaire to final class',
      note: 'Exact dates are announced by the vice principal for curriculum and shown on your dashboard after you sign in.',
      form: { major1: 'Major choice 1', major2: 'Major choice 2', interest: 'Interest in sciences' },
      start: 'start',
      stage: 'step',
      featuredTitle: 'Interests & majors questionnaire',
      featuredText:
        'The most important step. Tell us your two target majors and how interested you are in science and social studies. Classes are built from the answers of the whole year group.',
      items: [
        { title: 'Classes are set up', text: 'The school decides the subject mix of each class from what the whole year group needs.' },
        { title: 'Choose a class', text: 'Compare how well each class fits you. You can change your choice twice.' },
        { title: 'Balancing', text: 'Classes that are too full are balanced, moving as few students as possible.' },
        { title: 'Final class', text: 'The vice principal for curriculum reviews and approves the class list.' },
        { title: 'Statement letter', text: 'Print the letter, sign it with your parents, and hand it in to the school.' },
      ],
    },
    facts: [
      { value: '2', label: 'university majors you can list' },
      { value: '5', label: 'elective subjects in every class' },
      { value: '2×', label: 'chances to change your class choice' },
      { value: '36', label: 'students per class at most' },
    ],
    faq: {
      eyebrow: 'FAQ',
      title: 'Frequently asked questions',
      note: 'Still unsure? Ask your homeroom teacher or the vice principal for curriculum.',
      items: [
        {
          q: 'Which account do I use to sign in?',
          a: 'Your school Google account, for example belajar.id. The first time you sign in, enter your school code, student number (NIS), and date of birth to activate your account.',
        },
        {
          q: 'Is the class I choose final straight away?',
          a: 'Not yet. If too many students choose one class, the system balances the numbers. You will still be placed in a class that has the subjects for your first-choice major.',
        },
        {
          q: 'How is the match score calculated?',
          a: 'From how many of the subjects for your first and second majors the class offers, plus where you stand in your year group for report grades, aptitude, and the science/social studies interest you gave in the questionnaire.',
        },
        { q: 'Can I change my class choice?', a: 'Yes, up to twice while class selection is still open.' },
        {
          q: 'When do I get my statement letter?',
          a: 'Once the vice principal for curriculum approves the final classes. You can print it or save it as a PDF from your dashboard.',
        },
      ],
    },
    cta: {
      title: 'Ready to plan your future?',
      text: 'Sign in with your school Google account (belajar.id) to see which step is open now.',
      button: 'Sign in now',
    },
    footer: {
      tagline: 'Fair, well-guided grade 11 subject selection',
      pages: 'Pages',
      contact: 'Contact the school',
      contactFallback: 'Contact the school office.',
      poweredBy: 'Subject selection with',
    },
  },
};
