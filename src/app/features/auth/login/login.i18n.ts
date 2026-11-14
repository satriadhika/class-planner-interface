import { Dictionary } from '../../../core/i18n/i18n';

export interface LoginText {
  close: string;
  signinEyebrow: string;
  signinTitle: string;
  signinDesc: string;
  activateEyebrow: string;
  activateTitle: string;
  activateDesc: string;
  processing: string;
  divider: string;
  usePassword: string;
  schoolCode: string;
  schoolCodeHint: string;
  username: string;
  password: string;
  signIn: string;
  back: string;
  studentNumber: string;
  birthDate: string;
  required: string;
  activate: string;
  otherGoogle: string;
  helpLead: string;
  helpStrong: string;
  googleUnavailable: string;
  googleExpired: string;
  failed: string;
  schoolCodeOptional: string;
  iAm: string;
  asStudent: string;
  asTeacher: string;
  activateDescTeacher: string;
  teacherCode: string;
  teacherCodeHint: string;
  register: string;
  pendingEyebrow: string;
  pendingTitle: string;
  pendingText: string;
  pendingTextSchool: string;
  pendingBack: string;
  /** Pesan untuk kode error backend (dipakai di bahasa Inggris; backend menulis pesan dalam bahasa Indonesia). */
  codes: Record<string, string>;
}

export const LOGIN_TEXT: Dictionary<LoginText> = {
  id: {
    close: 'Tutup',
    signinEyebrow: 'Akses aman tanpa password',
    signinTitle: 'Masuk ke Portal',
    signinDesc: 'Gunakan akun Google yang terdaftar di {school}, misalnya akun belajar.id.',
    activateEyebrow: 'Login pertama',
    activateTitle: 'Aktifkan Akunmu',
    activateDesc: 'Cocokkan akun Google ini dengan data muridmu di sekolah. Cukup sekali.',
    processing: 'Memproses...',
    divider: 'atau gunakan akun sekolah',
    usePassword: 'Pakai username & password',
    schoolCode: 'Kode sekolah',
    schoolCodeHint: 'Didapat dari waka sekolah',
    username: 'Username',
    password: 'Password',
    signIn: 'Masuk',
    back: 'Kembali',
    studentNumber: 'NIS',
    birthDate: 'Tanggal lahir',
    required: 'wajib diisi',
    activate: 'Aktifkan & Masuk',
    otherGoogle: 'Gunakan akun Google lain',
    helpLead: 'Belum bisa masuk?',
    helpStrong: 'Hubungi waka kurikulum sekolahmu.',
    googleUnavailable: 'Login Google sedang tidak tersedia. Gunakan username sekolah.',
    googleExpired: 'Sesi Google habis. Silakan login dengan Google lagi.',
    failed: 'Login gagal. Periksa kembali data kamu.',
    schoolCodeOptional: 'Kosongkan kalau kamu admin Class Planner.',
    iAm: 'Saya',
    asStudent: 'Murid',
    asTeacher: 'Guru',
    activateDescTeacher: 'Daftarkan akun Google ini sebagai guru. Waka kurikulum akan menyetujui pendaftaranmu.',
    teacherCode: 'NIP / kode guru',
    teacherCodeHint: 'Supaya waka bisa mengenali kamu',
    register: 'Kirim pendaftaran',
    pendingEyebrow: 'Pendaftaran guru',
    pendingTitle: 'Menunggu persetujuan',
    pendingText: 'Akun guru kamu sedang menunggu persetujuan waka kurikulum. Setelah disetujui, masuk lagi dengan akun Google yang sama.',
    pendingTextSchool: 'Pendaftaran ke {school} sudah terkirim. Setelah waka kurikulum menyetujui, masuk lagi dengan akun Google yang sama.',
    pendingBack: 'Kembali ke halaman masuk',
    codes: {},
  },
  en: {
    close: 'Close',
    signinEyebrow: 'Secure access, no password needed',
    signinTitle: 'Sign in to the portal',
    signinDesc: 'Use the Google account registered at {school}, for example your belajar.id account.',
    activateEyebrow: 'First sign-in',
    activateTitle: 'Activate your account',
    activateDesc: 'Link this Google account to your student record at school. You only need to do this once.',
    processing: 'Processing...',
    divider: 'or use a school account',
    usePassword: 'Use username & password',
    schoolCode: 'School code',
    schoolCodeHint: 'Ask your school for this code',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign in',
    back: 'Back',
    studentNumber: 'Student number (NIS)',
    birthDate: 'Date of birth',
    required: 'is required',
    activate: 'Activate & sign in',
    otherGoogle: 'Use another Google account',
    helpLead: "Can't sign in?",
    helpStrong: 'Contact the vice principal for curriculum at your school.',
    googleUnavailable: 'Google sign-in is unavailable right now. Please use your school username.',
    googleExpired: 'Your Google session has expired. Please sign in with Google again.',
    failed: 'Sign-in failed. Please check your details.',
    schoolCodeOptional: 'Leave empty if you are a Class Planner admin.',
    iAm: 'I am a',
    asStudent: 'Student',
    asTeacher: 'Teacher',
    activateDescTeacher: 'Register this Google account as a teacher. The vice principal for curriculum will approve your registration.',
    teacherCode: 'Teacher ID (NIP) / code',
    teacherCodeHint: 'So the vice principal can recognise you',
    register: 'Send registration',
    pendingEyebrow: 'Teacher registration',
    pendingTitle: 'Waiting for approval',
    pendingText: 'Your teacher account is waiting for approval by the vice principal for curriculum. Once approved, sign in again with the same Google account.',
    pendingTextSchool: 'Your registration to {school} has been sent. Once the vice principal approves it, sign in again with the same Google account.',
    pendingBack: 'Back to sign-in',
    codes: {
      ACCOUNT_PENDING: 'Your teacher account is waiting for approval by the vice principal for curriculum.',
      SCHOOL_DISABLED: 'Your school has been deactivated. Contact the Class Planner admin.',
      SCHOOL_CODE_NOT_FOUND: 'School code not found. Ask the vice principal for curriculum.',
      ACCOUNT_EXISTS: 'This email is already registered. Please sign in with Google.',
      TOO_MANY_ATTEMPTS: 'Too many failed attempts. Try again in an hour or contact your school.',
      AUTH_FAILED: 'Sign-in failed. Check your school code, username, and password, or sign in with Google again.',
      STUDENT_NOT_MATCHED: 'No student matches that school code, student number, and date of birth.',
      STUDENT_ALREADY_CLAIMED: 'This student record is already linked to another Google account. Contact your school.',
    },
  },
};
