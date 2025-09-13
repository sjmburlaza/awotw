import { Directive, ElementRef, Renderer2, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[slideInOnScroll]',
})
export class SlideInOnScrollDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(50px)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.8s ease-out');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
            this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateX(0)');
            observer.unobserve(this.el.nativeElement);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(this.el.nativeElement);
  }
}
