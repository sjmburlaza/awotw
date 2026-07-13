import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { DataService, Group } from 'src/app/services/data.service';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping.component';
import { SortMode } from 'src/app/shared/constants/sort-mode.const';
import { groupWondersBySortMode } from 'src/app/shared/utils-helper';
import { ScrollService } from 'src/app/services/scroll.service';

export type WonderGroupFeature = 'alphabetical' | 'location' | 'programmatic' | 'style';

interface WonderGroupConfig {
  mode: SortMode;
  title: string;
  errorMessage: string;
}

const DEFAULT_FEATURE: WonderGroupFeature = 'alphabetical';

const WONDER_GROUP_CONFIGS: Record<WonderGroupFeature, WonderGroupConfig> = {
  alphabetical: {
    mode: SortMode.ALPHABETICAL,
    title: 'Alphabetical Grouping',
    errorMessage: 'Unable to load alphabetical groups.',
  },
  location: {
    mode: SortMode.LOCATION,
    title: 'Grouping by Continent',
    errorMessage: 'Unable to load location groups.',
  },
  programmatic: {
    mode: SortMode.PROGRAMMATIC,
    title: 'Grouping by Use',
    errorMessage: 'Unable to load use groups.',
  },
  style: {
    mode: SortMode.STYLE,
    title: 'Architectural Styles',
    errorMessage: 'Unable to load architectural styles.',
  },
};

@Component({
  selector: 'app-wonder-groups',
  imports: [GroupingComponent, AsyncPipe],
  template: `
    @if (groups$ | async; as groups) {
      <app-grouping [groups]="groups" [title]="title" [errorMessage]="errorMessage"> </app-grouping>
    } @else {
      <div class="state-message">Loading groups...</div>
    }
  `,
})
export class WonderGroupsComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly scrollService = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);

  private groupingConfig = WONDER_GROUP_CONFIGS[DEFAULT_FEATURE];

  groups$: Observable<Group[]> = of([]);
  title = this.groupingConfig.title;
  errorMessage = '';

  ngOnInit(): void {
    this.groupingConfig = this.getGroupingConfig();
    this.title = this.groupingConfig.title;

    this.groups$ = this.dataService.getWonders().pipe(
      tap(() => (this.errorMessage = '')),
      map((items) => groupWondersBySortMode(items, this.groupingConfig.mode)),
      catchError(() => {
        this.errorMessage = this.groupingConfig.errorMessage;
        return of([]);
      }),
    );

    this.activatedRoute.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fragment: string | null) => {
        if (fragment) this.scrollService.scrollToFragment(fragment, 50);
      });
  }

  private getGroupingConfig(): WonderGroupConfig {
    const feature = this.activatedRoute.snapshot.data['feature'];

    if (isWonderGroupFeature(feature)) {
      return WONDER_GROUP_CONFIGS[feature];
    }

    return WONDER_GROUP_CONFIGS[DEFAULT_FEATURE];
  }
}

function isWonderGroupFeature(value: unknown): value is WonderGroupFeature {
  return typeof value === 'string' && value in WONDER_GROUP_CONFIGS;
}
