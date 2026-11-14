import { Component, computed, inject, input } from '@angular/core';

import { I18n, Lang } from '../../core/i18n/i18n';

/**
 * Kartu sapaan di atas beranda: "Selamat malam, Nadia" + keterangan.
 * Isi di sebelah kanan (ringkasan progres dsb.) dimasukkan lewat <ng-content>.
 */
@Component({
  selector: 'app-hero',
  template: `
    <section class="hero">
      <div class="text">
        <p>{{ greeting() }},</p>
        <h1>{{ firstName() }}</h1>
        @if (subtitle()) { <span>{{ subtitle() }}</span> }
      </div>
      <div class="aside"><ng-content /></div>
      <span class="tiles" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    </section>
  `,
  styles: `
    :host { display: block; }
    .hero {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 26px 28px;
      border-radius: 16px;
      overflow: hidden;
      color: #fff;
      background:
        radial-gradient(60% 140% at 0% 0%, rgb(142 197 255 / 0.3), transparent 60%),
        linear-gradient(120deg, #0a1530 0%, #14306b 55%, #1f4fbf 100%);
    }
    .text { position: relative; z-index: 1; display: grid; gap: 2px; }
    p { margin: 0; font-size: 1rem; opacity: 0.85; }
    h1 { margin: 0; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; line-height: 1.2; }
    span { font-size: 0.9rem; opacity: 0.8; }
    .aside { position: relative; z-index: 1; margin-right: 120px; }
    .aside:empty { display: none; }
    /* motif kotak logo di pojok kanan */
    .tiles {
      position: absolute;
      right: 26px;
      top: 50%;
      display: grid;
      grid-template-columns: repeat(2, 38px);
      gap: 8px;
      transform: translateY(-50%) rotate(-8deg);
      opacity: 0.9;
    }
    .tiles i { width: 38px; height: 38px; border-radius: 10px; background: rgb(255 255 255 / 0.12); }
    .tiles i:nth-child(1) { background: rgb(255 255 255 / 0.22); }
    .tiles i:nth-child(4) { background: var(--accent); opacity: 0.85; }
    @media (max-width: 760px) {
      .hero { padding: 20px; }
      .aside { margin-right: 0; width: 100%; }
      .tiles { display: none; }
    }
  `,
})
export class Hero {
  readonly name = input.required<string>();
  readonly subtitle = input<string | null>(null);

  readonly firstName = computed(() => this.name().trim().split(/\s+/)[0] ?? '');
  private readonly i18n = inject(I18n);
  readonly greeting = computed(() => greetingFor(new Date().getHours(), this.i18n.lang()));
}

function greetingFor(hour: number, lang: Lang): string {
  if (lang === 'en') {
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}
