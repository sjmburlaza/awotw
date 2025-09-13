import { Component, OnInit, inject } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { groupByYearBuilt } from '../shared/utils-helper';
import { Loader } from '../shared/components/loader/loader';
import { TooltipDirective } from '../shared/components/tooltip/tooltip.directive';
import { SlideInOnScrollDirective } from '../shared/directives/slide-in-on-scroll.directive';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { ScrollService } from '../services/scroll.service';

@Component({
  selector: 'app-timeline',
  imports: [Loader, TooltipDirective, SlideInOnScrollDirective],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class Timeline implements OnInit {
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
