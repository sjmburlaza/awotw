import { Component, OnInit } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { take } from 'rxjs';
import { groupByYearBuilt } from '../shared/utils-helper';
import { Loader } from '../shared/components/loader/loader';
import { TooltipDirective } from '../shared/components/tooltip/tooltip.directive';

@Component({
  selector: 'app-timeline',
  imports: [Loader, TooltipDirective],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline implements OnInit {
  groups: Group[] = [];
  loading = true;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getWonders().pipe(take(1)).subscribe((res: Item[]) => {
      this.groups = groupByYearBuilt(res);
      this.loading = false;
    });
  }
}
