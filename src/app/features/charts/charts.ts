import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { DataService, MostVisited, TallestBuilding } from 'src/app/services/data.service';
import { BarChartComponent } from 'src/app/shared/components/bar-chart/bar-chart';
import { GalleryComponent } from 'src/app/shared/components/gallery/gallery';
import { GlobalChoroplethComponent } from 'src/app/shared/components/global-choropleth/global-choropleth';
import { LineChartComponent } from 'src/app/shared/components/line-chart/line-chart';
import { PieChartComponent } from 'src/app/shared/components/pie-chart/pie-chart';

@Component({
  selector: 'app-charts',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GlobalChoroplethComponent,
    PieChartComponent,
    BarChartComponent,
    LineChartComponent,
    GalleryComponent,
  ],
  templateUrl: './charts.html',
  styleUrl: './charts.scss',
})
export class ChartsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(DataService);

  categories = [
    { name: 'Tallest Buildings', code: 'tallest' },
    { name: 'Most Visited', code: 'mostVisited' },
  ];

  rankings = [
    { name: 'Top 20', code: '20' },
    { name: 'Top 50', code: '50' },
  ];

  isLoading = true;
  selectionForm!: FormGroup;

  tallestRawData: TallestBuilding[] = [];
  mostVisitedRawData: MostVisited[] = [];

  currentListTallestBuilding: TallestBuilding[] = [];
  currentListMostVisited: MostVisited[] = [];

  tallestBuildingsChoropleth: Record<string, number> = {};
  mostVisitedChoropleth: Record<string, number> = {};

  ngOnInit(): void {
    this.selectionForm = this.fb.group({
      category: ['tallest', Validators.required],
      ranking: ['20', Validators.required],
    });

    this.selectionForm.valueChanges.subscribe(() => {
      this.updateDisplayedData();
    });

    this.initTallestBuildings();
    this.initMostVisited();
  }

  initTallestBuildings(): void {
    this.dataService
      .getTallestBuildings()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.tallestRawData = [...res].sort((a, b) => Number(b.height_m) - Number(a.height_m));
          this.updateDisplayedData();
          this.isLoading = false;
        },
        error: (err) => console.error(err),
      });
  }

  initMostVisited(): void {
    this.dataService
      .getMostVisited()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.mostVisitedRawData = [...res].sort(
            (a, b) => Number(b.visitors_per_year) - Number(a.visitors_per_year),
          );
        },
        error: (err) => console.error(err),
      });
  }

  updateDisplayedData() {
    const limit = Number(this.rankingValue);

    this.currentListTallestBuilding = this.tallestRawData.slice(0, limit);
    this.currentListMostVisited = this.mostVisitedRawData.slice(0, limit);

    this.tallestBuildingsChoropleth = this.getChoroplethData(this.currentListTallestBuilding);
    this.mostVisitedChoropleth = this.getChoroplethData(this.currentListMostVisited);
  }

  getChoroplethData(rawdata: (TallestBuilding | MostVisited)[]): Record<string, number> {
    const data = [...rawdata];
    const map: Record<string, number> = {};

    data?.forEach((item: TallestBuilding | MostVisited) => {
      let key: string;

      if ('country' in item) {
        key = item.country?.split(', ')?.at(-1) || '';
      } else {
        key = item.location?.split(', ')?.at(-1) || '';
      }

      if (key.toUpperCase() === 'USA') {
        key = 'United States of America';
      }

      map[key] = (map[key] ?? 0) + 1;
    });

    return map;
  }

  get categoryValue() {
    return this.selectionForm.get('category')?.value;
  }

  get rankingValue() {
    return this.selectionForm.get('ranking')?.value;
  }
}
