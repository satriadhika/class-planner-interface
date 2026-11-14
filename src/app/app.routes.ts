import { Routes } from '@angular/router';

import { authGuard, counselorGuard, guestGuard, roleGuard, wakaMenuGuard } from './core/auth/auth.guards';
import { Landing } from './features/landing/landing';
import { Shell } from './layout/shell/shell';
import { Placeholder } from './shared/placeholder/placeholder';

/** Halaman yang belum dibuat → tampil Placeholder dengan judulnya. */
const todo = (path: string, title: string) => ({ path, component: Placeholder, data: { title } });

export const routes: Routes = [
  // ===== Halaman depan publik. /login = halaman depan + popup login =====
  {
    path: '',
    component: Landing,
    title: 'Class Planner',
    children: [
      { path: '', children: [] },
      {
        path: 'login',
        title: 'Masuk — Class Planner',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginDialog),
      },
    ],
  },

  // ===== Area setelah login: sidebar + header (Shell) =====
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'murid',
        title: 'Murid — Class Planner',
        canActivate: [roleGuard('MURID')],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/murid/beranda/beranda').then((m) => m.MuridBeranda),
          },
          {
            path: 'kuesioner',
            title: 'Kuesioner — Class Planner',
            loadComponent: () => import('./features/murid/kuesioner/kuesioner').then((m) => m.Kuesioner),
          },
          {
            path: 'pilih-kelas',
            title: 'Pilih kelas — Class Planner',
            loadComponent: () => import('./features/murid/pilih-kelas/pilih-kelas').then((m) => m.PilihKelas),
          },
          {
            path: 'kelas',
            title: 'Kelas saya — Class Planner',
            loadComponent: () => import('./features/murid/kelas/kelas-saya').then((m) => m.KelasSaya),
          },
          {
            path: 'surat',
            title: 'Surat pernyataan — Class Planner',
            loadComponent: () => import('./features/murid/surat/surat').then((m) => m.Surat),
          },
          todo('pengumuman', 'Pengumuman'),
          todo('panduan', 'Panduan aplikasi'),
        ],
      },
      {
        path: 'waka',
        title: 'Waka — Class Planner',
        canActivate: [roleGuard('WAKA')],
        children: [
          {
            path: '',
            title: 'Beranda waka — Class Planner',
            loadComponent: () => import('./features/waka/beranda/waka-beranda').then((m) => m.WakaBeranda),
          },
          {
            path: 'siklus',
            canActivate: [wakaMenuGuard('SIKLUS')],
            title: 'Siklus penjurusan — Class Planner',
            loadComponent: () => import('./features/waka/siklus/waka-siklus').then((m) => m.WakaSiklus),
          },
          {
            path: 'kuesioner',
            canActivate: [wakaMenuGuard('KUESIONER')],
            title: 'Kuesioner — Class Planner',
            loadComponent: () => import('./features/waka/kuesioner/waka-kuesioner').then((m) => m.WakaKuesioner),
          },
          {
            path: 'kelas',
            canActivate: [wakaMenuGuard('KELAS')],
            title: 'Kelas — Class Planner',
            loadComponent: () => import('./features/waka/kelas/waka-kelas').then((m) => m.WakaKelas),
          },
          {
            path: 'penempatan',
            canActivate: [wakaMenuGuard('PENEMPATAN')],
            title: 'Penempatan murid — Class Planner',
            loadComponent: () => import('./features/waka/penempatan/waka-penempatan').then((m) => m.WakaPenempatan),
          },
          {
            path: 'surat',
            canActivate: [wakaMenuGuard('SURAT')],
            title: 'Surat pernyataan — Class Planner',
            loadComponent: () => import('./features/waka/surat/waka-surat').then((m) => m.WakaSurat),
          },
          {
            path: 'pengguna',
            canActivate: [wakaMenuGuard('DATA_MURID')],
            title: 'Data murid — Class Planner',
            loadComponent: () => import('./features/waka/pengguna/waka-pengguna').then((m) => m.WakaPengguna),
          },
          {
            path: 'master',
            canActivate: [wakaMenuGuard('MAPEL_JURUSAN')],
            title: 'Mapel & jurusan — Class Planner',
            loadComponent: () => import('./features/waka/master/waka-master').then((m) => m.WakaMaster),
          },
          {
            path: 'upload',
            canActivate: [wakaMenuGuard('NILAI')],
            title: 'Nilai & minat bakat — Class Planner',
            loadComponent: () => import('./features/waka/upload/waka-upload').then((m) => m.WakaUpload),
          },
          {
            path: 'guru',
            title: 'Data guru — Class Planner',
            canActivate: [wakaMenuGuard('DATA_GURU')],
            loadComponent: () => import('./features/waka/guru/waka-guru').then((m) => m.WakaGuru),
          },
          {
            path: 'snbp',
            title: 'Eligible SNBP — Class Planner',
            canActivate: [wakaMenuGuard('SNBP')],
            loadComponent: () => import('./features/snbp/snbp-page').then((m) => m.SnbpPage),
          },
          {
            path: 'password',
            title: 'Ganti password — Class Planner',
            loadComponent: () => import('./features/account/change-password').then((m) => m.ChangePassword),
          },
          todo('panduan', 'Panduan aplikasi'),
        ],
      },
      {
        path: 'guru',
        title: 'Guru — Class Planner',
        canActivate: [roleGuard('GURU')],
        children: [
          {
            path: '',
            title: 'Beranda guru — Class Planner',
            loadComponent: () => import('./features/guru/beranda/guru-beranda').then((m) => m.GuruBeranda),
          },
          {
            path: 'hasil',
            title: 'Hasil penjurusan — Class Planner',
            loadComponent: () => import('./features/guru/hasil/guru-hasil').then((m) => m.GuruHasil),
          },
          {
            path: 'snbp',
            title: 'Eligible SNBP — Class Planner',
            canActivate: [counselorGuard],
            loadComponent: () => import('./features/snbp/snbp-page').then((m) => m.SnbpPage),
          },
          todo('panduan', 'Panduan aplikasi'),
        ],
      },
      {
        path: 'admin',
        title: 'Admin — Class Planner',
        canActivate: [roleGuard('SUPER_ADMIN')],
        children: [
          {
            path: '',
            title: 'Beranda admin — Class Planner',
            loadComponent: () => import('./features/admin/beranda/admin-beranda').then((m) => m.AdminBeranda),
          },
          {
            path: 'sekolah',
            title: 'Sekolah — Class Planner',
            loadComponent: () => import('./features/admin/sekolah/admin-sekolah').then((m) => m.AdminSekolah),
          },
          {
            path: 'password',
            title: 'Ganti password — Class Planner',
            loadComponent: () => import('./features/account/change-password').then((m) => m.ChangePassword),
          },
          {
            path: 'sekolah/:id',
            title: 'Detail sekolah — Class Planner',
            loadComponent: () => import('./features/admin/detail/admin-detail').then((m) => m.AdminDetail),
          },
        ],
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
