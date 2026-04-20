import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js';
import { TallestBuilding } from 'src/app/services/data.service';
import { ChartComponent } from '../chart/chart';

@Component({
  selector: 'app-line-chart',
  imports: [ChartComponent],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.scss',
})
export class LineChartComponent implements OnChanges {
  @Input() data: any;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions!: ChartOptions<'line'>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = this.getLineChartData(this.data);
      this.chartOptions = this.getLineChartOptions(this.data);
    }
  }

  getLineChartData(rawData: TallestBuilding[]): ChartConfiguration['data'] {
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
        datalabels: {
          display: false,
        },
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
}
