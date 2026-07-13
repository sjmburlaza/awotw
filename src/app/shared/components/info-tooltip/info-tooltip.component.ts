import { Component, Input } from '@angular/core';

type InfoTooltipPlacement = 'top' | 'right';

let nextTooltipId = 0;

@Component({
  selector: 'app-info-tooltip',
  imports: [],
  templateUrl: './info-tooltip.component.html',
  styleUrl: './info-tooltip.component.scss',
})
export class InfoTooltipComponent {
  @Input() text = '';
  @Input() ariaLabel = 'More information';
  @Input() tooltipId = '';
  @Input() imageSrc = '';
  @Input() imageAlt = '';
  @Input() placement: InfoTooltipPlacement = 'top';

  private readonly generatedTooltipId = `info-tooltip-${nextTooltipId++}`;

  get resolvedTooltipId(): string {
    return this.tooltipId || this.generatedTooltipId;
  }
}
