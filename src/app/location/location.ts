import { Component } from '@angular/core';
import { groupByAttribute, sortAlphabetical } from '../shared/utils-helper';
import { take } from 'rxjs';
import { DataService, Group, Item } from '../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { ScrollService } from '../services/scroll.service';
import { Grouping } from '../shared/components/grouping/grouping';

@Component({
  selector: 'app-location',
  imports: [Grouping],
  templateUrl: './location.html',
  styleUrl: './location.scss'
})
export class Location {
  groups: Group[] = [];
  loading = true;
  title = 'Grouping by Continent';

  constructor(
    private dataService: DataService, 
    private activatedRoute: ActivatedRoute,
    private scrollService: ScrollService,
  ) {}

  ngOnInit(): void {
    this.dataService.getWonders().pipe(take(1)).subscribe((res: Item[]) => {
      const groups = sortAlphabetical(res, 'continent');
      this.groups = groupByAttribute(groups, 'continent');
      this.loading = false;
    });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
