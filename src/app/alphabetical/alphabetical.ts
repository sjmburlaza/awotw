import { Component, inject, OnInit } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { ScrollService } from '../services/scroll.service';
import { groupByAttribute, sortAlphabetical } from '../shared/utils-helper';
import { take } from 'rxjs';
import { Grouping } from '../shared/components/grouping/grouping';

@Component({
  selector: 'app-alphabetical',
  imports: [Grouping],
  templateUrl: './alphabetical.html',
  styleUrl: './alphabetical.scss',
})
export class Alphabetical implements OnInit {
  private dataService = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);
  private scrollService = inject(ScrollService);
  groups: Group[] = [];
  loading = true;
  title = 'Alphabetical Grouping';

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe((res: Item[]) => {
        const groups = sortAlphabetical(res, 'name');
        this.groups = groupByAttribute(groups, 'name');
        this.loading = false;
      });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
