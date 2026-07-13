import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, take } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { HighlightPipe } from 'src/app/shared/pipes/highlight.pipe';

@Component({
  selector: 'app-search',
  imports: [HighlightPipe],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);

  searchResults: Item[] = [];
  searchQuery = '';
  errorMessage = '';
  emptyMessage = 'Enter a search term to find a wonder.';

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(
        take(1),
        switchMap((res) =>
          this.route.queryParamMap.pipe(
            map((params) => ({ res, query: params.get('q')?.trim() ?? '' })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ res, query }) => {
          this.errorMessage = '';
          this.searchQuery = query;
          this.performSearch(res, this.searchQuery);
        },
        error: () => {
          this.searchResults = [];
          this.errorMessage = 'Unable to load wonders for search.';
          this.emptyMessage = '';
        },
      });
  }

  performSearch(data: Item[], query: string): void {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      this.searchResults = [];
      this.emptyMessage = 'Enter a search term to find a wonder.';
      return;
    }

    const q = trimmedQuery.toLowerCase();

    this.searchResults = [...data]
      ?.filter((item) => item.name?.toLowerCase().includes(q))
      ?.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        const score = (name: string): number => {
          if (name === q) return 3;
          if (name.startsWith(q)) return 2;
          return 1;
        };

        return score(bName) - score(aName);
      });

    this.emptyMessage = this.searchResults.length ? '' : `No wonders found for "${trimmedQuery}".`;
  }
}
