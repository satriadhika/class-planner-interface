import { Component, computed, inject, input } from '@angular/core';

import { I18n } from '../../core/i18n/i18n';
import { translateTitle } from '../../core/i18n/title-strategy';

/**
 * Halaman sementara. Judul diambil dari `data.title` di route
 * (butuh `withComponentInputBinding()` di provideRouter).
 */
@Component({
  selector: 'app-placeholder',
  template: `
    <section class="placeholder">
      <h2>{{ heading() }}</h2>
      <p>{{ i18n.lang() === 'en' ? 'This page is coming soon.' : 'Halaman ini sedang dibuat.' }}</p>
    </section>
  `,
  styles: `
    .placeholder {
      padding: 32px;
      border-radius: 20px;
      background: var(--surface);
      border: 1px dashed var(--border);
    }
    h2 {
      margin: 0 0 6px;
      font-size: 1.25rem;
      color: var(--brand-ink);
    }
    p {
      margin: 0;
      color: var(--muted);
    }
  `,
})
export class Placeholder {
  readonly title = input('');
  readonly i18n = inject(I18n);
  readonly heading = computed(() => translateTitle(this.title(), this.i18n.lang()));
}
