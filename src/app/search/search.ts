import { Component, OnInit } from '@angular/core';
import { DataService, Item } from '../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, take } from 'rxjs';
import { HighlightPipe } from '../shared/pipes/highlight-pipe';

@Component({
  selector: 'app-search',
  imports: [HighlightPipe],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  searchResults: Item[] = [];
  searchQuery = '';

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
  ) {}

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(
        take(1),
        switchMap((res) =>
          this.route.queryParams.pipe(map((params) => ({ res, query: params['q'] }))),
        ),
      )
      .subscribe(({ res, query }) => {
        this.searchQuery = query;
        this.performSearch(res, this.searchQuery);
      });
  }

  performSearch(data: Item[], query: string): void {
    const q = query.toLowerCase();

    this.searchResults = data
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
  }
}
