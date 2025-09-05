import { Component } from '@angular/core';
import { DataService, Item } from '../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';

@Component({
  selector: 'app-search',
  imports: [],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class Search {
  searchResults: Item[] = [];

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.dataService.getWonders().pipe(take(1)).subscribe(res => {
      this.route.queryParams.subscribe(params => {
        const searchQuery = params['q'];
        this.performSearch(res, searchQuery)
      })
    });
  }

  performSearch(data: Item[], query: string): void {
    this.searchResults = data?.filter(item => {
      return item.name?.toLocaleLowerCase()?.includes(query?.toLocaleLowerCase());
    })
  }
}
