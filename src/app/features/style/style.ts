import { Component, inject, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping';
import { DataService, Group, Item } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { groupByAttribute } from 'src/app/shared/utils-helper';

@Component({
  selector: 'app-style',
  imports: [GroupingComponent],
  templateUrl: './style.html',
  styleUrl: './style.scss',
})
export class StyleComponent implements OnInit {
  private dataService = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);
  private scrollService = inject(ScrollService);

  groups: Group[] = [];
  loading = true;
  title = 'Architectural Styles';

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe((res: Item[]) => {
        this.groups = groupByAttribute(res, 'style');
        this.loading = false;
      });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
