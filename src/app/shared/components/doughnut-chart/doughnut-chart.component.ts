import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ActiveElement,
  ArcElement,
  Chart,
  ChartConfiguration,
  ChartOptions,
  Plugin,
  registerables,
  Tooltip,
  TooltipItem,
  TooltipModel,
  TooltipPosition,
  TooltipPositionerFunction,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartComponent } from '../chart/chart.component';
import { getThemeColors, ThemeColors } from '../../theme-colors';
import { sortMapObject } from '../../utils-helper';

declare module 'chart.js' {
  interface TooltipPositionerMap {
    doughnutOutside: TooltipPositionerFunction<'doughnut'>;
  }
}

const TOOLTIP_EDGE_PADDING = 16;
const TOOLTIP_TARGET_OFFSET = 2;
const EXTERNAL_TOOLTIP_GAP = 12;
const CENTER_TEXT_TITLE_SIZE = 13;
const CENTER_TEXT_COUNT_SIZE = 28;
const DOUGHNUT_BASE_HUE = 210;
const DOUGHNUT_GOLDEN_ANGLE = 137.508;
const DOUGHNUT_SATURATION = 68;
const DOUGHNUT_LIGHTNESS = 62;

Tooltip.positioners.doughnutOutside = function (
  items: readonly ActiveElement[],
): TooltipPosition | false {
  if (!items.length) return false;

  const arc = items[0].element as ArcElement;
  const midAngle = (arc.startAngle + arc.endAngle) / 2;
  const xDirection = Math.cos(midAngle);
  const yDirection = Math.sin(midAngle);
  const x = arc.x + xDirection * (arc.outerRadius + TOOLTIP_TARGET_OFFSET);
  const y = arc.y + yDirection * (arc.outerRadius + TOOLTIP_TARGET_OFFSET);
  const isHorizontalSlice = Math.abs(xDirection) >= Math.abs(yDirection);

  return {
    x: Math.min(Math.max(x, TOOLTIP_EDGE_PADDING), this.chart.width - TOOLTIP_EDGE_PADDING),
    y: Math.min(Math.max(y, TOOLTIP_EDGE_PADDING), this.chart.height - TOOLTIP_EDGE_PADDING),
    xAlign: isHorizontalSlice ? (xDirection >= 0 ? 'left' : 'right') : 'center',
    yAlign: isHorizontalSlice ? 'center' : yDirection >= 0 ? 'top' : 'bottom',
  };
};

const doughnutCenterTextPlugin: Plugin<'doughnut'> = {
  id: 'doughnutCenterText',
  afterDraw(chart): void {
    const meta = chart.getDatasetMeta(0);

    if (meta.type !== 'doughnut') return;

    const centerArc = meta.data[0] as ArcElement | undefined;

    if (!centerArc) return;

    const { title, count } = getDoughnutCenterText(chart);
    const maxTextWidth = centerArc.innerRadius * 1.65;
    const { ctx } = chart;
    const theme = getThemeColors();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = theme.muted;
    ctx.font = `600 ${CENTER_TEXT_TITLE_SIZE}px Barlow, sans-serif`;
    ctx.fillText(fitCanvasText(ctx, title, maxTextWidth), centerArc.x, centerArc.y - 15);

    ctx.fillStyle = theme.text;
    ctx.font = `700 ${CENTER_TEXT_COUNT_SIZE}px Montserrat, sans-serif`;
    ctx.fillText(String(count), centerArc.x, centerArc.y + 14);

    ctx.restore();
  },
};

Chart.register(...registerables, ChartDataLabels, doughnutCenterTextPlugin);

function getDoughnutCenterText(chart: Chart<'doughnut'>): { title: string; count: number } {
  const dataset = chart.data.datasets[0];
  const values = dataset.data.map((value) => Number(value));
  const active = chart.getActiveElements()[0];

  if (active) {
    return {
      title: String(chart.data.labels?.[active.index] ?? dataset.label ?? 'Total'),
      count: values[active.index] ?? 0,
    };
  }

  return {
    title: dataset.label ?? 'Total',
    count: values.reduce((sum, value) => sum + value, 0),
  };
}

function fitCanvasText(ctx: CanvasRenderingContext2D, text: string, maxTextWidth: number): string {
  if (ctx.measureText(text).width <= maxTextWidth) return text;

  const suffix = '...';
  let trimmedText = text;

  while (
    trimmedText.length > 0 &&
    ctx.measureText(`${trimmedText}${suffix}`).width > maxTextWidth
  ) {
    trimmedText = trimmedText.slice(0, -1);
  }

  return trimmedText ? `${trimmedText}${suffix}` : suffix;
}

