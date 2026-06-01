import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, take } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

@Component({
  selector: 'app-detail',
  imports: [],
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
})
export class DetailComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly URL_PATH = URL_PATH;
  details: Item | undefined;
  loading = true;
  currentDetailId: number | undefined;
  currentDetailIndex = -1;
  wondersData: Item[] = [];
  errorMessage = '';

  ngOnInit(): void {
    combineLatest({
      wonders: this.dataService.getWonders().pipe(take(1)),
      params: this.route.paramMap,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ wonders, params }) => {
          this.wondersData = wonders;
          const id = this.parseDetailId(params.get('id'));

          if (id === null) {
            this.showError('This wonder link is invalid.');
            return;
          }

          this.getDetails(id, wonders);
        },
        error: () => {
          this.wondersData = [];
          this.showError('Unable to load this wonder.');
        },
      });
  }

  private parseDetailId(rawId: string | null): number | null {
    const id = Number(rawId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private showError(message: string): void {
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
    this.loading = true;
  }

  goBack(): void {
    if (this.currentDetailIndex > 0) {
      const previous = this.wondersData[this.currentDetailIndex - 1];
      this.router.navigate([`${URL_PATH.DETAIL}/${previous.id}`]);
    }
  }

  goNext(): void {
    if (this.currentDetailIndex >= 0 && this.currentDetailIndex < this.wondersData.length - 1) {
      const next = this.wondersData[this.currentDetailIndex + 1];
      this.router.navigate([`${URL_PATH.DETAIL}/${next.id}`]);
    }
  }
}
