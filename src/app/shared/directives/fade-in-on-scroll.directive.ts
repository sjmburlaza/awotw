import { Directive, ElementRef, Renderer2, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[fadeInOnScroll]',
})
export class FadeInOnScrollDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'opacity 0.8s ease-out');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
            observer.unobserve(this.el.nativeElement);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(this.el.nativeElement);
  }
}