type KeyOf<T> = keyof T;

interface DoughnutLegendItem {
  label: string;
  color: string;
}

export type DoughnutGroupingFn<T> = (item: T) => string;
export type DoughnutTitleBuilder = (context: TooltipItem<'doughnut'>[]) => string;
export type DoughnutTooltipBuilder<T> = (
  item: T,
  context: TooltipItem<'doughnut'>,
  allData: T[],
) => string[];

@Component({
  selector: 'app-doughnut-chart',
  imports: [ChartComponent],
  templateUrl: './doughnut-chart.component.html',
  styleUrl: './doughnut-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoughnutChartComponent<T> implements OnChanges {
  @ViewChild('tooltip') private tooltipRef?: ElementRef<HTMLDivElement>;

  @Input({ required: true }) data: T[] = [];
  @Input({ required: true }) key!: KeyOf<T>;

  @Input() groupingFn?: DoughnutGroupingFn<T>;
  @Input() titlePrefix = '';
  @Input() tooltipBuilder!: DoughnutTooltipBuilder<T>;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions!: ChartOptions<'doughnut'>;
  legendItems: DoughnutLegendItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['data'] ||
      changes['key'] ||
      changes['groupingFn'] ||
      changes['titlePrefix'] ||
      changes['tooltipBuilder']
    ) {
      this.chartData = this.getDoughnutChartData(this.data);
      this.legendItems = this.getLegendItems(this.chartData.labels ?? []);
      this.chartOptions = this.getChartOptions(this.data);
    }
  }

  @HostListener('window:awotw-theme-change')
  onThemeChange(): void {
    this.chartOptions = this.getChartOptions(this.data);
  }

  private getDoughnutChartData(rawData: T[]): ChartConfiguration<'doughnut'>['data'] {
    let map = new Map<string, number>();

    rawData.forEach((item) => {
      const keyName = this.groupingFn ? this.groupingFn(item) : String(item[this.key]);

      map.set(keyName, (map.get(keyName) ?? 0) + 1);
    });

    map = sortMapObject(map);
    const labels = Array.from(map.keys());
    const colors = this.getDynamicColors(labels.length);

    return {
      labels,
      datasets: [
        {
          data: Array.from(map.values()),
          label: this.titlePrefix || 'Total',
          backgroundColor: colors,
        },
      ],
    };
  }

  private getChartOptions(rawData: T[]): ChartOptions<'doughnut'> {
    const data = [...rawData];
    const theme = getThemeColors();

    return {
      responsive: true,
      cutout: '58%',
      color: theme.text,
      layout: {
        padding: {
          top: 40,
          right: 96,
          bottom: 48,
          left: 96,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          display: true,
          color: theme.text,
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
          enabled: false,
          backgroundColor: theme.tooltipBackground,
          bodyColor: theme.tooltipText,
          caretPadding: 0,
          caretSize: 6,
          displayColors: false,
          external: ({ chart, tooltip }) => {
            this.renderExternalTooltip(chart, tooltip, theme);
          },
          padding: 12,
          position: 'doughnutOutside',
          titleColor: theme.tooltipText,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 12,
          },
          callbacks: {
            title: (context: TooltipItem<'doughnut'>[]) => {
              const label = context[0]?.label ?? '';
              return `${this.titlePrefix}: ${label}`;
            },
            label: (context: TooltipItem<'doughnut'>) => {
              const item = this.getTooltipItem(context, data);
              return this.tooltipBuilder(item, context, data);
            },
          },
        },
      },
    };
  }

  private getTooltipItem(context: TooltipItem<'doughnut'>, data: T[]): T {
    const label = context.label;
    const item = data.find((datum) => {
      const keyName = this.groupingFn ? this.groupingFn(datum) : String(datum[this.key]);

      return keyName === label;
    });

    return item ?? data[context.dataIndex];
  }

  private getLegendItems(labels: unknown[]): DoughnutLegendItem[] {
    return labels.map((label, index) => ({
      label: String(label),
      color: this.getDynamicColor(index),
    }));
  }

  private getDynamicColors(count: number): string[] {
    return Array.from({ length: count }, (_, index) => this.getDynamicColor(index));
  }

  private getDynamicColor(index: number): string {
    const hue = (DOUGHNUT_BASE_HUE + index * DOUGHNUT_GOLDEN_ANGLE) % 360;
    const lightnessOffset = (index % 3) * 5;

    return `hsl(${Math.round(hue)}, ${DOUGHNUT_SATURATION}%, ${
      DOUGHNUT_LIGHTNESS + lightnessOffset
    }%)`;
  }

  private renderExternalTooltip(
    chart: Chart,
    tooltip: TooltipModel<'doughnut'>,
    theme: ThemeColors,
  ): void {
    const tooltipEl = this.tooltipRef?.nativeElement;

    if (!tooltipEl) return;

    if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
      tooltipEl.classList.remove('is-visible');
      tooltipEl.setAttribute('aria-hidden', 'true');
      return;
    }

    this.updateExternalTooltipContent(tooltipEl, tooltip);
    tooltipEl.style.setProperty('--doughnut-tooltip-bg', theme.tooltipBackground);
    tooltipEl.style.setProperty('--doughnut-tooltip-text', theme.tooltipText);

    const placement = this.getExternalTooltipPlacement(chart, tooltip, tooltipEl);

    tooltipEl.classList.remove('is-left', 'is-right', 'is-top', 'is-bottom');
    tooltipEl.classList.add('is-visible', placement.positionClass);
    tooltipEl.setAttribute('aria-hidden', 'false');
    tooltipEl.style.left = `${placement.left}px`;
    tooltipEl.style.top = `${placement.top}px`;
    tooltipEl.style.setProperty('--doughnut-tooltip-caret-x', `${placement.caretX}px`);
    tooltipEl.style.setProperty('--doughnut-tooltip-caret-y', `${placement.caretY}px`);
  }

  private updateExternalTooltipContent(
    tooltipEl: HTMLDivElement,
    tooltip: TooltipModel<'doughnut'>,
  ): void {
    const titleEl = tooltipEl.querySelector<HTMLDivElement>('.doughnut-chart__tooltip-title');
    const bodyEl = tooltipEl.querySelector<HTMLDivElement>('.doughnut-chart__tooltip-body');

    if (!titleEl || !bodyEl) return;

    titleEl.replaceChildren(...tooltip.title.map((line) => this.createTooltipLine(line)));
    bodyEl.replaceChildren(
      ...tooltip.body.flatMap((bodyItem) =>
        bodyItem.lines.map((line) => this.createTooltipLine(line)),
      ),
    );
  }

  private createTooltipLine(text: string): HTMLDivElement {
    const line = document.createElement('div');
    line.textContent = text;

    return line;
  }

  private getExternalTooltipPlacement(
    chart: Chart,
    tooltip: TooltipModel<'doughnut'>,
    tooltipEl: HTMLDivElement,
  ): {
    left: number;
    top: number;
    caretX: number;
    caretY: number;
    positionClass: 'is-left' | 'is-right' | 'is-top' | 'is-bottom';
  } {
    const parent = tooltipEl.parentElement;
    const canvasRect = chart.canvas.getBoundingClientRect();
    const parentRect = parent?.getBoundingClientRect() ?? canvasRect;
    const targetX = canvasRect.left - parentRect.left + tooltip.caretX;
    const targetY = canvasRect.top - parentRect.top + tooltip.caretY;
    const arc = tooltip.dataPoints[0].element as ArcElement;
    const midAngle = (arc.startAngle + arc.endAngle) / 2;
    const xDirection = Math.cos(midAngle);
    const yDirection = Math.sin(midAngle);
    const isHorizontalSlice = Math.abs(xDirection) >= Math.abs(yDirection);
    const width = tooltipEl.offsetWidth;
    const height = tooltipEl.offsetHeight;

    if (isHorizontalSlice) {
      const isRightSide = xDirection >= 0;
      const left = isRightSide
        ? targetX + EXTERNAL_TOOLTIP_GAP
        : targetX - width - EXTERNAL_TOOLTIP_GAP;
      const top = this.clamp(targetY - height / 2, 0, parentRect.height - height);

      return {
        left,
        top,
        caretX: isRightSide ? 0 : width,
        caretY: targetY - top,
        positionClass: isRightSide ? 'is-right' : 'is-left',
      };
    }

    const isBottomSide = yDirection >= 0;
    const left = this.clamp(targetX - width / 2, 0, parentRect.width - width);
    const top = isBottomSide
      ? targetY + EXTERNAL_TOOLTIP_GAP
      : targetY - height - EXTERNAL_TOOLTIP_GAP;

    return {
      left,
      top,
      caretX: targetX - left,
      caretY: isBottomSide ? 0 : height,
      positionClass: isBottomSide ? 'is-bottom' : 'is-top',
    };
  }

  private clamp(value: number, min: number, max: number): number {
    if (max < min) return min;

    return Math.min(Math.max(value, min), max);
  }
}
