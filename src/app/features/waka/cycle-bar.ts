import { Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CYCLE_STATUS_LABEL } from '../../shared/labels/labels';
import { CycleStore } from './cycle-store';

/** Pemilih siklus + status, ditaruh di atas setiap halaman waka. */
@Component({
  selector: 'app-cycle-bar',
  imports: [RouterLink],
  template: `
    @if (store.cycles().length === 0) {
      <div class="cp-alert">
        <span>Belum ada siklus penjurusan.</span>
        <a class="cp-btn cp-btn--primary cp-btn--sm" routerLink="/waka/siklus">Buat siklus</a>
      </div>
    } @else {
      <div class="bar">
        <label class="pick">
          <span class="cp-small cp-muted">Siklus</span>
          <select (change)="pick($any($event.target).value)">
            @for (c of store.cycles(); track c.id) {
              <option [value]="c.id" [selected]="c.id === store.selectedId()">{{ c.name }} · angkatan {{ c.cohortEntryYear }}</option>
            }
          </select>
        </label>
        @if (store.detail(); as d) {
          <span class="cp-badge" [class.cp-badge--ok]="d.cycle.status === 'FINALIZED'" [class.cp-badge--primary]="d.cycle.status !== 'FINALIZED'">
            {{ statusLabel[d.cycle.status] }}
          </span>
        }
      </div>
    }
  `,
  styles: `
    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 14px;
      padding: 10px 14px;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .pick {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1 1 280px;
    }
    select {
      min-height: 38px;
      min-width: 0;
      flex: 1;
      max-width: 460px;
    }
  `,
})
export class CycleBar {
  readonly store = inject(CycleStore);
  readonly statusLabel = CYCLE_STATUS_LABEL;
  readonly changed = output<number>();

  pick(value: string): void {
    const id = Number(value);
    this.store.select(id).subscribe(() => this.changed.emit(id));
  }
}
