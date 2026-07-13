import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Group } from '../../../services/data.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-grouping',
  imports: [TooltipDirective],
  templateUrl: './grouping.component.html',
  styleUrl: './grouping.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupingComponent {
  @Input({ required: true }) groups!: Group[];
  @Input({ required: true }) title = '';
  @Input() errorMessage = '';
}
