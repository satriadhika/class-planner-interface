import { Routes } from '@angular/router';

import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';
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
            title: 'Siklus penjurusan — Class Planner',
            loadComponent: () => import('./features/waka/siklus/waka-siklus').then((m) => m.WakaSiklus),
          },
          {
            path: 'kuesioner',
            title: 'Kuesioner — Class Planner',
            loadComponent: () => import('./features/waka/kuesioner/waka-kuesioner').then((m) => m.WakaKuesioner),
          },
          {
            path: 'kelas',
            title: 'Kelas — Class Planner',
            loadComponent: () => import('./features/waka/kelas/waka-kelas').then((m) => m.WakaKelas),
          },
          {
            path: 'penempatan',
            title: 'Penempatan murid — Class Planner',
            loadComponent: () => import('./features/waka/penempatan/waka-penempatan').then((m) => m.WakaPenempatan),
          },
          {
            path: 'surat',
            title: 'Surat pernyataan — Class Planner',
            loadComponent: () => import('./features/waka/surat/waka-surat').then((m) => m.WakaSurat),
          },
          {
            path: 'pengguna',
            title: 'Data murid — Class Planner',
            loadComponent: () => import('./features/waka/pengguna/waka-pengguna').then((m) => m.WakaPengguna),
          },
          {
            path: 'master',
            title: 'Mapel & jurusan — Class Planner',
            loadComponent: () => import('./features/waka/master/waka-master').then((m) => m.WakaMaster),
          },
          {
            path: 'upload',
            title: 'Nilai & minat bakat — Class Planner',
            loadComponent: () => import('./features/waka/upload/waka-upload').then((m) => m.WakaUpload),
          },
          todo('panduan', 'Panduan aplikasi'),
        ],
      },
      {
        path: 'guru',
        title: 'Guru — Class Planner',
        canActivate: [roleGuard('GURU')],
        children: [todo('', 'Beranda guru'), todo('kelas', 'Kelas yang saya ajar'), todo('panduan', 'Panduan aplikasi')],
      },
      {
        path: 'admin',
        title: 'Admin — Class Planner',
        canActivate: [roleGuard('SUPER_ADMIN')],
        children: [todo('', 'Kelola sekolah')],
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
