import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js';
import { take } from 'rxjs';
import { DataService, MostVisited, TallestBuilding } from 'src/app/services/data.service';
import { ChartComponent } from 'src/app/shared/components/chart/chart';
import { FadeInOnScrollDirective } from 'src/app/shared/directives/fade-in-on-scroll.directive';
import { SlideInOnScrollDirective } from 'src/app/shared/directives/slide-in-on-scroll.directive';
import { CompactNumberPipe } from 'src/app/shared/pipes/compact-number-pipe';

@Component({
  selector: 'app-charts',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ChartComponent,
    CompactNumberPipe,
    FadeInOnScrollDirective,
    SlideInOnScrollDirective,
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

  // Pie chart data
  tallestBuildingsCountryPieData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  mostVisitedByCountryPieData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  tallestBuildingsYearPieData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  mostVisitedByYearPieData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Line chart data
  tallestBuildingsLineData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Chart Options
  tallestBuildingsBarChartOptions!: ChartOptions<'bar'>;
  mostVisitedBarChartOptions!: ChartOptions<'bar'>;
  tallestBuildingsPieChartOptions!: ChartOptions<'pie'>;
  mostVisitedPieChartOptions!: ChartOptions<'pie'>;
  tallestBuildingsLineChartOptions!: ChartOptions<'line'>;

  currentListTallestBuilding: TallestBuilding[] = [];
  currentListMostVisited: MostVisited[] = [];

  ngOnInit(): void {
    this.selectionForm = this.fb.group({
      category: ['tallest', Validators.required],
      ranking: ['20', Validators.required],
    });

    this.selectionForm.get('ranking')?.valueChanges.subscribe((ranking) => {
      if (ranking === '50') {
        const top50tallest = [...this.tallestRawData];
        const top50mostVisited = [...this.mostVisitedRawData];
        this.currentListTallestBuilding = [...this.tallestRawData];
        this.currentListMostVisited = [...this.mostVisitedRawData];
        // Bar chart data
        this.tallestBuildingsBarData = this.getBarChartData([...top50tallest], 'height_m');
        this.mostVisitedBarData = this.getBarChartData([...top50mostVisited], 'visitors_per_year');
        // Pie chart data
        this.tallestBuildingsCountryPieData = this.getByCountryPieChartData(
          [...top50tallest],
          'country',
        );
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(
          [...top50mostVisited],
          'location',
        );
        this.tallestBuildingsYearPieData = this.getByYearPieChartData(
          [...top50tallest],
          'year_completed',
        );
        // Chart options
        this.tallestBuildingsBarChartOptions = this.getTallestBuildingsBarChartOptions([
          ...top50tallest,
        ]);
        this.mostVisitedBarChartOptions = this.getMostVisitedBarChartOptions([...top50mostVisited]);
        this.tallestBuildingsPieChartOptions = this.getTallestBuildingsPieChartOptions([
          ...top50tallest,
        ]);
        this.mostVisitedPieChartOptions = this.getMostVisitedPieChartOptions([...top50mostVisited]);
        // Line chart
        this.tallestBuildingsLineData = this.getLineData([...top50tallest]);
        this.tallestBuildingsLineChartOptions = this.getLineChartOptions([...top50tallest]);
      } else {
        const top20tallest = [...this.tallestRawData].slice(0, 20);
        const top20mostVisited = [...this.mostVisitedRawData].slice(0, 20);
        this.currentListTallestBuilding = [...this.tallestRawData].slice(0, 20);
        this.currentListMostVisited = [...this.mostVisitedRawData].slice(0, 20);
        // Bar chart data
        this.tallestBuildingsBarData = this.getBarChartData([...top20tallest], 'height_m');
        this.mostVisitedBarData = this.getBarChartData([...top20mostVisited], 'visitors_per_year');
        // Pie chart data
        this.tallestBuildingsCountryPieData = this.getByCountryPieChartData(
          [...top20tallest],
          'country',
        );
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(
          [...top20mostVisited],
          'location',
        );
        this.tallestBuildingsYearPieData = this.getByYearPieChartData(
          [...top20tallest],
          'year_completed',
        );
        // Chart options
        this.tallestBuildingsBarChartOptions = this.getTallestBuildingsBarChartOptions([
          ...top20tallest,
        ]);
        this.mostVisitedBarChartOptions = this.getMostVisitedBarChartOptions([...top20mostVisited]);
        this.tallestBuildingsPieChartOptions = this.getTallestBuildingsPieChartOptions([
          ...top20tallest,
        ]);
        this.mostVisitedPieChartOptions = this.getMostVisitedPieChartOptions([...top20mostVisited]);
        // Line chart
        this.tallestBuildingsLineData = this.getLineData([...top20tallest]);
        this.tallestBuildingsLineChartOptions = this.getLineChartOptions([...top20tallest]);
      }
    });

    this.getTallestBuildings();
    this.getMostVisited();
  }

  getTallestBuildings(): void {
    this.dataService
      .getTallestBuildings()
      .pipe(take(1))
      .subscribe((res) => {
        this.tallestRawData = [...res].sort((a, b) => Number(b.height_m) - Number(a.height_m));
        const top20tallest = [...this.tallestRawData].slice(0, 20);
        this.currentListTallestBuilding = [...this.tallestRawData].slice(0, 20);

        this.tallestBuildingsBarData = this.getBarChartData([...top20tallest], 'height_m');
        this.tallestBuildingsCountryPieData = this.getByCountryPieChartData(
          [...top20tallest],
          'country',
        );
        this.tallestBuildingsYearPieData = this.getByYearPieChartData(
          [...top20tallest],
          'year_completed',
        );
        this.tallestBuildingsBarChartOptions = this.getTallestBuildingsBarChartOptions([
          ...top20tallest,
        ]);
        this.tallestBuildingsPieChartOptions = this.getTallestBuildingsPieChartOptions([
          ...top20tallest,
        ]);
        this.tallestBuildingsLineData = this.getLineData([...top20tallest]);
        this.tallestBuildingsLineChartOptions = this.getLineChartOptions([...top20tallest]);

        this.isLoading = false;
      });
  }

  getMostVisited(): void {
    this.dataService
      .getMostVisited()
      .pipe(take(1))
      .subscribe((res) => {
        this.mostVisitedRawData = res.sort(
          (a, b) => Number(b.visitors_per_year) - Number(a.visitors_per_year),
        );
        const top20mostVisited = [...this.mostVisitedRawData].slice(0, 20);
        this.currentListMostVisited = [...this.mostVisitedRawData].slice(0, 20);

        this.mostVisitedBarData = this.getBarChartData([...top20mostVisited], 'visitors_per_year');
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(
          [...top20mostVisited],
          'location',
        );
        this.mostVisitedBarChartOptions = this.getMostVisitedBarChartOptions([...top20mostVisited]);
        this.mostVisitedPieChartOptions = this.getMostVisitedPieChartOptions([...top20mostVisited]);
      });
  }

  ordinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  getLineData(rawData: TallestBuilding[]): ChartConfiguration['data'] {
    const sortedData = rawData.sort(
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

  getLineChartOptions(data: TallestBuilding[]): ChartOptions<'line'> {
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

  getTallestBuildingsPieChartOptions(data: TallestBuilding[]): ChartOptions<'pie'> {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 8,
            font: {
              family: 'Barlow',
              size: 14,
            },
          },
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
            title: (context) => {
              const label = data.some((item) => item.country === context[0].label)
                ? 'Country:'
                : 'Year';
              return `${label} ${context[0].label}`;
            },
            label: (context: TooltipItem<'pie'>) => {
              const items = data.filter(
                (item) => item.country === context.label || item.year_completed === context.label,
              );
              const names = items.map((item) => item.name);

              return [`Count: ${context.raw}`, `Building(s):`, ...names];
            },
          },
        },
      },
    };
  }

  getMostVisitedPieChartOptions(data: MostVisited[]): ChartOptions<'pie'> {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 8,
            font: {
              family: 'Barlow',
              size: 14,
            },
          },
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
            title: (context) => `Country: ${context[0].label}`,
            label: (context: TooltipItem<'pie'>) => {
              const items = data.filter(
                (item) => item.location.split(', ').at(-1) === context.label,
              );
              const names = items.map((item) => item.name);

              return [`Count: ${context.raw}`, `Building(s):`, ...names];
            },
          },
        },
      },
    };
  }

  getTallestBuildingsBarChartOptions(data: TallestBuilding[]): ChartOptions<'bar'> {
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
              const sortedData = data.sort(
                (a: TallestBuilding, b: TallestBuilding) => Number(b.height_m) - Number(a.height_m),
              );
              const item = sortedData[context.dataIndex];
              const rank = this.ordinalSuffix(context.dataIndex + 1);

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

  getMostVisitedBarChartOptions(data: MostVisited[]): ChartOptions<'bar'> {
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
              const rank = this.ordinalSuffix(context.dataIndex + 1);
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
    return data.sort((a: any, b: any) => Number(b[attribute]) - Number(a[attribute]));
  }

  sortMapObject(map: Map<string, number>): Map<string, number> {
    const mapAsArray = [...map.entries()];
    mapAsArray.sort((a, b) => b[1] - a[1]);
    return new Map(mapAsArray);
  }

  getByYearPieChartData(
    rawdata: (TallestBuilding | MostVisited)[],
    key: string,
  ): ChartConfiguration['data'] {
    const map = new Map();

    rawdata?.forEach((item: any) => {
      const keyName = item[key];

      if (map.has(keyName)) {
        const keyValue = map.get(keyName);
        map.set(keyName, keyValue + 1);
      } else {
        map.set(keyName, 1);
      }
    });

    const sortedMap = this.sortMapObject(map);
    const labels: string[] = Array.from(sortedMap.keys());
    const data: number[] = Array.from(sortedMap.values());

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  }

  getByCountryPieChartData(
    rawdata: (TallestBuilding | MostVisited)[],
    key: string,
  ): ChartConfiguration['data'] {
    const map = new Map();

    rawdata?.forEach((item: any) => {
      const country = item[key]?.split(', ')?.at(-1);
      const keyName = key === 'country' ? item[key] : country;

      if (map.has(keyName)) {
        const keyValue = map.get(keyName);
        map.set(keyName, keyValue + 1);
      } else {
        map.set(keyName, 1);
      }
    });

    const sortedMap = this.sortMapObject(map);
    const labels: string[] = Array.from(sortedMap.keys());
    const data: number[] = Array.from(sortedMap.values());

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  }

  getBarChartData(
    rawdata: (TallestBuilding | MostVisited)[],
    key: string,
  ): ChartConfiguration['data'] {
    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColor: string[] = [];

    rawdata.forEach((item: any) => {
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
