import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChartConfiguration, ChartOptions } from 'chart.js';
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
  tallesBuildingsCountryPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  mostVisitedByCountryPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  tallesBuildingsYearPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  mostVisitedByYearPieData: ChartConfiguration['data']= { labels: [], datasets: [] };
  chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        // text: 'Distribution by country',
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
      ranking: ['20', Validators.required]
    });

    this.selectionForm.get('ranking')?.valueChanges.subscribe((ranking )=> {
      if (ranking === '50') {
        const top50tallest = [...this.tallestRawData];
        const top50mostVisited = [...this.mostVisitedRawData];
        this.tallestBuildingsBarData = this.getBarChartData(top50tallest, 'height_m');
        this.mostVisitedBarData = this.getBarChartData(top50mostVisited, 'visitors_per_year');
        this.tallesBuildingsCountryPieData = this.getByCountryPieChartData(top50tallest, 'country');
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(top50mostVisited, 'location');
        // this.tallesBuildingsYearPieData = this.getByYearPieChartData(top50tallest, 'year_completed');
      } else {
        const top20tallest = [...this.tallestRawData].slice(0, 20);
        const top20mostVisited = [...this.mostVisitedRawData].slice(0, 20);
        this.tallestBuildingsBarData = this.getBarChartData(top20tallest, 'height_m');
        this.mostVisitedBarData = this.getBarChartData(top20mostVisited, 'visitors_per_year');
        this.tallesBuildingsCountryPieData = this.getByCountryPieChartData(top20tallest, 'country');
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(top20mostVisited, 'location');
        this.tallesBuildingsYearPieData = this.getByYearPieChartData(top20tallest, 'year_completed');
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
        const top20 = sorted.slice(0, 20);
        this.tallestBuildingsBarData = this.getBarChartData(top20, 'height_m');
        this.tallesBuildingsCountryPieData = this.getByCountryPieChartData(top20, 'country');
        this.tallesBuildingsYearPieData = this.getByYearPieChartData(top20, 'year_completed');
        this.isLoading = false;
      });
  }

  getMostVisited(): void {
    this.dataService.getMostVisited()
      .pipe(take(1))
      .subscribe((res) => {
        const sorted = this.sort(res, 'visitors_per_year');
        this.mostVisitedRawData = sorted;
        const top20 = sorted.slice(0, 20);
        this.mostVisitedBarData = this.getBarChartData(top20, 'visitors_per_year');
        this.mostVisitedByCountryPieData = this.getByCountryPieChartData(top20, 'location');
      });
  }

  sort(data: any, attribute: string) {
    if (!data) return;
    return data.sort((a: any, b: any) => b[attribute] - a[attribute]);
  }

  getByYearPieChartData(rawdata: (TallestBuilding | MostVisited)[], key: string): ChartConfiguration['data'] {
    const map = new Map();
    const label = 'Number of tallest buildings';

    rawdata?.forEach((item: any) => {
      const keyName =  item[key];

      if (map.has(keyName)) {
        const keyValue = map.get(keyName);
        map.set(keyName, keyValue + 1);
      } else {
        map.set(keyName, 1);
      }
    });

    const labels: string[] = Array.from(map.keys());
    const data: number[] = Array.from(map.values());

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
    const label = key === 'country' ? 'Number of tallest buildings' : 'Number of most visited places';

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

    const labels: string[] = Array.from(map.keys());
    const data: number[] = Array.from(map.values());

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
