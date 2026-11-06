import { HttpErrorResponse } from '@angular/common/http';

/** Format error dari backend (Problem Details / RFC 9457). */
export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

/** Ambil pesan yang layak ditampilkan ke user dari error HTTP. */
export function problemMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Tidak bisa terhubung ke server. Periksa koneksi internet kamu.';
    }
    const body = error.error as Problem | null;
    if (body && typeof body === 'object') {
      if (body.detail) return body.detail;
      if (body.title) return body.title;
    }
  }
  return fallback;
}

/** Ambil `code` bisnis dari error (misal 'STUDENT_LOCKED'), untuk logika khusus di UI. */
export function problemCode(error: unknown): string | null {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    return (error.error as Problem).code ?? null;
  }
  return null;
}
