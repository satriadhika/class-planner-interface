import { Component, inject, input } from '@angular/core';

import { I18n, LANGS, Lang } from '../../core/i18n/i18n';

/** Tombol pilihan bahasa: ID | EN. */
@Component({
  selector: 'app-lang-switch',
  template: `
    <div class="switch" [class.dark]="tone() === 'dark'" role="group" [attr.aria-label]="i18n.lang() === 'en' ? 'Language' : 'Bahasa'">
      @for (l of langs; track l) {
        <button type="button" [attr.aria-pressed]="i18n.lang() === l" [attr.lang]="l" [attr.title]="labels[l]" (click)="i18n.set(l)">
          {{ l.toUpperCase() }}
        </button>
      }
    </div>
  `,
  styles: `
    .switch {
      display: inline-flex;
      padding: 3px;
      border: 1px solid var(--border, #d9dfe8);
      border-radius: 999px;
      background: var(--surface, #fff);
    }
    button {
      min-width: 38px;
      padding: 5px 10px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--muted, #5b6578);
      font: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      background: var(--primary, #2563eb);
      color: #fff;
    }
    .dark {
      border-color: rgb(255 255 255 / 0.25);
      background: rgb(255 255 255 / 0.08);
    }
    .dark button {
      color: rgb(255 255 255 / 0.8);
    }
  `,
})
export class LangSwitch {
  readonly i18n = inject(I18n);
  readonly tone = input<'light' | 'dark'>('light');
  readonly langs = LANGS;
  readonly labels: Record<Lang, string> = { id: 'Bahasa Indonesia', en: 'English' };
}
