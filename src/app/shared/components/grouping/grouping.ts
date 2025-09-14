import { Component, Input } from '@angular/core';
import { Group } from '../../../services/data.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-grouping',
  imports: [TooltipDirective],
  templateUrl: './grouping.html',
  styleUrl: './grouping.scss',
})
export class GroupingComponent {
  @Input() groups: Group[] | undefined;
  @Input() title = '';
}
