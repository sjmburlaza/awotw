import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  imports: [],
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.scss',
})
export class BackToTopComponent {
  isVisible = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isVisible = window.scrollY > 400;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
