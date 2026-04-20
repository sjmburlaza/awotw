import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js';
import { ordinalSuffix } from '../../utils-helper';
import { MostVisited, TallestBuilding } from 'src/app/services/data.service';
import { ChartComponent } from '../chart/chart';

@Component({
  selector: 'app-bar-chart',
  imports: [ChartComponent],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChartComponent implements OnChanges {
  @Input() data: any;
  @Input() category!: string;
  @Input() key!: string;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions!: ChartOptions<'bar'>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = this.getBarChartData(this.data, this.key);
      this.chartOptions =
        this.category === 'tallest'
          ? this.getTallestBuildingsBarChartOptions(this.data)
          : this.getMostVisitedBarChartOptions(this.data);
    }
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

  getTallestBuildingsBarChartOptions(rawData: TallestBuilding[]): ChartOptions<'bar'> {
    const data = [...rawData];

    return {
      responsive: true,
      maintainAspectRatio: false,
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
                `Height: ${item.height_m} meters`,
                `Location: ${item.city}, ${item.country}`,
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
        datalabels: {
          display: false,
        },
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
                `Visitors per year (approx.): ${visitors}`,
                `Location: ${item.location}`,
              ];
            },
          },
        },
      },
    };
  }
}
