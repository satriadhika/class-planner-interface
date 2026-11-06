import { Routes } from '@angular/router';

import { authGuard, guestGuard, roleGuard } from './core/auth/auth-guard';
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
          todo('pilih-kelas', 'Pilih kelas'),
          todo('surat', 'Surat pernyataan'),
          todo('kelas', 'Kelas saya'),
          todo('pengumuman', 'Pengumuman'),
          todo('panduan', 'Panduan aplikasi'),
        ],
      },
      {
        path: 'waka',
        title: 'Waka — Class Planner',
        canActivate: [roleGuard('WAKA')],
        children: [
          todo('', 'Beranda waka'),
          todo('siklus', 'Siklus penjurusan'),
          todo('kuesioner', 'Kuesioner'),
          todo('kelas', 'Kelas'),
          todo('penempatan', 'Penempatan murid'),
          todo('surat', 'Surat pernyataan'),
          todo('pengguna', 'Murid & guru'),
          todo('master', 'Mapel & jurusan'),
          todo('upload', 'Upload nilai'),
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
