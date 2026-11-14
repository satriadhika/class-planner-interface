import { Component, computed, inject, signal } from '@angular/core';

import { I18n } from '../../core/i18n/i18n';
import { SnbpRanking } from './snbp-ranking';
import { SnbpSettingsPanel } from './snbp-settings';
import { SnbpUpload } from './snbp-upload';
import { SNBP_TEXT } from './snbp.i18n';

type Tab = 'ranking' | 'settings' | 'upload';

/** Eligible SNBP (waka & guru BK): peringkat, pengaturan perhitungan, upload nilai. */
@Component({
  selector: 'app-snbp-page',
  imports: [SnbpRanking, SnbpSettingsPanel, SnbpUpload],
  template: `
    <div class="cp-page">
      <header class="cp-head cp-no-print">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      <div class="cp-tabs cp-no-print" role="tablist">
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'ranking'" (click)="tab.set('ranking')">{{ t().tabRanking }}</button>
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'settings'" (click)="tab.set('settings')">{{ t().tabSettings }}</button>
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'upload'" (click)="tab.set('upload')">{{ t().tabUpload }}</button>
      </div>

      @switch (tab()) {
        @case ('ranking') { <app-snbp-ranking (goto)="tab.set($event)" /> }
        @case ('settings') { <app-snbp-settings /> }
        @case ('upload') { <app-snbp-upload (goto)="tab.set($event)" /> }
      }
    </div>
  `,
})
export class SnbpPage {
  private readonly i18n = inject(I18n);
  readonly t = computed(() => SNBP_TEXT[this.i18n.lang()]);
  readonly tab = signal<Tab>('ranking');
}
