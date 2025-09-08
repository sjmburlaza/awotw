import { Component } from '@angular/core';
import { Grouping } from '../shared/components/grouping/grouping';
import { DataService, Group, Item } from '../services/data.service';
import { ScrollService } from '../services/scroll.service';
import { take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { groupByAttribute } from '../shared/utils-helper';

@Component({
  selector: 'app-style',
  imports: [Grouping],
  templateUrl: './style.html',
  styleUrl: './style.scss'
})
export class Style {
  groups: Group[] = [];
  loading = true;
  title = 'Architectural Styles';

  constructor(
    private dataService: DataService, 
    private activatedRoute: ActivatedRoute,
    private scrollService: ScrollService,
  ) {}

  ngOnInit(): void {
    this.dataService.getWonders().pipe(take(1)).subscribe((res: Item[]) => {
      this.groups = groupByAttribute(res, 'style');
      this.loading = false;
    });

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }

}
