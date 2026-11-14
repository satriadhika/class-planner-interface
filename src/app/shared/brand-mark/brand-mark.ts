import { Component, input, signal } from '@angular/core';

import { BRANDING } from '../../core/config/branding';

/**
 * Logo sekolah.
 * Default memakai BRANDING.logoUrl. Kalau gambar gagal dimuat, tampil logo Class Planner.
 */
@Component({
  selector: 'app-brand-mark',
  template: `
    @if (!failed()) {
      <img [src]="src()" [alt]="alt()" [width]="size()" [height]="size()" (error)="failed.set(true)" />
    } @else {
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 40 40" role="img" [attr.aria-label]="alt()">
        <defs>
          <linearGradient id="cp-brand-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#3b74f0" />
            <stop offset="1" stop-color="#0f1f3d" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#cp-brand-gradient)" />
        <rect x="9" y="9" width="10" height="10" rx="3" fill="#ffffff" />
        <rect x="21" y="9" width="10" height="10" rx="3" fill="#ffffff" opacity="0.5" />
        <rect x="9" y="21" width="10" height="10" rx="3" fill="#ffffff" opacity="0.5" />
        <rect x="21" y="21" width="10" height="10" rx="3" fill="#ef6c5a" />
      </svg>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
    img {
      object-fit: contain;
    }
  `,
})
export class BrandMark {
  readonly size = input(40);
  readonly src = input(BRANDING.logoUrl);
  readonly alt = input(`Logo ${BRANDING.schoolName}`);

  readonly failed = signal(false);
}
