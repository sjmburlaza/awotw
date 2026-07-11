import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js';
import { ChartComponent } from '../chart/chart';
import { getThemeColors } from '../../theme-colors';

interface LineChartItemBase {
  name: string;
}

type NumericLikeKeys<T> = {
  [K in keyof T]: T[K] extends number | string ? K : never;
}[keyof T];

export type LineTooltipBuilder<T> = (item: T | undefined, context: TooltipItem<'line'>) => string[];

@Component({
  selector: 'app-line-chart',
  imports: [ChartComponent],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent<T extends LineChartItemBase> implements OnChanges {
  @Input({ required: true }) data: T[] = [];

  @Input({ required: true }) labelKey!: NumericLikeKeys<T>;
  @Input({ required: true }) valueKey!: NumericLikeKeys<T>;

  @Input({ required: true }) titlePrefix = 'Value';
  @Input({ required: true }) tooltipBuilder!: LineTooltipBuilder<T>;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions!: ChartOptions<'line'>;

  private groupedItems = new Map<string, T>();

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['data'] ||
      changes['labelKey'] ||
      changes['valueKey'] ||
      changes['titlePrefix'] ||
      changes['tooltipBuilder']
    ) {
      this.chartData = this.getLineChartData(this.data);
      this.chartOptions = this.getLineChartOptions();
    }
  }

  @HostListener('window:awotw-theme-change')
  onThemeChange(): void {
    this.chartData = this.getLineChartData(this.data);
    this.chartOptions = this.getLineChartOptions();
  }

  private getLineChartData(rawData: T[]): ChartConfiguration<'line'>['data'] {
    const theme = getThemeColors();

    this.groupedItems.clear();

    const sortedData = [...rawData].sort(
      (a, b) => Number(a[this.labelKey]) - Number(b[this.labelKey]),
    );

    const map = new Map<string, number>();

    sortedData.forEach((item) => {
      const label = String(item[this.labelKey]);
      const value = Number(item[this.valueKey]);

      const existingValue = map.get(label);

      if (existingValue === undefined || value > existingValue) {
        map.set(label, value);
        this.groupedItems.set(label, item);
      }
    });

    return {
      labels: Array.from(map.keys()),
      datasets: [
        {
          data: Array.from(map.values()),
          backgroundColor: 'rgba(252, 70, 107, 0.16)',
          borderColor: '#fc466b',
          pointBackgroundColor: '#3f5efb',
          pointBorderColor: theme.surface,
          tension: 0.25,
        },
      ],
    };
  }

  private getLineChartOptions(): ChartOptions<'line'> {
    const theme = getThemeColors();

    return {
      responsive: true,
      color: theme.text,
      scales: {
        x: {
          border: {
            color: theme.axis,
          },
          grid: {
            color: theme.grid,
          },
          ticks: {
            color: theme.muted,
          },
        },
        y: {
          border: {
            color: theme.axis,
          },
          grid: {
            color: theme.grid,
          },
          ticks: {
            color: theme.muted,
          },
        },
      },
      plugins: {
        datalabels: {
          display: false,
        },
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: theme.tooltipBackground,
          bodyColor: theme.tooltipText,
          displayColors: false,
          padding: 12,
          titleColor: theme.tooltipText,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 12,
          },
          callbacks: {
            title: (context: TooltipItem<'line'>[]) => {
              const label = context[0]?.label ?? '';
              return `${this.titlePrefix}: ${label}`;
            },
            label: (context: TooltipItem<'line'>) => {
              const label = context.label;
              const item = this.groupedItems.get(label);

              return this.tooltipBuilder(item, context);
            },
          },
        },
      },
    };
  }
}
