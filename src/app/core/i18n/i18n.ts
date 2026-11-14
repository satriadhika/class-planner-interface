import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type Lang = 'id' | 'en';
export const LANGS: readonly Lang[] = ['id', 'en'];

/** Kamus per halaman: bentuk teks bahasa Inggris wajib sama persis dengan bahasa Indonesia. */
export type Dictionary<T> = Record<Lang, T>;

const STORAGE_KEY = 'cp.lang';

let active: Lang = 'id';

/** Bahasa aktif untuk kode di luar komponen (misalnya penerjemah pesan error). */
export function currentLang(): Lang {
  return active;
}

/**
 * Bahasa tampilan, bisa diganti kapan saja tanpa memuat ulang halaman.
 * Kunjungan pertama mengikuti bahasa perangkat (Inggris kalau perangkat berbahasa Inggris, selain itu Indonesia);
 * setelah dipilih, disimpan di browser.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly document = inject(DOCUMENT);

  readonly lang = signal<Lang>(this.initial());

  /** Pilih teks sesuai bahasa aktif: `i18n.pick({ id: 'Simpan', en: 'Save' })`. */
  pick<T>(text: Dictionary<T>): T {
    return text[this.lang()];
  }

  constructor() {
    effect(() => {
      const lang = this.lang();
      active = lang;
      this.document.documentElement.lang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // browser menolak penyimpanan (mode privat dsb.): bahasa tetap berlaku selama halaman terbuka
      }
    });
  }

  set(lang: Lang): void {
    active = lang;
    this.lang.set(lang);
  }

  /** Locale untuk format tanggal/angka (Intl). */
  locale(): string {
    return this.lang() === 'en' ? 'en-GB' : 'id-ID';
  }

  /** Format tanggal sesuai bahasa aktif. Kosong → null. */
  date(iso: string | null | undefined, options: Intl.DateTimeFormatOptions): string | null {
    return iso ? new Intl.DateTimeFormat(this.locale(), options).format(new Date(iso)) : null;
  }

  /** Tanggal + jam singkat, misalnya "14 Nov 2026, 11.33" / "14 Nov 2026, 11:33". */
  dateTime(iso: string | null | undefined): string | null {
    return this.date(iso, { dateStyle: 'medium', timeStyle: 'short' });
  }

  private initial(): Lang {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'id' || saved === 'en') return (active = saved);
    } catch {
      // abaikan
    }
    const nav = typeof navigator !== 'undefined' ? navigator.language : 'id';
    return (active = nav?.toLowerCase().startsWith('en') ? 'en' : 'id');
  }
}
