import { Injectable, Injector, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { I18n } from './i18n';

/** Judul tab browser versi Inggris. Kunci = judul di app.routes.ts (tanpa " — Class Planner"). */
const TITLE_EN: Record<string, string> = {
  'Masuk': 'Sign in',
  'Murid': 'Student',
  'Waka': 'Vice principal',
  'Guru': 'Teacher',
  'Admin': 'Admin',
  'Beranda waka': 'Home',
  'Kuesioner': 'Questionnaire',
  'Pilih kelas': 'Choose a class',
  'Kelas saya': 'My class',
  'Surat pernyataan': 'Statement letter',
  'Pengumuman': 'Announcements',
  'Panduan aplikasi': 'User guide',
  'Siklus penjurusan': 'Selection cycles',
  'Kelas': 'Classes',
  'Penempatan murid': 'Student placement',
  'Data murid': 'Students',
  'Mapel & jurusan': 'Subjects & majors',
  'Nilai & minat bakat': 'Grades & aptitude',
  'Kelas yang saya ajar': 'My teaching classes',
  'Data guru': 'Teachers',
  'Beranda guru': 'Home',
  'Hasil penjurusan': 'Selection results',
  'Beranda admin': 'Home',
  'Sekolah': 'Schools',
  'Detail sekolah': 'School details',
  'Ganti password': 'Change password',
  'Eligible SNBP': 'SNBP eligibility',
};

const SUFFIX = ' — Class Planner';

/** Terjemahkan judul halaman/route ke bahasa aktif. */
export function translateTitle(title: string, lang: 'id' | 'en'): string {
  if (lang === 'id') return title;
  const base = title.endsWith(SUFFIX) ? title.slice(0, -SUFFIX.length) : title;
  const en = TITLE_EN[base];
  if (!en) return title;
  return title.endsWith(SUFFIX) ? en + SUFFIX : en;
}

/** Judul tab mengikuti bahasa dan ikut berganti saat bahasa diganti. */
@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18n);
  private readonly injector = inject(Injector);

  constructor() {
    super();
    effect(() => {
      this.i18n.lang();
      // Router diambil belakangan supaya tidak terjadi dependensi melingkar (Router butuh TitleStrategy)
      const router = this.injector.get(Router, null);
      if (router?.navigated) this.updateTitle(router.routerState.snapshot);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title !== undefined) this.title.setTitle(translateTitle(title, this.i18n.lang()));
  }
}
