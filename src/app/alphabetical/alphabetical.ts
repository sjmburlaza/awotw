import { Component } from '@angular/core';
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
  styleUrl: './alphabetical.scss'
})
export class Alphabetical {
  groups: Group[] = [];
  loading = true;
  title = 'Alphabetical Grouping';

  constructor(
    private dataService: DataService, 
    private activatedRoute: ActivatedRoute,
    private scrollService: ScrollService,
  ) {}

  ngOnInit(): void {
    this.dataService.getWonders().pipe(take(1)).subscribe((res: Item[]) => {
      const groups = sortAlphabetical(res, 'name');
      this.groups = groupByAttribute(groups, 'name');
      this.loading = false;
    });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
