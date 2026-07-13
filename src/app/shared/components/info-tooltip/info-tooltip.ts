import { Component, Input } from '@angular/core';

let nextTooltipId = 0;

@Component({
  selector: 'app-info-tooltip',
  imports: [],
  templateUrl: './info-tooltip.html',
  styleUrl: './info-tooltip.scss',
})
export class InfoTooltipComponent {
  @Input() text = '';
  @Input() ariaLabel = 'More information';
  @Input() tooltipId = '';
  @Input() imageSrc = '';
  @Input() imageAlt = '';

  private readonly generatedTooltipId = `info-tooltip-${nextTooltipId++}`;

  get resolvedTooltipId(): string {
    return this.tooltipId || this.generatedTooltipId;
  }
}
