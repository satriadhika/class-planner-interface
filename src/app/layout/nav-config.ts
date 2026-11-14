import { Role } from '../core/auth/auth.models';
import { Dictionary, Lang } from '../core/i18n/i18n';
import { StageKey } from '../features/murid/murid-progress.service';
import { IconName } from '../shared/icon/icon';

/** Teks menu dalam dua bahasa. */
export type Label = Record<Lang, string>;

export interface NavItem {
  label: Label;
  path: string;
  icon: IconName;
  /** Kalau diisi, sidebar menampilkan status tahap (centang / sedang berjalan / terkunci). */
  stage?: StageKey;
  /** Aktif hanya kalau URL persis sama (untuk menu Beranda). */
  exact?: boolean;
  /** Menu waka yang bisa dimatikan super admin per sekolah (lihat WAKA_MENUS). */
  menu?: WakaMenu;
  /** Hanya tampil untuk guru BK. */
  counselorOnly?: boolean;
}

/** Menu waka yang bisa dinyalakan/dimatikan super admin. Sama dengan enum WakaMenu di backend. */
export const WAKA_MENUS = [
  'SIKLUS',
  'KUESIONER',
  'KELAS',
  'PENEMPATAN',
  'SURAT',
  'DATA_MURID',
  'DATA_GURU',
  'MAPEL_JURUSAN',
  'NILAI',
  'SNBP',
] as const;
export type WakaMenu = (typeof WAKA_MENUS)[number];

export interface NavGroup {
  label: Label;
  items: NavItem[];
}

const HELP: NavGroup = {
  label: { id: 'Bantuan', en: 'Help' },
  items: [{ label: { id: 'Panduan aplikasi', en: 'User guide' }, path: 'panduan', icon: 'book' }],
};

function withBase(base: string, groups: NavGroup[]): NavGroup[] {
  return groups.map((g) => ({
    ...g,
    items: g.items.map((i) => ({ ...i, path: i.path ? `${base}/${i.path}` : base })),
  }));
}

/** Menu sidebar per role. Path relatif terhadap halaman awal role. */
export const NAV: Record<Role, NavGroup[]> = {
  MURID: withBase('/murid', [
    {
      label: { id: 'Tahap penjurusan', en: 'Selection steps' },
      items: [
        { label: { id: 'Beranda', en: 'Home' }, path: '', icon: 'grid', exact: true },
        { label: { id: 'Kuesioner', en: 'Questionnaire' }, path: 'kuesioner', icon: 'clipboard', stage: 'kuesioner' },
        { label: { id: 'Pilih kelas', en: 'Choose a class' }, path: 'pilih-kelas', icon: 'layers', stage: 'pilih-kelas' },
        { label: { id: 'Kelas saya', en: 'My class' }, path: 'kelas', icon: 'award', stage: 'kelas-final' },
        { label: { id: 'Surat pernyataan', en: 'Statement letter' }, path: 'surat', icon: 'file-pen', stage: 'surat' },
        { label: { id: 'Pengumuman', en: 'Announcements' }, path: 'pengumuman', icon: 'bell' },
      ],
    },
    HELP,
  ]),

  WAKA: withBase('/waka', [
    {
      label: { id: 'Ringkasan', en: 'Overview' },
      items: [{ label: { id: 'Beranda', en: 'Home' }, path: '', icon: 'grid', exact: true }],
    },
    {
      label: { id: 'Penjurusan', en: 'Subject selection' },
      items: [
        { label: { id: 'Siklus penjurusan', en: 'Selection cycles' }, path: 'siklus', icon: 'repeat', menu: 'SIKLUS' },
        { label: { id: 'Kuesioner', en: 'Questionnaire' }, path: 'kuesioner', icon: 'clipboard', menu: 'KUESIONER' },
        { label: { id: 'Kelas', en: 'Classes' }, path: 'kelas', icon: 'layers', menu: 'KELAS' },
        { label: { id: 'Penempatan murid', en: 'Student placement' }, path: 'penempatan', icon: 'shuffle', menu: 'PENEMPATAN' },
        { label: { id: 'Surat pernyataan', en: 'Statement letter' }, path: 'surat', icon: 'file-pen', menu: 'SURAT' },
      ],
    },
    {
      label: { id: 'Data sekolah', en: 'School data' },
      items: [
        { label: { id: 'Data murid', en: 'Students' }, path: 'pengguna', icon: 'users', menu: 'DATA_MURID' },
        { label: { id: 'Data guru', en: 'Teachers' }, path: 'guru', icon: 'user-check', menu: 'DATA_GURU' },
        { label: { id: 'Mapel & jurusan', en: 'Subjects & majors' }, path: 'master', icon: 'database', menu: 'MAPEL_JURUSAN' },
        { label: { id: 'Nilai & minat bakat', en: 'Grades & aptitude' }, path: 'upload', icon: 'upload', menu: 'NILAI' },
      ],
    },
    {
      label: { id: 'SNBP', en: 'SNBP' },
      items: [{ label: { id: 'Eligible SNBP', en: 'SNBP eligibility' }, path: 'snbp', icon: 'award', menu: 'SNBP' }],
    },
    HELP,
  ]),

  GURU: withBase('/guru', [
    {
      label: { id: 'Menu', en: 'Menu' },
      items: [
        { label: { id: 'Beranda', en: 'Home' }, path: '', icon: 'grid', exact: true },
        { label: { id: 'Hasil penjurusan', en: 'Selection results' }, path: 'hasil', icon: 'layers' },
        { label: { id: 'Eligible SNBP', en: 'SNBP eligibility' }, path: 'snbp', icon: 'award', counselorOnly: true },
      ],
    },
    HELP,
  ]),

  SUPER_ADMIN: withBase('/admin', [
    {
      label: { id: 'Ringkasan', en: 'Overview' },
      items: [{ label: { id: 'Beranda', en: 'Home' }, path: '', icon: 'grid', exact: true }],
    },
    {
      label: { id: 'Kelola', en: 'Manage' },
      items: [{ label: { id: 'Sekolah', en: 'Schools' }, path: 'sekolah', icon: 'school' }],
    },
  ]),
};

export const ROLE_LABEL: Dictionary<Record<Role, string>> = {
  id: { SUPER_ADMIN: 'Super admin', WAKA: 'Waka kurikulum', GURU: 'Guru', MURID: 'Murid' },
  en: { SUPER_ADMIN: 'Super admin', WAKA: 'Vice principal (curriculum)', GURU: 'Teacher', MURID: 'Student' },
};
