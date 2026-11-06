import { Component, input } from '@angular/core';

/**
 * Halaman sementara. Judul diambil dari `data.title` di route
 * (butuh `withComponentInputBinding()` di provideRouter).
 */
@Component({
  selector: 'app-placeholder',
  template: `
    <section class="placeholder">
      <h2>{{ title() }}</h2>
      <p>Halaman ini sedang dibuat.</p>
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
}
