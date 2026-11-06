import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { problemCode, problemMessage } from '../../../core/api/problems';
import { LoginResponse } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity';
import { BRANDING } from '../../../core/config/branding';
import { BrandMark } from '../../../shared/brand-mark/brand-mark';

type Step = 'signin' | 'activate';

/**
 * Popup login di atas halaman depan (route /login).
 * Langkah 1: login Google.
 * Langkah 2 (hanya login pertama murid): aktivasi dengan kode sekolah + NIS + tanggal lahir.
 */
@Component({
  selector: 'app-login-dialog',
  imports: [ReactiveFormsModule, BrandMark],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginDialog implements AfterViewInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly google = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly zone = inject(NgZone);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly googleBtn = viewChild.required<ElementRef<HTMLElement>>('googleBtn');

  /** ID token Google disimpan di memori saja, dipakai ulang di langkah aktivasi. */
  private pendingIdToken: string | null = null;

  readonly branding = BRANDING;
  readonly today = new Date().toISOString().slice(0, 10);

  readonly step = signal<Step>('signin');
  readonly googleEmail = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPasswordForm = signal(false);

  readonly passwordForm = this.fb.group({
    schoolCode: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly activationForm = this.fb.group({
    schoolCode: ['', Validators.required],
    studentNumber: ['', Validators.required],
    birthDate: ['', Validators.required],
  });

  ngAfterViewInit(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }

    this.google
      .renderButton(this.googleBtn().nativeElement, (idToken) =>
        // callback Google berjalan di luar Angular
        this.zone.run(() => this.onGoogleCredential(idToken)),
      )
      .catch(() => this.error.set('Login Google sedang tidak tersedia. Gunakan username sekolah.'));
  }

  ngOnDestroy(): void {
    this.pendingIdToken = null;
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      dialog.close();
    }
  }

  // ---------------------------------------------------------------
  // Tutup popup
  // ---------------------------------------------------------------
  close(): void {
    this.router.navigate(['/']);
  }

  /** Tombol Esc. */
  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  /** Klik area gelap di luar kartu. */
  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  // ---------------------------------------------------------------
  // Langkah 1: Google
  // ---------------------------------------------------------------
  private onGoogleCredential(idToken: string): void {
    this.run(this.auth.loginWithGoogle(idToken), (err) => {
      if (problemCode(err) === 'ACCOUNT_NOT_LINKED') {
        // Login pertama murid → lanjut ke form aktivasi
        this.pendingIdToken = idToken;
        this.googleEmail.set(emailFromIdToken(idToken));
        this.step.set('activate');
        // pindahkan fokus ke judul baru supaya pembaca layar mengumumkan langkah aktivasi
        setTimeout(() => document.getElementById('login-title')?.focus());
        return true;
      }
      return false;
    });
  }

  // ---------------------------------------------------------------
  // Langkah 2: aktivasi akun murid
  // ---------------------------------------------------------------
  submitActivation(): void {
    if (this.activationForm.invalid) {
      this.activationForm.markAllAsTouched();
      return;
    }
    if (!this.pendingIdToken) {
      this.backToSignIn('Sesi Google habis. Silakan login dengan Google lagi.');
      return;
    }
    const { schoolCode, studentNumber, birthDate } = this.activationForm.getRawValue();

    this.run(
      this.auth.registerWithGoogle({
        idToken: this.pendingIdToken,
        schoolCode: schoolCode.trim(),
        studentNumber: studentNumber.trim(),
        birthDate,
      }),
      (err) => {
        // Token Google kedaluwarsa (±1 jam) → ulangi dari langkah 1
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.backToSignIn('Sesi Google habis. Silakan login dengan Google lagi.');
          return true;
        }
        return false;
      },
    );
  }

  /** "Gunakan akun Google lain" / sesi habis. */
  backToSignIn(message: string | null = null): void {
    this.pendingIdToken = null;
    this.googleEmail.set(null);
    this.activationForm.reset();
    this.step.set('signin');
    this.error.set(message);
    this.google.disableAutoSelect();
  }

  // ---------------------------------------------------------------
  // Login username & password (cadangan, terutama untuk staf)
  // ---------------------------------------------------------------
  togglePasswordForm(): void {
    this.showPasswordForm.update((shown) => !shown);
    this.error.set(null);
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { schoolCode, username, password } = this.passwordForm.getRawValue();
    this.run(this.auth.loginWithPassword(schoolCode.trim(), username.trim(), password));
  }

  isInvalid(form: 'password' | 'activation', field: string): boolean {
    const control: AbstractControl | null =
      form === 'password' ? this.passwordForm.get(field) : this.activationForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  // ---------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------

  /**
   * Jalankan request login. `handleError` boleh menangani error khusus (return true);
   * kalau tidak, pesan dari backend ditampilkan.
   */
  private run(request: Observable<LoginResponse>, handleError?: (err: unknown) => boolean): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    request.subscribe({
      next: (res) => {
        this.pendingIdToken = null;
        this.router.navigateByUrl(this.redirectTarget(res));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        if (handleError?.(err)) {
          return;
        }
        this.error.set(problemMessage(err, 'Login gagal. Periksa kembali data kamu.'));
      },
    });
  }

  /** Kembali ke halaman yang tadi dibuka; hanya path internal. */
  private redirectTarget(res: LoginResponse): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }
    return this.auth.homePath(res.user.role);
  }
}

/** Ambil email dari ID token Google, hanya untuk ditampilkan (verifikasi tetap di backend). */
function emailFromIdToken(idToken: string): string | null {
  try {
    const payload = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { email } = JSON.parse(atob(payload)) as { email?: unknown };
    return typeof email === 'string' ? email : null;
  } catch {
    return null;
  }
}
