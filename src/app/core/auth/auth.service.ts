import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CurrentUser, LoginResponse, ROLE_HOME, Role, TeacherRegisterResponse } from './auth.models';

const TOKEN_KEY = 'cp.token';
const USER_KEY = 'cp.user';

/** Data aktivasi akun murid pada login Google pertama. */
export interface GoogleRegisterRequest {
  idToken: string;
  schoolCode: string;
  studentNumber: string;
  /** Format ISO: 'YYYY-MM-DD' (nilai bawaan <input type="date">) */
  birthDate: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUser = signal<CurrentUser | null>(this.restoreUser());

  /** User yang sedang login (null kalau belum login). */
  readonly user = this.currentUser.asReadonly();
  readonly role = computed(() => this.currentUser()?.role ?? null);

  /** Token yang masih berlaku, atau null. */
  get token(): string | null {
    const token = readStorage(TOKEN_KEY);
    return token && !isTokenExpired(token) ? token : null;
  }

  /** Dipakai guard: true kalau user ada dan token belum kedaluwarsa. */
  hasValidSession(): boolean {
    if (this.currentUser() && this.token) {
      return true;
    }
    this.clearSession();
    return false;
  }

  /** Email sudah terhubung → login. Belum → error 422 dengan code 'ACCOUNT_NOT_LINKED'. */
  loginWithGoogle(idToken: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/google`, { idToken })
      .pipe(tap((res) => this.storeSession(res)));
  }

  /** Aktivasi akun murid: kode sekolah + NIS + tanggal lahir, dengan ID token Google yang sama. */
  registerWithGoogle(request: GoogleRegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/google/register`, request)
      .pipe(tap((res) => this.storeSession(res)));
  }

  /** Pendaftaran guru: kode sekolah + NIP/kode guru. Tidak langsung login (menunggu persetujuan waka). */
  registerTeacher(request: { idToken: string; schoolCode: string; teacherCode: string }): Observable<TeacherRegisterResponse> {
    return this.http.post<TeacherRegisterResponse>(`${environment.apiUrl}/auth/google/register-teacher`, request);
  }

  /** Ambil ulang data user (misalnya menu waka yang baru diubah super admin). */
  refreshUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch {
          // abaikan
        }
        this.currentUser.set(user);
      }),
    );
  }

  loginWithPassword(schoolCode: string, username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { schoolCode, username, password })
      .pipe(tap((res) => this.storeSession(res)));
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  homePath(role: Role | null = this.role()): string {
    return role ? ROLE_HOME[role] : '/login';
  }

  private storeSession(res: LoginResponse): void {
    try {
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      // Storage diblokir (mode privat): sesi tetap jalan selama tab terbuka
    }
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // abaikan
    }
    this.currentUser.set(null);
  }

  private restoreUser(): CurrentUser | null {
    const token = readStorage(TOKEN_KEY);
    const raw = readStorage(USER_KEY);
    if (!token || !raw || isTokenExpired(token)) {
      return null;
    }
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Baca klaim `exp` dari JWT tanpa verifikasi (verifikasi tetap di backend). */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    // anggap kedaluwarsa 30 detik lebih awal supaya tidak terpotong di tengah request
    return typeof exp !== 'number' || exp * 1000 - 30_000 <= Date.now();
  } catch {
    return true;
  }
}
