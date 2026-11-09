import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, switchMap, tap } from 'rxjs';

import { CycleDetail, CycleSummary, WakaApi } from './waka-api';

const KEY = 'cp.waka.cycle';

/** Siklus yang sedang dikelola waka. Dipakai bersama oleh semua halaman waka. */
@Injectable({ providedIn: 'root' })
export class CycleStore {
  private readonly api = inject(WakaApi);

  readonly cycles = signal<CycleSummary[]>([]);
  readonly detail = signal<CycleDetail | null>(null);
  readonly loaded = signal(false);

  readonly selectedId = computed(() => this.detail()?.cycle.id ?? null);
  readonly status = computed(() => this.detail()?.cycle.status ?? null);

  /** Muat daftar siklus, lalu detail siklus terpilih (yang terakhir dipilih, atau yang terbaru). */
  load(): Observable<CycleDetail | null> {
    return this.api.cycles().pipe(
      tap((list) => this.cycles.set(list)),
      switchMap((list) => {
        const remembered = readId();
        const pick = list.find((c) => c.id === remembered) ?? list[0];
        return pick ? this.api.cycle(pick.id) : of(null);
      }),
      tap((d) => {
        this.detail.set(d);
        this.loaded.set(true);
      }),
    );
  }

  /** Pastikan sudah dimuat (dipanggil halaman saat dibuka). */
  ensure(): Observable<CycleDetail | null> {
    return this.loaded() ? of(this.detail()) : this.load();
  }

  select(id: number): Observable<CycleDetail> {
    writeId(id);
    return this.api.cycle(id).pipe(tap((d) => this.detail.set(d)));
  }

  refresh(): Observable<CycleDetail | null> {
    const id = this.selectedId();
    return id ? this.api.cycle(id).pipe(tap((d) => this.setDetail(d))) : of(null);
  }

  /** Simpan detail terbaru (dari response aksi) dan sinkronkan daftar. */
  setDetail(d: CycleDetail): void {
    writeId(d.cycle.id);
    this.detail.set(d);
    this.cycles.update((list) => {
      const exists = list.some((c) => c.id === d.cycle.id);
      return exists ? list.map((c) => (c.id === d.cycle.id ? d.cycle : c)) : [d.cycle, ...list];
    });
  }

  reloadList(): Observable<void> {
    return this.api.cycles().pipe(
      tap((list) => this.cycles.set(list)),
      map(() => undefined),
    );
  }

  clear(): void {
    this.cycles.set([]);
    this.detail.set(null);
    this.loaded.set(false);
  }
}

function readId(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function writeId(id: number): void {
  try {
    localStorage.setItem(KEY, String(id));
  } catch {
    // abaikan (mode privat, dll.)
  }
}
