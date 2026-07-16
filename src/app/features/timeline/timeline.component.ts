import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DataService, Group, StyleRange } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { LoaderComponent } from 'src/app/shared/components/loader/loader.component';
import { TimelineChartV2Component } from 'src/app/shared/components/timeline-chart-v2/timeline-chart-v2.component';
import { SlideInOnScrollDirective } from 'src/app/shared/directives/slide-in-on-scroll.directive';
import { groupByYearBuilt } from 'src/app/shared/utils-helper';

@Component({
  selector: 'app-timeline',
  imports: [
    LoaderComponent,
    RouterModule,
    SlideInOnScrollDirective,
    TimelineChartV2Component,
  ],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly scrollService = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);
  styles: StyleRange[] = [];

  groups: Group[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    forkJoin({
      wonders: this.dataService.getWonders(),
      styles: this.dataService.getStylesTimeline(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.groups = groupByYearBuilt(result.wonders);
          this.styles = result.styles;
          this.errorMessage = '';
          this.loading = false;
        },
        error: () => {
          this.groups = [];
          this.styles = [];
          this.errorMessage = 'Unable to load timeline data.';
          this.loading = false;
        },
      });

    this.activatedRoute.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fragment: string | null) => {
        if (fragment) this.scrollService.scrollToFragment(fragment);
      });
  }
}
