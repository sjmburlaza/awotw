import { Component } from '@angular/core';
import { groupByAttribute, sortAlphabetical } from '../shared/utils-helper';
import { take } from 'rxjs';
import { DataService, Group, Item } from '../services/data.service';
import { ScrollService } from '../services/scroll.service';
import { ActivatedRoute } from '@angular/router';
import { Grouping } from '../shared/components/grouping/grouping';

@Component({
  selector: 'app-programmatic',
  imports: [Grouping],
  templateUrl: './programmatic.html',
  styleUrl: './programmatic.scss',
})
export class Programmatic {
  groups: Group[] = [];
  loading = true;
  title = 'Grouping by Use';

  constructor(
    private dataService: DataService,
    private activatedRoute: ActivatedRoute,
    private scrollService: ScrollService,
  ) {}

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe((res: Item[]) => {
        const groups = sortAlphabetical(res, 'buildingType');
        this.groups = groupByAttribute(groups, 'buildingType');
        this.loading = false;
      });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
