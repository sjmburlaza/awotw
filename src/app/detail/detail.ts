import { Component, OnInit } from '@angular/core';
import { DataService, Item } from '../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { URL } from '../shared/constants/routes.const';

@Component({
  selector: 'app-detail',
  imports: [],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class Detail implements OnInit {
  readonly URL = URL;
  details: Item | undefined;
  loading = true;
  currentDetailId: number | undefined;
  wondersData: Item[] = [];
  
  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentDetailId = parseInt(this.route.snapshot.paramMap.get('id')!, 10);
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => {
      this.wondersData = res;
      if (this.currentDetailId) {
        this.getDetails(this.currentDetailId, res);
      }
    });
  }

  getDetails(id: number, data: Item[]): void {
    this.details = data.find((d: Item) => d.id === id);
  }

  goBack(): void {
    if (this.currentDetailId) {
      this.currentDetailId--;
      this.router.navigate([URL.DETAIL + '/' + this.currentDetailId]);
      this.loading = true;
      this.getDetails(this.currentDetailId, this.wondersData);
    }
  }

  goNext(): void {
    if (this.currentDetailId) {
      this.currentDetailId++;
      this.router.navigate([URL.DETAIL + '/' + this.currentDetailId]);
      this.loading = true;
      this.getDetails(this.currentDetailId, this.wondersData);
    }
  }
}
