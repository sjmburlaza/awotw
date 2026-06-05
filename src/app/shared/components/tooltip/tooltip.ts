import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  imports: [CommonModule],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
})
export class TooltipComponent {
  @Input() text = '';
  @Input() template?: TemplateRef<unknown>;
  @Input() top = 0;
  @Input() left = 0;
  visible = false;
}
