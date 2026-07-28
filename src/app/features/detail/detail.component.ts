import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, take } from 'rxjs';
import { DataService, ExplanationMode, Item } from 'src/app/services/data.service';
import { LoaderTetrisComponent } from 'src/app/shared/components/loader-tetris/loader-tetris.component';
import { URL_PATH } from 'src/app/shared/constants/routes.const';
import { SortMode } from 'src/app/shared/constants/sort-mode.const';
import { sortWondersByMode } from 'src/app/shared/utils-helper';

type LensMode = ExplanationMode | 'wikipedia';

interface ExplanationOption {
  id: LensMode;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-detail',
  imports: [LoaderTetrisComponent],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
})
export class DetailComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadedImageUrls = new Set<string>();
  private imageLoadToken = 0;

  readonly URL_PATH = URL_PATH;
  details: Item | undefined;
  loading = true;
  currentDetailId: number | undefined;
  currentDetailIndex = -1;
  currentSortMode = SortMode.STYLE;
  wondersData: Item[] = [];
  errorMessage = '';
  selectedExplanationMode: LensMode = 'child';

  readonly explanationOptions: ExplanationOption[] = [
    { id: 'child', label: 'Explain like I’m 10', icon: 'bi-emoji-smile' },
    { id: 'student', label: 'Architecture student', icon: 'bi-rulers' },
    { id: 'tourist', label: 'Tourist summary', icon: 'bi-camera' },
    { id: 'engineering', label: 'Engineering perspective', icon: 'bi-gear' },
    { id: 'historical', label: 'Historical context', icon: 'bi-hourglass-split' },
    { id: 'wikipedia', label: 'From Wikipedia', icon: 'bi-wikipedia' },
  ];

  get selectedExplanationSummary(): string {
    if (this.selectedExplanationMode === 'wikipedia') {
      return this.details?.wiki?.extract || 'No Wikipedia description is available.';
    }

    return this.details?.explanations?.[this.selectedExplanationMode]?.summary || '';
  }

  get selectedExplanationSourceURL(): string | undefined {
    if (this.selectedExplanationMode === 'wikipedia') {
      return this.details?.wiki?.wikipedia;
    }

    return this.details?.explanations?.[this.selectedExplanationMode]?.sourceURL;
  }

  ngOnInit(): void {
    combineLatest({
      wonders: this.dataService.getWonders().pipe(take(1)),
      params: this.route.paramMap,
      queryParams: this.route.queryParamMap,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ wonders, params, queryParams }) => {
          const sortMode = this.parseSortMode(queryParams.get('sortMode'));
          const sortedWonders = sortWondersByMode(wonders, sortMode);

          this.currentSortMode = sortMode;
          this.wondersData = sortedWonders;
          const id = this.parseDetailId(params.get('id'));

          if (id === null) {
            this.showError('This wonder link is invalid.');
            return;
          }

          this.getDetails(id, sortedWonders);
        },
        error: () => {
          this.wondersData = [];
          this.showError('Unable to load this wonder.');
        },
      });
  }

  ngOnDestroy(): void {
    this.imageLoadToken++;
  }

  private parseDetailId(rawId: string | null): number | null {
    const id = Number(rawId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private parseSortMode(rawSortMode: string | null): SortMode {
    return Object.values(SortMode).includes(rawSortMode as SortMode)
      ? (rawSortMode as SortMode)
      : SortMode.STYLE;
  }

  private showError(message: string): void {
    this.imageLoadToken++;
    this.errorMessage = message;
    this.details = undefined;
    this.currentDetailId = undefined;
    this.currentDetailIndex = -1;
    this.loading = false;
  }

  getDetails(id: number, data: Item[]): void {
    const detailIndex = data.findIndex((d: Item) => d.id === id);

    if (detailIndex === -1) {
      this.showError('Wonder not found.');
      return;
    }

    this.errorMessage = '';
    this.currentDetailId = id;
    this.currentDetailIndex = detailIndex;
    this.details = data[detailIndex];
    this.selectedExplanationMode = 'child';
    this.loading = true;
    this.preloadDetailImage(this.details);
  }

  selectExplanationMode(mode: LensMode): void {
    this.selectedExplanationMode = mode;
  }

  goBack(): void {
    if (this.currentDetailIndex > 0) {
      const previous = this.wondersData[this.currentDetailIndex - 1];
      this.router.navigate([URL_PATH.DETAIL, previous.id], {
        queryParams: { sortMode: this.currentSortMode },
      });
    }
  }

  goNext(): void {
    if (this.currentDetailIndex >= 0 && this.currentDetailIndex < this.wondersData.length - 1) {
      const next = this.wondersData[this.currentDetailIndex + 1];
      this.router.navigate([URL_PATH.DETAIL, next.id], {
        queryParams: { sortMode: this.currentSortMode },
      });
    }
  }

  private preloadDetailImage(item: Item): void {
    const imageUrl = item.imageURL;
    const token = ++this.imageLoadToken;

    if (!imageUrl || this.loadedImageUrls.has(imageUrl)) {
      this.loading = false;
      return;
    }

    const image = new Image();

    image.decoding = 'async';
    image.fetchPriority = 'high';

    image.onload = () => {
      if (token !== this.imageLoadToken) return;

      this.loadedImageUrls.add(imageUrl);
      this.loading = false;
    };

    image.onerror = () => {
      if (token !== this.imageLoadToken) return;

      this.loading = false;
    };

    image.src = imageUrl;
  }
}
