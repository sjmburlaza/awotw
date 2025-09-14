import { Component, inject, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping';
import { DataService, Group, Item } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { groupByAttribute, sortAlphabetical } from 'src/app/shared/utils-helper';

@Component({
  selector: 'app-location',
  imports: [GroupingComponent],
  templateUrl: './location.html',
  styleUrl: './location.scss',
})
export class LocationComponent implements OnInit {
  private dataService = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);
  private scrollService = inject(ScrollService);

  groups: Group[] = [];
  loading = true;
  title = 'Grouping by Continent';

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe((res: Item[]) => {
        const groups = sortAlphabetical(res, 'continent');
        this.groups = groupByAttribute(groups, 'continent');
        this.loading = false;
      });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
