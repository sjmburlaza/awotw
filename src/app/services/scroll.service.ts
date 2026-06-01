import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  scrollToFragment(fragment: string, offset = 100): void {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(() => {
      attempts++;
      const el = document.getElementById(fragment);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);
  }
}
