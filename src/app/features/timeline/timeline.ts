import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { DataService, Group, Item } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { LoaderComponent } from 'src/app/shared/components/loader/loader';
import { TooltipDirective } from 'src/app/shared/components/tooltip/tooltip.directive';
import { SlideInOnScrollDirective } from 'src/app/shared/directives/slide-in-on-scroll.directive';
import { groupByYearBuilt } from 'src/app/shared/utils-helper';

@Component({
  selector: 'app-timeline',
  imports: [LoaderComponent, TooltipDirective, SlideInOnScrollDirective],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class TimelineComponent implements OnInit {
  private dataService = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);
  private scrollService = inject(ScrollService);

  groups: Group[] = [];
  loading = true;

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe((res: Item[]) => {
        this.groups = groupByYearBuilt(res);
        this.loading = false;
      });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment);
    });
  }
}
