import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
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
      name: "Tallest buildings",
      code: "tallest",
    },
    {
      name: "Most visited",
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

  selectionForm!: FormGroup;
  tallestRawData = [];
  mostVisitedRawData = [];
  tallestBuildings: ChartConfiguration['data']= { labels: [], datasets: [] };;
  mostVisited: ChartConfiguration['data']= { labels: [], datasets: [] };;
  isLoading = true;

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
        this.tallestBuildings = this.processBuildings(top50tallest, 'height_m');
        this.mostVisited = this.processBuildings(top50mostVisited, 'visitors_per_year');
      } else {
        const top20tallest = [...this.tallestRawData].slice(0, 20);
        const top20mostVisited = [...this.mostVisitedRawData].slice(0, 20);
        this.tallestBuildings = this.processBuildings(top20tallest, 'height_m');
        this.mostVisited = this.processBuildings(top20mostVisited, 'visitors_per_year');
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
        this.tallestBuildings = this.processBuildings(top20, 'height_m');
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
        this.mostVisited = this.processBuildings(top20, 'visitors_per_year');
      });
  }

  sort(data: any, attribute: string) {
    return data.sort((a: any, b: any) => b[attribute] - a[attribute]);
  }

  processBuildings(rawdata: (TallestBuilding | MostVisited)[], key: string): ChartConfiguration['data'] {
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
