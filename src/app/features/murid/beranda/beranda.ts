import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../../shared/icon/icon';
import {
  Activity,
  MuridProgressService,
  StageStatus,
  activityLabel,
  formatDateTime,
} from '../murid-progress.service';

/** Beranda murid: langkah berikutnya, info tenggat, progres tahap, dan riwayat aktivitas. */
@Component({
  selector: 'app-murid-beranda',
  imports: [RouterLink, Icon],
  templateUrl: './beranda.html',
  styleUrl: './beranda.scss',
})
export class MuridBeranda {
  private readonly progress = inject(MuridProgressService);

  readonly stages = this.progress.stages;
  readonly current = this.progress.current;
  readonly cycle = this.progress.cycle;
  readonly deadline = this.progress.deadline;
  readonly percent = this.progress.percent;
  readonly doneCount = this.progress.doneCount;
  readonly loading = this.progress.loading;
  readonly loaded = this.progress.loaded;
  readonly noCycle = this.progress.noCycle;
  readonly error = this.progress.error;

  readonly activities = signal<Activity[]>([]);

  readonly statusLabel: Record<StageStatus, string> = {
    done: 'Selesai',
    current: 'Sedang berjalan',
    locked: 'Belum dibuka',
    missed: 'Terlewat — hubungi waka kurikulum',
  };

  readonly activityLabel = activityLabel;
  readonly formatDateTime = formatDateTime;

  constructor() {
    // selalu ambil data terbaru saat beranda dibuka
    this.progress.load().subscribe(() => {
      if (this.cycle()) {
        this.progress.activity().subscribe({
          next: (list) => this.activities.set(list.slice(0, 6)),
          error: () => this.activities.set([]),
        });
      }
    });
  }

  reload(): void {
    this.progress.load().subscribe();
  }
}
