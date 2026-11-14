import { Component, computed, inject } from '@angular/core';

import { I18n } from '../../../core/i18n/i18n';
import { CycleResults } from '../../../shared/results/cycle-results';
import { GURU_TEXT } from '../guru.i18n';

/** Guru: hasil penjurusan sekolahnya (baca-saja, tanpa % kecocokan). */
@Component({
  selector: 'app-guru-hasil',
  imports: [CycleResults],
  template: `
    <div class="cp-page">
      <header class="cp-head cp-no-print">
        <div>
          <h1>{{ t().resultsTitle }}</h1>
          <p>{{ t().resultsIntro }}</p>
        </div>
      </header>
      <app-cycle-results />
    </div>
  `,
})
export class GuruHasil {
  private readonly i18n = inject(I18n);
  readonly t = computed(() => GURU_TEXT[this.i18n.lang()]);
}
