import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  ComponentRef,
  ViewContainerRef,
  TemplateRef,
  inject,
} from '@angular/core';
import { Tooltip } from './tooltip';

type Position = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective {
  private el = inject(ElementRef);
  private vcr = inject(ViewContainerRef);

  @Input('appTooltip') tooltipContent: string | TemplateRef<any> = '';
  @Input() tooltipPosition: Position = 'bottom';

  private tooltipRef?: ComponentRef<Tooltip>;

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

    let top = 0,
      left = 0;
    const spaceBetweenTooltipAndTarget = 0;
    const tooltipWidth = 300;

    switch (this.tooltipPosition) {
      case 'top':
        top = targetRect.top - tooltipRect.height - spaceBetweenTooltipAndTarget + window.scrollY;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + spaceBetweenTooltipAndTarget + window.scrollY;
        left = targetRect.left - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2 + window.scrollY;
        left = targetRect.left - tooltipRect.width - spaceBetweenTooltipAndTarget;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2 + window.scrollY;
        left = targetRect.right + spaceBetweenTooltipAndTarget;
        break;
    }

    this.tooltipRef.instance.top = top;
    this.tooltipRef.instance.left = left;

    tooltipEl.style.visibility = 'visible';
  }
}
