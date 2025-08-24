import { Component, OnInit } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { take } from 'rxjs';
import { groupByYearBuilt } from '../shared/utils-helper';
import { animate, style, transition, trigger } from '@angular/animations';
import { Loader } from '../shared/components/loader/loader';
import { Tooltip } from '../shared/components/tooltip/tooltip';

@Component({
  selector: 'app-timeline',
  imports: [Loader, Tooltip],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline implements OnInit {
  groups: Group[] = [];
  loading = true;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => {
      this.groups = groupByYearBuilt(res);
      this.loading = false;
    });
  }
}
