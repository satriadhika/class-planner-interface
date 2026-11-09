import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, startWith } from 'rxjs';

import { problemMessage } from '../../../core/api/problem';
import { Icon, IconName } from '../../../shared/icon/icon';
import { MuridProgressService } from '../murid-progress.service';
import {
  KuesionerAnswers,
  KuesionerData,
  KuesionerService,
  KuesionerStatus,
  MajorOption,
} from './kuesioner.service';

type Step = 1 | 2 | 3 | 4;

interface StepInfo {
  n: Step;
  label: string;
  title: string;
  subtitle: string;
  icon: IconName;
}

/** Pilihan jurusan 1 dan 2 tidak boleh sama. */
function differentMajors(group: AbstractControl): ValidationErrors | null {
  const first = group.get('major1Id')?.value;
  const second = group.get('major2Id')?.value;
  return first && second && first === second ? { sameMajor: true } : null;
}

@Component({
  selector: 'app-kuesioner',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './kuesioner.html',
  styleUrl: './kuesioner.scss',
})
export class Kuesioner {
  private readonly service = inject(KuesionerService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly progress = inject(MuridProgressService);

  readonly steps: StepInfo[] = [
    { n: 1, label: 'Data diri', title: 'Data diri', subtitle: 'Diambil dari data sekolah (e-Rapor).', icon: 'user' },
    { n: 2, label: 'Cita-cita & minat', title: 'Cita-cita & minat', subtitle: 'Ceritakan cita-cita, kegiatan pendukung, dan minatmu.', icon: 'target' },
    { n: 3, label: 'Pilihan jurusan', title: 'Pilihan jurusan kuliah', subtitle: 'Pilih dua jurusan kuliah yang kamu minati.', icon: 'graduation' },
    { n: 4, label: 'Tinjau', title: 'Tinjau jawaban', subtitle: 'Periksa kembali sebelum dikirim.', icon: 'eye' },
  ];

  // ----- state -----
  readonly step = signal<Step>(1);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly status = signal<KuesionerStatus>('NOT_STARTED');
  readonly data = signal<KuesionerData | null>(null);
  readonly majors = signal<MajorOption[]>([]);

  /** Terkunci kalau sudah dikirim, atau periode kuesioner sudah ditutup (ditentukan backend). */
  readonly readOnly = computed(() => !(this.data()?.editable ?? false));
  readonly submitted = computed(() => this.status() === 'SUBMITTED');
  readonly currentStep = computed(() => this.steps[this.step() - 1]);

  // ----- form -----
  readonly aspirationForm = this.fb.group({
    aspiration: ['', [Validators.required, Validators.maxLength(100)]],
    supportingActivities: ['', [Validators.maxLength(1000)]],
    interestIpa: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
    interestIps: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
  });

  readonly majorForm = this.fb.group(
    {
      major1Id: this.fb.control<number | null>(null, Validators.required),
      major2Id: this.fb.control<number | null>(null, Validators.required),
    },
    { validators: differentMajors },
  );

  readonly confirmed = this.fb.control(false, Validators.requiredTrue);

  private readonly major1Id = toSignal(
    this.majorForm.controls.major1Id.valueChanges.pipe(startWith(this.majorForm.controls.major1Id.value)),
  );
  private readonly major2Id = toSignal(
    this.majorForm.controls.major2Id.valueChanges.pipe(startWith(this.majorForm.controls.major2Id.value)),
  );
  private readonly supportingText = toSignal(
    this.aspirationForm.controls.supportingActivities.valueChanges.pipe(startWith('')),
  );

  readonly major1 = computed(() => this.majors().find((m) => m.id === this.major1Id()) ?? null);
  readonly major2 = computed(() => this.majors().find((m) => m.id === this.major2Id()) ?? null);
  readonly supportingLength = computed(() => this.supportingText()?.length ?? 0);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({ data: this.service.load(), majors: this.service.majors() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data, majors }) => {
          this.majors.set(majors);
          this.applyData(data);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loadError.set(problemMessage(err, 'Kuesioner gagal dimuat.'));
          this.loading.set(false);
        },
      });
  }

  private applyData(data: KuesionerData): void {
    this.data.set(data);
    this.status.set(data.status);
    this.aspirationForm.patchValue({
      aspiration: data.aspiration,
      supportingActivities: data.supportingActivities,
      interestIpa: data.interestIpa,
      interestIps: data.interestIps,
    });
    this.majorForm.patchValue({ major1Id: data.major1Id, major2Id: data.major2Id });

    if (!data.editable) {
      this.aspirationForm.disable();
      this.majorForm.disable();
      this.confirmed.disable();
    } else {
      this.aspirationForm.enable();
      this.majorForm.enable();
      this.confirmed.enable();
    }
    if (data.status === 'SUBMITTED') {
      this.step.set(4);
    }
  }

  // -----------------------------------------------------------------
  // Navigasi langkah
  // -----------------------------------------------------------------
  isStepValid(n: Step): boolean {
    switch (n) {
      case 2:
        return this.aspirationForm.valid || this.aspirationForm.disabled;
      case 3:
        return this.majorForm.valid || this.majorForm.disabled;
      default:
        return true;
    }
  }

  /** Langkah bisa dibuka kalau semua langkah sebelumnya sudah valid. */
  canOpen(n: Step): boolean {
    for (let i = 1; i < n; i++) {
      if (!this.isStepValid(i as Step)) {
        return false;
      }
    }
    return true;
  }

  isDone(n: Step): boolean {
    return n < this.step() && this.isStepValid(n);
  }

  goTo(n: Step): void {
    if (this.canOpen(n)) {
      this.step.set(n);
      this.message.set(null);
      this.scrollTop();
    }
  }

  next(): void {
    const current = this.step();
    if (current === 2) {
      this.aspirationForm.markAllAsTouched();
    }
    if (current === 3) {
      this.majorForm.markAllAsTouched();
    }
    if (!this.isStepValid(current) || current === 4) {
      return;
    }
    // simpan draf diam-diam setiap pindah langkah
    if (current > 1) {
      this.saveDraft(true);
    }
    this.goTo((current + 1) as Step);
  }

  prev(): void {
    if (this.step() > 1) {
      this.goTo((this.step() - 1) as Step);
    }
  }

  // -----------------------------------------------------------------
  // Simpan & kirim
  // -----------------------------------------------------------------
  saveDraft(silent = false): void {
    if (this.readOnly() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.service.saveDraft(this.answers()).subscribe({
      next: (view) => {
        this.saving.set(false);
        this.status.set(view.status);
        if (!silent) {
          this.message.set({ type: 'success', text: 'Draf tersimpan. Kamu bisa melanjutkan kapan saja.' });
        }
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.message.set({ type: 'error', text: problemMessage(err, 'Draf gagal disimpan.') });
      },
    });
  }

  submit(): void {
    this.confirmed.markAsTouched();
    if (this.confirmed.invalid || !this.canOpen(4) || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.message.set(null);

    this.service.submit(this.answers()).subscribe({
      next: (view) => {
        this.submitting.set(false);
        this.applyData(view);
        // tahap KUESIONER sudah DONE di backend → muat ulang status sidebar & beranda
        this.progress.load().subscribe();
        this.message.set({ type: 'success', text: 'Kuesioner terkirim. Terima kasih!' });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.message.set({ type: 'error', text: problemMessage(err, 'Kuesioner gagal dikirim.') });
      },
    });
  }

  private answers(): KuesionerAnswers {
    const { aspiration, supportingActivities, interestIpa, interestIps } = this.aspirationForm.getRawValue();
    const { major1Id, major2Id } = this.majorForm.getRawValue();
    return {
      aspiration: aspiration.trim(),
      supportingActivities: supportingActivities.trim(),
      interestIpa,
      interestIps,
      major1Id,
      major2Id,
    };
  }

  readonly interestQuestions = [
    { key: 'interestIpa', title: 'Seberapa minat kamu dengan pelajaran IPA?', hint: 'Biologi, Fisika, Kimia, Matematika, Informatika' },
    { key: 'interestIps', title: 'Seberapa minat kamu dengan pelajaran IPS?', hint: 'Sosiologi, Ekonomi, Geografi, Sejarah' },
  ] as const;

  /** Pilihan skala minat 1–5 */
  readonly interestScale = [
    { value: 1, label: 'Sangat tidak minat' },
    { value: 2, label: 'Kurang minat' },
    { value: 3, label: 'Biasa saja' },
    { value: 4, label: 'Minat' },
    { value: 5, label: 'Sangat minat' },
  ];

  interestLabel(value: number | null): string {
    return this.interestScale.find((o) => o.value === value)?.label ?? '-';
  }

  // -----------------------------------------------------------------
  // Helper tampilan
  // -----------------------------------------------------------------
  isInvalid(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
