import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { StyleRange } from 'src/app/services/data.service';
import { getThemeColors } from '../../theme-colors';

interface TooltipPosition {
  left: number;
  top: number;
}

@Component({
  selector: 'app-timeline-chart-v2',
  imports: [],
  templateUrl: './timeline-chart-v2.component.html',
  styleUrl: './timeline-chart-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineChartV2Component implements AfterViewInit {
  @Input() data: StyleRange[] = [];
  @ViewChild('chartContainer', { static: true })
  chartContainer!: ElementRef<HTMLDivElement>;

  private readonly tooltipGap = 14;
  private readonly tooltipInset = 8;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, null, undefined>;

  ngAfterViewInit(): void {
    this.createTooltip();
    this.renderChart();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.renderChart();
  }

  @HostListener('window:awotw-theme-change')
  onThemeChange(): void {
    this.createTooltip();
    this.renderChart();
  }

  private renderChart(): void {
    const container = this.chartContainer.nativeElement;
    const theme = getThemeColors();
    const width = container.clientWidth || 1000;
    const barHeight = 12;
    const rowGap = 8;
    const height = this.data.length * (barHeight + rowGap) + 100;

    const margin = {
      top: 50,
      right: 80,
      bottom: 40,
      left: 40,
    };

    d3.select(container).select('svg').remove();

    this.svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const minYear = d3.min(this.data, (d) => d.startYear) ?? -3100;
    const maxYear = d3.max(this.data, (d) => d.endYear) ?? 2026;

    const xScale = d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([margin.left, margin.left + chartWidth]);

    const yScale = d3
      .scaleBand<string>()
      .domain(this.data.map((d) => d.label))
      .range([margin.top, margin.top + chartHeight])
      .padding(0.28);

    const tickValues = this.buildTickValues(minYear, maxYear);

    const axisTop = d3
      .axisTop(xScale)
      .tickValues(tickValues)
      .tickFormat((d) => this.formatYear(Number(d)));

    const axisBottom = d3
      .axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((d) => this.formatYear(Number(d)));

    // Top axis
    this.svg
      .append('g')
      .attr('transform', `translate(0, ${margin.top})`)
      .call(axisTop)
      .call((g) => g.select('.domain').attr('stroke', theme.axis))
      .call((g) => g.selectAll('.tick line').attr('stroke', theme.grid))
      .call((g) => g.selectAll('.tick text').attr('font-size', '12px').attr('fill', theme.muted));

    // Bottom axis
    this.svg
      .append('g')
      .attr('transform', `translate(0, ${margin.top + chartHeight})`)
      .call(axisBottom)
      .call((g) => g.select('.domain').attr('stroke', theme.axis))
      .call((g) => g.selectAll('.tick line').attr('stroke', theme.grid))
      .call((g) => g.selectAll('.tick text').attr('font-size', '12px').attr('fill', theme.muted));

    // Row background guides
    this.svg
      .append('g')
      .selectAll('line.row-guide')
      .data(this.data)
      .join('line')
      .attr('class', 'row-guide')
      .attr('x1', margin.left)
      .attr('x2', margin.left + chartWidth)
      .attr('y1', (d) => (yScale(d.label) ?? 0) + yScale.bandwidth() / 2)
      .attr('y2', (d) => (yScale(d.label) ?? 0) + yScale.bandwidth() / 2)
      .attr('stroke', theme.grid)
      .attr('stroke-width', 1);

    const rowGroups = this.svg
      .append('g')
      .selectAll('g.timeline-row')
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'timeline-row');

    // Cursor guide line
    const cursorLine = this.svg
      .append('line')
      .attr('class', 'cursor-line')
      .attr('y1', margin.top)
      .attr('y2', margin.top + chartHeight)
      .attr('stroke', theme.cursor)
      .attr('stroke-width', 1)
      .style('pointer-events', 'none')
      .style('opacity', 0);

    this.svg
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('pointer-events', 'all')
      .lower()
      .on('mousemove', (event) => {
        const [x] = d3.pointer(event, this.svg.node());

        cursorLine.attr('x1', x).attr('x2', x).style('opacity', 1);

        this.moveTooltip(event);
      })
      .on('mouseleave', () => {
        cursorLine.style('opacity', 0);
        this.tooltip.style('opacity', 0);
      });

    rowGroups
      .append('rect')
      .attr('x', (d) => xScale(d.startYear))
      .attr('y', (d) => yScale(d.label) ?? 0)
      .attr('width', (d) => xScale(d.endYear) - xScale(d.startYear))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => d.color)
      .attr(
        'aria-label',
        (d) =>
          `${d.label} style, ${this.formatYear(d.startYear)} to ${this.formatYear(d.endYear)}. ${d.description}`,
      )
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(120)
          .attr('fill', d3.color(d.color)?.darker(0.7)?.toString() || d.color);

        this.showTooltip(d);

        this.moveTooltip(event);
      })
      .on('mousemove', (event) => {
        this.moveTooltip(event);

        const [x] = d3.pointer(event, this.svg.node());

        cursorLine.attr('x1', x).attr('x2', x).style('opacity', 1);
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(120)
          .attr('fill', d.color);

        this.tooltip.style('opacity', '0');

        cursorLine.style('opacity', 0);
      });

    rowGroups.each((d, i, nodes) => {
      const group = d3.select(nodes[i]);

      const barStartX = xScale(d.startYear);
      const barEndX = xScale(d.endYear);
      const centerY = (yScale(d.label) ?? 0) + yScale.bandwidth() / 2;

      const estimatedTextWidth = this.estimateTextWidth(d.label, 13);
      const gap = 10;

      const svgLeftEdge = margin.left;
      const fitsOnLeft = barStartX - gap - estimatedTextWidth >= svgLeftEdge;

      let textX: number;
      let textAnchor: 'start' | 'end';

      if (fitsOnLeft) {
        textX = barStartX - gap;
        textAnchor = 'end';
      } else {
        textX = barEndX + gap;
        textAnchor = 'start';
      }

      group
        .selectAll('text.bar-label')
        .data([d])
        .join('text')
        .attr('class', 'bar-label')
        .attr('x', textX)
        .attr('y', centerY)
        .attr('text-anchor', textAnchor)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .attr('font-family', 'Montserrat')
        .attr('fill', theme.text)
        .text(d.label);
    });
  }

  private buildTickValues(minYear: number, maxYear: number): number[] {
    const span = maxYear - minYear;

    let step = 100;
    if (span > 8000) step = 1000;
    else if (span > 4000) step = 500;
    else if (span > 2000) step = 250;
    else if (span > 1000) step = 100;
    else if (span > 500) step = 50;
    else step = 25;

    const start = Math.ceil(minYear / step) * step;
    const ticks: number[] = [];

    for (let year = start; year <= maxYear; year += step) {
      ticks.push(year);
    }

    return ticks;
  }

  private formatYear(year: number): string {
    if (year < 0) {
      return `${Math.abs(year)} BC`;
    }
    return `${year} AD`;
  }

  private estimateTextWidth(text: string, fontSize = 13): number {
    return text.length * (fontSize * 0.62);
  }

  private createTooltip(): void {
    const theme = getThemeColors();
    const container = this.chartContainer.nativeElement;

    document.querySelectorAll('body > .timeline-tooltip').forEach((tooltip) => tooltip.remove());
    container.querySelector('.timeline-tooltip')?.remove();

    this.tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'timeline-tooltip')
      .style('position', 'absolute')
      .style('box-sizing', 'border-box')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('background', theme.tooltipBackground)
      .style('color', theme.tooltipText)
      .style('border', `1px solid ${theme.grid}`)
      .style('padding', '8px 10px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('line-height', '1.4')
      .style('max-width', 'min(280px, calc(100% - 16px))')
      .style('overflow-wrap', 'anywhere')
      .style('box-shadow', '0 8px 24px rgba(0,0,0,0.2)')
      .style('z-index', '1000');
  }

  private showTooltip(d: StyleRange): void {
    this.tooltip
      .html('')
      .style('opacity', 0.9)
      .style('font-family', 'Montserrat')
      .style('padding', '12px')
      .style('white-space', 'normal');

    this.tooltip
      .append('h4')
      .style('margin', '0 0 6px')
      .style('font-size', '13px')
      .style('font-weight', '700')
      .text(`${d.label} style`);

    this.tooltip
      .append('div')
      .style('font-weight', '600')
      .style('margin-bottom', '6px')
      .text(`${this.formatYear(d.startYear)} to ${this.formatYear(d.endYear)}`);

    this.tooltip.append('div').text(d.description);
  }

  private moveTooltip(event: MouseEvent): void {
    const tooltipEl = this.tooltip.node();
    if (!tooltipEl) return;

    const containerRect = this.chartContainer.nativeElement.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    const position = this.getContainedTooltipPosition(
      event.clientX,
      event.clientY,
      containerRect,
      tooltipRect,
    );

    this.tooltip.style('left', `${position.left}px`).style('top', `${position.top}px`);
  }

  private getContainedTooltipPosition(
    clientX: number,
    clientY: number,
    containerRect: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>,
    tooltipRect: Pick<DOMRectReadOnly, 'width' | 'height'>,
  ): TooltipPosition {
    const pointerX = clientX - containerRect.left;
    const pointerY = clientY - containerRect.top;
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    let left = pointerX + this.tooltipGap;
    if (left + tooltipWidth + this.tooltipInset > containerRect.width) {
      left = pointerX - tooltipWidth - this.tooltipGap;
    }

    let top = pointerY + this.tooltipGap;
    if (top + tooltipHeight + this.tooltipInset > containerRect.height) {
      top = pointerY - tooltipHeight - this.tooltipGap;
    }

    const maxLeft = Math.max(
      this.tooltipInset,
      containerRect.width - tooltipWidth - this.tooltipInset,
    );
    const maxTop = Math.max(
      this.tooltipInset,
      containerRect.height - tooltipHeight - this.tooltipInset,
    );

    return {
      left: this.clamp(left, this.tooltipInset, maxLeft),
      top: this.clamp(top, this.tooltipInset, maxTop),
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
