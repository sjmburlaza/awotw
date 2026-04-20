import { Component, inject, OnInit } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping';
import { DataService, Group } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { groupByAttribute, sortAlphabetical } from 'src/app/shared/utils-helper';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-programmatic',
  imports: [GroupingComponent, AsyncPipe],
  templateUrl: './programmatic.html',
  styleUrl: './programmatic.scss',
})
export class ProgrammaticComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly scrollService = inject(ScrollService);

  groups$: Observable<Group[]> = of([]);
  title = 'Grouping by Use';

  ngOnInit(): void {
    this.groups$ = this.dataService.getWonders().pipe(
      map((items) =>
        groupByAttribute(sortAlphabetical([...items], 'buildingType'), 'buildingType'),
      ),
      catchError(() => of([])),
    );

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
