import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  scrollToFragment(fragment: string, offset: number = 100) {
    const interval = setInterval(() => {
      const el = document.getElementById(fragment);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        clearInterval(interval);
      }
    }, 100);
  }
}
