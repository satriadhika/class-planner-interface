import { Role } from '../core/auth/auth.models';
import { StageKey } from '../features/murid/murid-progress.service';
import { IconName } from '../shared/icon/icon';

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  /** Kalau diisi, sidebar menampilkan status tahap (centang / sedang berjalan / terkunci). */
  stage?: StageKey;
  /** Aktif hanya kalau URL persis sama (untuk menu Beranda). */
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const HELP: NavGroup = {
  label: 'Bantuan',
  items: [{ label: 'Panduan aplikasi', path: 'panduan', icon: 'book' }],
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
      label: 'Tahap penjurusan',
      items: [
        { label: 'Beranda', path: '', icon: 'grid', exact: true },
        { label: 'Kuesioner', path: 'kuesioner', icon: 'clipboard', stage: 'kuesioner' },
        { label: 'Pilih kelas', path: 'pilih-kelas', icon: 'layers', stage: 'pilih-kelas' },
        { label: 'Kelas saya', path: 'kelas', icon: 'award', stage: 'kelas-final' },
        { label: 'Surat pernyataan', path: 'surat', icon: 'file-pen', stage: 'surat' },
        { label: 'Pengumuman', path: 'pengumuman', icon: 'bell' },
      ],
    },
    HELP,
  ]),

  WAKA: withBase('/waka', [
    {
      label: 'Ringkasan',
      items: [{ label: 'Beranda', path: '', icon: 'grid', exact: true }],
    },
    {
      label: 'Penjurusan',
      items: [
        { label: 'Siklus penjurusan', path: 'siklus', icon: 'repeat' },
        { label: 'Kuesioner', path: 'kuesioner', icon: 'clipboard' },
        { label: 'Kelas', path: 'kelas', icon: 'layers' },
        { label: 'Penempatan murid', path: 'penempatan', icon: 'shuffle' },
        { label: 'Surat pernyataan', path: 'surat', icon: 'file-pen' },
      ],
    },
    {
      label: 'Data sekolah',
      items: [
        { label: 'Data murid', path: 'pengguna', icon: 'users' },
        { label: 'Mapel & jurusan', path: 'master', icon: 'database' },
        { label: 'Nilai & minat bakat', path: 'upload', icon: 'upload' },
      ],
    },
    HELP,
  ]),

  GURU: withBase('/guru', [
    {
      label: 'Menu',
      items: [
        { label: 'Beranda', path: '', icon: 'grid', exact: true },
        { label: 'Kelas yang saya ajar', path: 'kelas', icon: 'layers' },
      ],
    },
    HELP,
  ]),

  SUPER_ADMIN: withBase('/admin', [
    {
      label: 'Admin',
      items: [{ label: 'Sekolah', path: '', icon: 'school', exact: true }],
    },
  ]),
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  WAKA: 'Waka kurikulum',
  GURU: 'Guru',
  MURID: 'Murid',
};

export const ROLE_SUBTITLE: Record<Role, string> = {
  SUPER_ADMIN: 'Kelola sekolah yang memakai Class Planner.',
  WAKA: 'Pantau proses penjurusan sekolahmu di sini.',
  GURU: 'Lihat kelas dan murid yang kamu ajar.',
  MURID: 'Semoga harimu menyenangkan. Yuk lanjutkan tahap penjurusanmu.',
};
