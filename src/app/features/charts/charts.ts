import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TooltipItem } from 'chart.js';
import { take } from 'rxjs';
import { DataService, MostVisited, TallestBuilding } from 'src/app/services/data.service';
import { BarChartComponent } from 'src/app/shared/components/bar-chart/bar-chart';
import { GalleryComponent } from 'src/app/shared/components/gallery/gallery';
import { GlobalChoroplethComponent } from 'src/app/shared/components/global-choropleth/global-choropleth';
import { LineChartComponent } from 'src/app/shared/components/line-chart/line-chart';
import { PieChartComponent } from 'src/app/shared/components/pie-chart/pie-chart';
import { ordinalSuffix } from 'src/app/shared/utils-helper';

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

  tallestBuildingsRawData: TallestBuilding[] = [];
  mostVisitedRawData: MostVisited[] = [];

  currentListTallestBuildings: TallestBuilding[] = [];
  currentListMostVisited: MostVisited[] = [];

  tallestBuildingsChoropleth: Record<string, number> = {};
  mostVisitedChoropleth: Record<string, number> = {};

  tallestBuildingsBarChartTooltip = (item: TallestBuilding, index: number): string[] => {
    const rank = ordinalSuffix(index + 1);

    return [
      `Rank: ${rank}`,
      `Height: ${item.height_m} meters`,
      `Location: ${item.city}, ${item.country}`,
      `Year completed: ${item.year_completed}`,
    ];
  };

  mostVisitedBarChartTooltip = (item: MostVisited, index: number): string[] => {
    const rank = ordinalSuffix(index + 1);

    const visitors = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(item.visitors_per_year));

    return [
      `Rank: ${rank}`,
      `Visitors per year (approx.): ${visitors}`,
      `Location: ${item.location}`,
    ];
  };

  groupByCountry = (item: TallestBuilding) => item.country;
  groupByYear = (item: TallestBuilding) => item.year_completed;
  groupByCountryVisited = (item: MostVisited) => item.location.split(', ').at(-1) ?? '';

  tallestBuildingsPieChartTooltip = (
    item: TallestBuilding,
    context: TooltipItem<'pie'>,
    allData: TallestBuilding[],
  ): string[] => {
    const filtered = allData.filter(
      (i) => i.country === context.label || i.year_completed === context.label,
    );

    return [`Count: ${context.raw}`, 'Building(s):', ...filtered.map((i) => i.name)];
  };

  mostVisitedPieChartTooltip = (
    item: MostVisited,
    context: TooltipItem<'pie'>,
    allData: MostVisited[],
  ): string[] => {
    const filtered = allData.filter((i) => i.location.split(', ').at(-1) === context.label);

    return [`Count: ${context.raw}`, 'Places:', ...filtered.map((i) => i.name)];
  };

  tallestBuildingsLineChartTooltip = (
    item: TallestBuilding | undefined,
    context: TooltipItem<'line'>,
  ): string[] => {
    return [
      `Tallest Building: ${item?.name ?? 'N/A'}`,
      `Building Location: ${item?.city ?? 'N/A'}, ${item?.country ?? 'N/A'}`,
      `Height: ${context.raw} meters`,
    ];
  };

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
          this.tallestBuildingsRawData = [...res].sort(
            (a, b) => Number(b.height_m) - Number(a.height_m),
          );
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

  updateDisplayedData(): void {
    const limit = Number(this.rankingValue);

    this.currentListTallestBuildings = this.tallestBuildingsRawData.slice(0, limit);
    this.currentListMostVisited = this.mostVisitedRawData.slice(0, limit);

    this.tallestBuildingsChoropleth = this.getChoroplethData(this.currentListTallestBuildings);
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
