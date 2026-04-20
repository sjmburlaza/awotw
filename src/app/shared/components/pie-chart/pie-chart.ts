import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, ChartOptions, registerables, TooltipItem } from 'chart.js';
import { MostVisited, TallestBuilding } from 'src/app/services/data.service';
import { sortMapObject } from '../../utils-helper';
import { ChartComponent } from '../chart/chart';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-pie-chart',
  imports: [ChartComponent],
  templateUrl: './pie-chart.html',
  styleUrl: './pie-chart.scss',
})
export class PieChartComponent implements OnChanges {
  @Input() data: any;
  @Input() category!: string;
  @Input() grouping = '';
  @Input() key!: string;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions!: ChartOptions<'pie'>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = this.getPieChartData(this.data, this.key);
      this.chartOptions =
        this.category === 'tallest'
          ? this.getTallestBuildingsPieChartOptions(this.data)
          : this.getMostVisitedPieChartOptions(this.data);
    }
  }

  getPieChartData(
    rawdata: (TallestBuilding | MostVisited)[],
    key: string,
  ): ChartConfiguration['data'] {
    const map = new Map();

    [...rawdata]?.forEach((item: any) => {
      let keyName = item[key];

      if (this.grouping === 'byCountry') {
        const country = item[key]?.split(', ')?.at(-1);
        keyName = key === 'country' ? item[key] : country;
      }

      if (map.has(keyName)) {
        const keyValue = map.get(keyName);
        map.set(keyName, keyValue + 1);
      } else {
        map.set(keyName, 1);
      }
    });

    const sortedMap = sortMapObject(map);
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

  getMostVisitedPieChartOptions(rawData: MostVisited[]): ChartOptions<'pie'> {
    const data = [...rawData];

    return {
      responsive: true,
      layout: {
        padding: {
          top: 32,
          bottom: 40,
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          title: {
            display: true,
            padding: 16,
          },
          labels: {
            padding: 8,
            font: {
              family: 'Barlow',
              size: 14,
            },
          },
        },
        datalabels: {
          display: true,
          color: '#111827',
          font: {
            family: 'Barlow',
            size: 14,
            weight: 'bold',
          },
          formatter: (value, context) => {
            const dataset = context.chart.data.datasets[0].data as number[];
            const total = dataset.reduce((sum, current) => sum + Number(current), 0);

            if (!total) return '';

            const percentage = (Number(value) / total) * 100;
            return `${percentage}%`;
          },
          anchor: 'end',
          align: 'end',
          offset: 2,
          clamp: true,
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

  getTallestBuildingsPieChartOptions(rawData: TallestBuilding[]): ChartOptions<'pie'> {
    const data = [...rawData];

    return {
      responsive: true,
      layout: {
        padding: {
          top: 32,
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          title: {
            display: true,
            padding: 16,
          },
          labels: {
            padding: 8,
            font: {
              family: 'Barlow',
              size: 14,
            },
          },
        },
        datalabels: {
          display: true,
          color: '#111827',
          font: {
            family: 'Barlow',
            size: 14,
            weight: 'bold',
          },
          formatter: (value, context) => {
            const dataset = context.chart.data.datasets[0].data as number[];
            const total = dataset.reduce((sum, current) => sum + Number(current), 0);

            if (!total) return '';

            const percentage = (Number(value) / total) * 100;
            return `${percentage}%`;
          },
          anchor: 'end',
          align: 'end',
          offset: 2,
          clamp: true,
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
}
