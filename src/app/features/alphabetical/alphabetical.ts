import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { DataService, Group, Item } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping';
import { groupByAttribute, sortAlphabetical } from 'src/app/shared/utils-helper';

@Component({
  selector: 'app-alphabetical',
  imports: [GroupingComponent],
  templateUrl: './alphabetical.html',
  styleUrl: './alphabetical.scss',
})
export class AlphabeticalComponent implements OnInit {
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
