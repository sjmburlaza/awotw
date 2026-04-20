import { Component, inject, OnInit } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping';
import { DataService, Group } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { groupByAttribute } from 'src/app/shared/utils-helper';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-style',
  imports: [GroupingComponent, AsyncPipe],
  templateUrl: './style.html',
  styleUrl: './style.scss',
})
export class StyleComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly scrollService = inject(ScrollService);

  groups$: Observable<Group[]> = of([]);
  title = 'Architectural Styles';

  ngOnInit(): void {
    this.groups$ = this.dataService.getWonders().pipe(
      map((items) => groupByAttribute(items, 'style')),
      catchError(() => of([])),
    );

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
