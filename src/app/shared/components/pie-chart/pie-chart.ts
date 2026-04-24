import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, ChartOptions, registerables, TooltipItem } from 'chart.js';
import { ChartComponent } from '../chart/chart';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { sortMapObject } from '../../utils-helper';

Chart.register(...registerables, ChartDataLabels);

type KeyOf<T> = keyof T;

export type PieGroupingFn<T> = (item: T) => string;
export type PieTitleBuilder = (context: TooltipItem<'pie'>[]) => string;
export type PieTooltipBuilder<T> = (item: T, context: TooltipItem<'pie'>, allData: T[]) => string[];

@Component({
  selector: 'app-pie-chart',
  imports: [ChartComponent],
  templateUrl: './pie-chart.html',
  styleUrl: './pie-chart.scss',
})
export class PieChartComponent<T> implements OnChanges {
  @Input({ required: true }) data: T[] = [];
  @Input({ required: true }) key!: KeyOf<T>;

  @Input() groupingFn?: PieGroupingFn<T>;
  @Input() titlePrefix = '';
  @Input() tooltipBuilder!: PieTooltipBuilder<T>;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions!: ChartOptions<'pie'>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = this.getPieChartData(this.data);
      this.chartOptions = this.getChartOptions(this.data);
    }
  }

  private getPieChartData(rawData: T[]): ChartConfiguration<'pie'>['data'] {
    let map = new Map<string, number>();

    rawData.forEach((item) => {
      const keyName = this.groupingFn ? this.groupingFn(item) : String(item[this.key]);

      map.set(keyName, (map.get(keyName) ?? 0) + 1);
    });

    map = sortMapObject(map);
    const labels = Array.from(map.keys());
    const data = Array.from(map.values());

    return {
      labels,
      datasets: [{ data }],
    };
  }

  getChartOptions(rawData: T[]): ChartOptions<'pie'> {
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
            title: (context: TooltipItem<'pie'>[]) => {
              const label = context[0]?.label ?? '';
              return `${this.titlePrefix}: ${label}`;
            },
            label: (context: TooltipItem<'pie'>) => {
              const item = data[context.dataIndex];
              return this.tooltipBuilder(item, context, data);
            },
          },
        },
      },
    };
  }
}
