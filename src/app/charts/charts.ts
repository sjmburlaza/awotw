import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChartConfiguration, ChartOptions, plugins, TooltipItem } from 'chart.js';
import { Chart } from '../shared/components/chart/chart';
import { DataService, MostVisited, TallestBuilding } from '../services/data.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-charts',
  imports: [CommonModule, ReactiveFormsModule, Chart],
  templateUrl: './charts.html',
  styleUrl: './charts.scss'
})
export class Charts implements OnInit {
  categories = [
    {
      name: "Tallest Buildings",
      code: "tallest",
    },
    {
      name: "Most Visited",
      code: "mostVisited",
    }
  ];

  rankings = [
    {
      name: "Top 20",
      code: '20',
    },
    {
      name: "Top 50",
      code: '50',
    }
  ];

  isLoading = true;
  selectionForm!: FormGroup;
  tallestRawData = [];
  mostVisitedRawData = [];
  tallestBuildingsBarData: ChartConfiguration['data']= { labels: [], datasets: [] };
  mostVisitedBarData: ChartConfiguration['data']= { labels: [], datasets: [] };
  tallestBuildingsCountryPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  mostVisitedByCountryPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  tallesBuildingsYearPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  mostVisitedByYearPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  tallestBuildingsBarChartOptions!: ChartOptions<'bar'>;
  mostVisitedBarChartOptions!: ChartOptions<'bar'>;
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        font: {
          family: 'Barlow',
          size: 24,
          weight: 'bold'
        },
        padding: {
          top: 0,
          bottom: 0
        },
        color: '#333'
      },
      legend: { 
        position: 'bottom',
        labels: {
          padding: 8,
          font: {
            family: "barlow",
            size: 16
          }
        }
      }
    },
    layout: {
      padding: {
        // right: 120,
      }
    }
  };

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
  ) {}

  ngOnInit(): void {
    this.selectionForm = this.fb.group({
      category: ['tallest', Validators.required],
      ranking: ['50', Validators.required]
    });

    this.selectionForm.get('ranking')?.valueChanges.subscribe((ranking )=> {
      if (ranking === '50') {
        const top50tallest = [...this.tallestRawData];
        const top50mostVisited = [...this.mostVisitedRawData];
        this.tallestBuildingsBarData = this.getBarChartData(top50tallest, 'height_m');
        this.mostVisitedBarData = this.getBarChartData(top50mostVisited, 'visitors_per_year');
        this.tallestBuildingsCountryPieData = this.getByCountryPieChartData(top50tallest, 'country');
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(top50mostVisited, 'location');
        this.tallesBuildingsYearPieData = this.getByYearPieChartData(top50tallest, 'year_completed');
        this.tallestBuildingsBarChartOptions = this.getTallestBuildingsBarChartOptions(top50tallest);
        this.mostVisitedBarChartOptions= this.getMostVisitedBarChartOptions(top50mostVisited);
      } else {
        const top20tallest = [...this.tallestRawData].slice(0, 20);
        const top20mostVisited = [...this.mostVisitedRawData].slice(0, 20);
        this.tallestBuildingsBarData = this.getBarChartData(top20tallest, 'height_m');
        this.mostVisitedBarData = this.getBarChartData(top20mostVisited, 'visitors_per_year');
        this.tallestBuildingsCountryPieData = this.getByCountryPieChartData(top20tallest, 'country');
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(top20mostVisited, 'location');
        this.tallesBuildingsYearPieData = this.getByYearPieChartData(top20tallest, 'year_completed');
        this.tallestBuildingsBarChartOptions = this.getTallestBuildingsBarChartOptions(top20tallest);
        this.mostVisitedBarChartOptions= this.getMostVisitedBarChartOptions(top20mostVisited);
      }
    });

    this.getTallestBuildings();
    this.getMostVisited();
  }

  getTallestBuildings(): void {
    this.dataService.getTallestBuildings()
      .pipe(take(1))
      .subscribe((res) => {
        const sorted = this.sort(res, 'height_m');
        this.tallestRawData = sorted;
        this.tallestBuildingsBarData = this.getBarChartData(sorted, 'height_m');
        this.tallestBuildingsCountryPieData = this.getByCountryPieChartData(sorted, 'country');
        this.tallesBuildingsYearPieData = this.getByYearPieChartData(sorted, 'year_completed');
        this.tallestBuildingsBarChartOptions = this.getTallestBuildingsBarChartOptions(sorted);
        this.isLoading = false;
      });
  }

  getMostVisited(): void {
    this.dataService.getMostVisited()
      .pipe(take(1))
      .subscribe((res) => {
        const sorted = this.sort(res, 'visitors_per_year');
        this.mostVisitedRawData = sorted;
        this.mostVisitedBarData = this.getBarChartData(sorted, 'visitors_per_year');
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(sorted, 'location');
        this.mostVisitedBarChartOptions= this.getMostVisitedBarChartOptions(sorted);
      });
  }

  ordinalSuffix(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  getTallestBuildingsBarChartOptions(data: TallestBuilding[]): ChartOptions<'bar'> {
    return {
      plugins: {
        legend: {
          display: false
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
            label: (context: TooltipItem<"bar">) => {
              const item = data[context.dataIndex];
              const rank = this.ordinalSuffix(context.dataIndex + 1);
              return [
                `Rank: ${rank}`,
                `Location: ${item.city}, ${item.country}`,
                `Height: ${item.height_m} meters`,
                `Year completed: ${item.year_completed}`,
              ];
            }
          }
        }
      }
    }
  }

  getMostVisitedBarChartOptions(data: MostVisited[]): ChartOptions<'bar'> {
    return {
      plugins: {
        legend: {
          display: false
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
            label: (context: TooltipItem<"bar">) => {
              const item = data[context.dataIndex];
              const rank = this.ordinalSuffix(context.dataIndex + 1);
              const numberFormatter = new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1
              });
              const visitors = numberFormatter.format(Number(item.visitors_per_year));
              
              return [
                `Rank: ${rank}`,
                `Location: ${item.location}`,
                `Visitors per year (approx.): ${visitors}`,
              ];
            }
          }
        }
      }
    }
  }

  sort(data: any, attribute: string) {
    if (!data) return;
    return data.sort((a: any, b: any) => b[attribute] - a[attribute]);
  }

  sortMapObject(map: Map<string, number>): Map<string, number> {
    const mapAsArray = [...map.entries()];
    mapAsArray.sort((a, b) => b[1] - a[1]);
    return new Map(mapAsArray);
  }

  getByYearPieChartData(rawdata: (TallestBuilding | MostVisited)[], key: string): ChartConfiguration['data'] {
    const map = new Map();
    const label = 'Tallest buildings';

    rawdata?.forEach((item: any) => {
      const keyName =  item[key];

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
          label
        }
      ],
    };
  }

  getByCountryPieChartData(rawdata: (TallestBuilding | MostVisited)[], key: string): ChartConfiguration['data'] {
    const map = new Map();
    const label = key === 'country' ? 'Tallest buildings' : 'Most visited places';

    rawdata?.forEach((item: any) => {
      const country = (item[key])?.split(', ')?.at(-1);
      const keyName =  key === 'country' ? item[key] : country;

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
          label
        }
      ],
    };
  }

  getBarChartData(rawdata: (TallestBuilding | MostVisited)[], key: string): ChartConfiguration['data'] {
    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColor: string[] = [];
    const title = key === 'height_m' ? 'Height in meters' : 'Visitors per year (approx.)'

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
          label: title
        }
      ]
    };
  }

  get categoryValue() {
    return this.selectionForm.get('category')?.value;
  }

  get rankingValue() {
    return this.selectionForm.get('ranking')?.value;
  }

}
