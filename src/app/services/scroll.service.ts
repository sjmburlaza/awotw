import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  scrollToFragment(fragment: string, offset = 100, timeoutMs = 2000): void {
    const pollIntervalMs = 100;
    const timeoutAt = Date.now() + timeoutMs;

    const interval = setInterval(() => {
      const el = document.getElementById(fragment);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        clearInterval(interval);
      } else if (Date.now() >= timeoutAt) {
        clearInterval(interval);
      }
    }, pollIntervalMs);
  }
}
