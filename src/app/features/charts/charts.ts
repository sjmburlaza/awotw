import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js';
import { take } from 'rxjs';
import { DataService, MostVisited, TallestBuilding } from 'src/app/services/data.service';
import { ChartComponent } from 'src/app/shared/components/chart/chart';
import { GlobalChoroplethComponent } from 'src/app/shared/components/global-choropleth/global-choropleth';
import { PieChartComponent } from 'src/app/shared/components/pie-chart/pie-chart';
import { FadeInOnScrollDirective } from 'src/app/shared/directives/fade-in-on-scroll.directive';
import { SlideInOnScrollDirective } from 'src/app/shared/directives/slide-in-on-scroll.directive';
import { CompactNumberPipe } from 'src/app/shared/pipes/compact-number-pipe';
import { ordinalSuffix } from 'src/app/shared/utils-helper';

@Component({
  selector: 'app-charts',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ChartComponent,
    CompactNumberPipe,
    FadeInOnScrollDirective,
    SlideInOnScrollDirective,
    GlobalChoroplethComponent,
    PieChartComponent,
  ],
  templateUrl: './charts.html',
  styleUrl: './charts.scss',
})
export class ChartsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);

  categories = [
    {
      name: 'Tallest Buildings',
      code: 'tallest',
    },
    {
      name: 'Most Visited',
      code: 'mostVisited',
    },
  ];

  rankings = [
    {
      name: 'Top 20',
      code: '20',
    },
    {
      name: 'Top 50',
      code: '50',
    },
  ];

  isLoading = true;
  selectionForm!: FormGroup;
  tallestRawData: TallestBuilding[] = [];
  mostVisitedRawData: MostVisited[] = [];

  // Bar chart data
  tallestBuildingsBarData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  mostVisitedBarData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Line chart data
  tallestBuildingsLineData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Chart Options
  tallestBuildingsBarChartOptions!: ChartOptions<'bar'>;
  mostVisitedBarChartOptions!: ChartOptions<'bar'>;
  tallestBuildingsLineChartOptions!: ChartOptions<'line'>;

  currentListTallestBuilding: TallestBuilding[] = [];
  currentListMostVisited: MostVisited[] = [];

  tallestBuildingsChoropleth: Record<string, number> = {};
  mostVisitedChoropleth: Record<string, number> = {};

  ngOnInit(): void {
    this.selectionForm = this.fb.group({
      category: ['tallest', Validators.required],
      ranking: ['20', Validators.required],
    });

    this.selectionForm.get('ranking')?.valueChanges.subscribe((ranking) => {
      if (ranking === '50') {
        const top50tallest = [...this.tallestRawData];
        const top50mostVisited = [...this.mostVisitedRawData];
        this.currentListTallestBuilding = top50tallest;
        this.currentListMostVisited = top50mostVisited;
        this.getTallestBuildingsData(top50tallest);
        this.getMostVisitedData(top50mostVisited);
      } else {
        const top20tallest = [...this.tallestRawData].slice(0, 20);
        const top20mostVisited = [...this.mostVisitedRawData].slice(0, 20);
        this.currentListTallestBuilding = top20tallest;
        this.currentListMostVisited = top20mostVisited;
        this.getTallestBuildingsData(top20tallest);
        this.getMostVisitedData(top20mostVisited);
      }
    });

    this.initTallestBuildings();
    this.initMostVisited();
  }

  initTallestBuildings(): void {
    this.dataService
      .getTallestBuildings()
      .pipe(take(1))
      .subscribe((res) => {
        this.tallestRawData = res.sort((a, b) => Number(b.height_m) - Number(a.height_m));
        const top20tallest = [...this.tallestRawData].slice(0, 20);
        this.currentListTallestBuilding = top20tallest;
        this.getTallestBuildingsData(top20tallest);
        this.isLoading = false;
      });
  }

  initMostVisited(): void {
    this.dataService
      .getMostVisited()
      .pipe(take(1))
      .subscribe((res) => {
        this.mostVisitedRawData = res.sort(
          (a, b) => Number(b.visitors_per_year) - Number(a.visitors_per_year),
        );
        const top20mostVisited = [...this.mostVisitedRawData].slice(0, 20);
        this.currentListMostVisited = top20mostVisited;
        this.getMostVisitedData(top20mostVisited);
      });
  }

  getTallestBuildingsData(data: TallestBuilding[]): void {
    this.tallestBuildingsBarData = this.getBarChartData(data, 'height_m');
    this.tallestBuildingsBarChartOptions = this.getTallestBuildingsBarChartOptions(data);
    this.tallestBuildingsChoropleth = this.getChoroplethData(data);
    this.tallestBuildingsLineData = this.getLineData(data);
    this.tallestBuildingsLineChartOptions = this.getLineChartOptions(data);
  }

  getMostVisitedData(data: MostVisited[]): void {
    this.mostVisitedBarData = this.getBarChartData(data, 'visitors_per_year');
    this.mostVisitedBarChartOptions = this.getMostVisitedBarChartOptions(data);
    this.mostVisitedChoropleth = this.getChoroplethData(data);
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

  getLineData(rawData: TallestBuilding[]): ChartConfiguration['data'] {
    const sortedData = [...rawData].sort(
      (a: TallestBuilding, b: TallestBuilding) =>
        Number(a.year_completed) - Number(b.year_completed),
    );
    const map = new Map();

    sortedData.forEach((item) => {
      const key = item.year_completed;

      if (map.has(key)) {
        const value = map.get(key);
        const maxHeight = Math.max(Number(item.height_m), value);
        map.set(key, maxHeight);
      } else {
        map.set(key, Number(item.height_m));
      }
    });

    const labels: string[] = Array.from(map.keys());
    const data: number[] = Array.from(map.values());

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  }

  getLineChartOptions(rawData: TallestBuilding[]): ChartOptions<'line'> {
    const data = [...rawData];

    return {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 12,
          },
          callbacks: {
            title: (context) => `Year: ${context[0].label}`,
            label: (context: TooltipItem<'line'>) => {
              const tallestBldg = data.find(
                (item) => Number(item.height_m) === Number(context.raw),
              );

              return [
                `Tallest Building: ${tallestBldg?.name}`,
                `Building Location: ${tallestBldg?.city}, ${tallestBldg?.country}`,
                `Height: ${context.raw} meters`,
              ];
            },
          },
        },
      },
    };
  }

  getTallestBuildingsBarChartOptions(rawData: TallestBuilding[]): ChartOptions<'bar'> {
    const data = [...rawData];

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          padding: 12,
          bodyFont: {
            size: 12,
          },
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          callbacks: {
            title: (context) => context[0].label,
            label: (context: TooltipItem<'bar'>) => {
              const sortedData = [...data].sort(
                (a: TallestBuilding, b: TallestBuilding) => Number(b.height_m) - Number(a.height_m),
              );
              const item = sortedData[context.dataIndex];
              const rank = ordinalSuffix(context.dataIndex + 1);

              return [
                `Rank: ${rank}`,
                `Location: ${item.city}, ${item.country}`,
                `Height: ${item.height_m} meters`,
                `Year completed: ${item.year_completed}`,
              ];
            },
          },
        },
      },
    };
  }

  getMostVisitedBarChartOptions(rawData: MostVisited[]): ChartOptions<'bar'> {
    const data = [...rawData];

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          padding: 12,
          bodyFont: {
            size: 12,
          },
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          callbacks: {
            title: (context) => context[0].label,
            label: (context: TooltipItem<'bar'>) => {
              const item = data[context.dataIndex];
              const rank = ordinalSuffix(context.dataIndex + 1);
              const numberFormatter = new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1,
              });
              const visitors = numberFormatter.format(Number(item.visitors_per_year));

              return [
                `Rank: ${rank}`,
                `Location: ${item.location}`,
                `Visitors per year (approx.): ${visitors}`,
              ];
            },
          },
        },
      },
    };
  }

  sort(data: any, attribute: string) {
    if (!data) return;
    return [...data].sort((a: any, b: any) => Number(b[attribute]) - Number(a[attribute]));
  }

  getBarChartData(
    rawdata: (TallestBuilding | MostVisited)[],
    key: string,
  ): ChartConfiguration['data'] {
    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColor: string[] = [];

    [...rawdata].forEach((item: any) => {
      labels.push(item.name);
      data.push(item[key]);
      backgroundColor.push(item.color);
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
        },
      ],
    };
  }

  get categoryValue() {
    return this.selectionForm.get('category')?.value;
  }

  get rankingValue() {
    return this.selectionForm.get('ranking')?.value;
  }
}
