import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  ComponentRef,
  ViewContainerRef,
  TemplateRef
} from '@angular/core';
import { Tooltip } from './tooltip';

type Position = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective {
  @Input('appTooltip') tooltipContent: string | TemplateRef<any> = '';
  @Input() tooltipPosition: Position = 'bottom';

  private tooltipRef?: ComponentRef<Tooltip>;

  constructor(private el: ElementRef, private vcr: ViewContainerRef) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.tooltipRef) return;

    this.tooltipRef = this.vcr.createComponent(Tooltip);

    // If template passed, use it; otherwise text
    if (this.tooltipContent instanceof TemplateRef) {
      this.tooltipRef.instance.template = this.tooltipContent;
    } else {
      this.tooltipRef.instance.text = this.tooltipContent;
    }

    this.positionTooltip();
    this.tooltipRef.instance.visible = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.tooltipRef) {
      this.tooltipRef.destroy();
      this.tooltipRef = undefined;
    }
  }

  private positionTooltip() {
    if (!this.tooltipRef) return;

    const targetRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipEl = this.tooltipRef.location.nativeElement as HTMLElement;

    // Temporary show for measurement
    tooltipEl.style.visibility = 'hidden';
    document.body.appendChild(tooltipEl);
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let top = 0, left = 0;
    const tooltipTargetSpace = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = targetRect.top - tooltipRect.height - tooltipTargetSpace + window.scrollY;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + tooltipTargetSpace + window.scrollY;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2 + window.scrollY;
        left = targetRect.left - tooltipRect.width - tooltipTargetSpace;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2 + window.scrollY;
        left = targetRect.right + tooltipTargetSpace;
        break;
    }

    // Smart repositioning
    if (left < 0) left = tooltipTargetSpace;
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - tooltipTargetSpace;
    }
    if (top < window.scrollY) {
      top = targetRect.bottom + tooltipTargetSpace + window.scrollY;
    }
    if (top + tooltipRect.height > window.scrollY + window.innerHeight) {
      top = targetRect.top - tooltipRect.height - tooltipTargetSpace + window.scrollY;
    }

    this.tooltipRef.instance.top = top;
    this.tooltipRef.instance.left = left;

    tooltipEl.style.visibility = 'visible';
  }
}
