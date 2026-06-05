import { Directive, Input } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'canvas[baseChart]',
  standalone: true,
})
export class BaseChartDirective {
  @Input() data: unknown;
  @Input() options: unknown;
  @Input() type: unknown;
}
