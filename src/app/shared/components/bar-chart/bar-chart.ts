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

interface ChartItemBase {
  name: string;
  color: string;
}

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number | string ? K : never;
}[keyof T];

export type BarChartTooltipBuilder<T> = (item: T, index: number) => string[];

@Component({
  selector: 'app-bar-chart',
  imports: [ChartComponent],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent<T extends ChartItemBase> implements OnChanges {
  @Input({ required: true }) data: T[] = [];
  @Input({ required: true }) key!: NumericKeys<T>;
  @Input({ required: true }) tooltipBuilder!: BarChartTooltipBuilder<T>;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions!: ChartOptions<'bar'>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['key'] || changes['tooltipBuilder']) {
      this.chartData = this.getBarChartData(this.data, this.key);
      this.chartOptions = this.getBarChartOptions(this.data);
    }
  }

  @HostListener('window:awotw-theme-change')
  onThemeChange(): void {
    this.chartOptions = this.getBarChartOptions(this.data);
  }

  private getBarChartData(rawData: T[], key: NumericKeys<T>): ChartConfiguration<'bar'>['data'] {
    return {
      labels: rawData.map((item) => item.name),
      datasets: [
        {
          data: rawData.map((item) => Number(item[key])),
          backgroundColor: rawData.map((item) => item.color),
        },
      ],
    };
  }

  private getBarChartOptions(rawData: T[]): ChartOptions<'bar'> {
    const data = [...rawData];
    const theme = getThemeColors();

    return {
      responsive: true,
      maintainAspectRatio: false,
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
          bodyFont: {
            size: 12,
          },
          titleColor: theme.tooltipText,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          callbacks: {
            title: (context) => context[0].label,
            label: (context: TooltipItem<'bar'>) => {
              const item = data[context.dataIndex];
              return this.tooltipBuilder(item, context.dataIndex);
            },
          },
        },
      },
    };
  }
}
