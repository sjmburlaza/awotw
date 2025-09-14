import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

@Component({
  selector: 'app-detail',
  imports: [],
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
})
export class DetailComponent implements OnInit {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly URL_PATH = URL_PATH;
  details: Item | undefined;
  loading = true;
  currentDetailId: number | undefined;
  wondersData: Item[] = [];

  ngOnInit() {
    this.currentDetailId = parseInt(this.route.snapshot.paramMap.get('id')!, 10);
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe((res: Item[]) => {
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
      this.router.navigate([URL_PATH.DETAIL + '/' + this.currentDetailId]);
      this.loading = true;
      this.getDetails(this.currentDetailId, this.wondersData);
    }
  }

  goNext(): void {
    if (this.currentDetailId) {
      this.currentDetailId++;
      this.router.navigate([URL_PATH.DETAIL + '/' + this.currentDetailId]);
      this.loading = true;
      this.getDetails(this.currentDetailId, this.wondersData);
    }
  }
}
