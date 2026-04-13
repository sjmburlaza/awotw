import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DataService, Group, StyleRange } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { LoaderComponent } from 'src/app/shared/components/loader/loader';
import { TooltipDirective } from 'src/app/shared/components/tooltip/tooltip.directive';
import { SlideInOnScrollDirective } from 'src/app/shared/directives/slide-in-on-scroll.directive';
import { groupByYearBuilt } from 'src/app/shared/utils-helper';
import { TimelineChartComponent } from 'src/app/features/timeline-chart/timeline-chart';

@Component({
  selector: 'app-timeline',
  imports: [LoaderComponent, TooltipDirective, SlideInOnScrollDirective, TimelineChartComponent],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class TimelineComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly scrollService = inject(ScrollService);
  styles: StyleRange[] = [];

  groups: Group[] = [];
  loading = true;

  ngOnInit(): void {
    forkJoin({
      wonders: this.dataService.getWonders(),
      styles: this.dataService.getStylesTimeline()
    }).subscribe({
      next: (result) => {
        this.groups = groupByYearBuilt(result.wonders);
        this.styles = result.styles;
        this.loading = false;
      },
      error: (err) => console.error(err)
    });
    
    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment);
    });
  }
}
