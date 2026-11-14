import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

/* Tipe minimal untuk Google Identity Services yang kita pakai. */
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (res: GoogleCredentialResponse) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private loading: Promise<void> | null = null;

  /** Memuat script Google Sign-In sekali saja, hanya saat dibutuhkan. */
  load(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }
    if (!this.loading) {
      this.loading = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = GSI_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
          this.loading = null;
          reject(new Error('Gagal memuat Google Sign-In'));
        };
        document.head.appendChild(script);
      });
    }
    return this.loading;
  }

  /** Menampilkan tombol "Login dengan Google". `onIdToken` dipanggil dengan ID token dari Google. */
  async renderButton(container: HTMLElement, onIdToken: (idToken: string) => void, locale = 'id'): Promise<void> {
    await this.load();
    const gsi = window.google!.accounts.id;
    gsi.initialize({
      client_id: environment.googleClientId,
      callback: (res) => onIdToken(res.credential),
    });
    gsi.renderButton(container, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
      width: 280,
      locale, // bahasa teks tombol Google, mengikuti pilihan bahasa aplikasi
    });
  }

  /** Dipanggil saat logout supaya Google tidak langsung login otomatis lagi. */
  disableAutoSelect(): void {
    window.google?.accounts?.id?.disableAutoSelect();
  }
}
