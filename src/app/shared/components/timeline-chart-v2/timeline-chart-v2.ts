import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { StyleRange } from 'src/app/services/data.service';

@Component({
  selector: 'app-timeline-chart-v2',
  imports: [],
  templateUrl: './timeline-chart-v2.html',
  styleUrl: './timeline-chart-v2.scss',
})
export class TimelineChartV2Component implements AfterViewInit {
  @Input() data: StyleRange[] = [];
  @ViewChild('chartContainer', { static: true })
  chartContainer!: ElementRef<HTMLDivElement>;

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;

  ngAfterViewInit(): void {
    this.createTooltip();
    this.renderChart();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.renderChart();
  }

  private renderChart(): void {
    const container = this.chartContainer.nativeElement;
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
      .call((g) => g.select('.domain').attr('stroke', '#999'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#ddd'))
      .call((g) => g.selectAll('.tick text').attr('font-size', '12px'));

    // Bottom axis
    this.svg
      .append('g')
      .attr('transform', `translate(0, ${margin.top + chartHeight})`)
      .call(axisBottom)
      .call((g) => g.select('.domain').attr('stroke', '#999'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#ddd'))
      .call((g) => g.selectAll('.tick text').attr('font-size', '12px'));

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
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    const rowGroups = this.svg
      .append('g')
      .selectAll('g.timeline-row')
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'timeline-row');

    rowGroups
      .append('rect')
      .attr('x', (d) => xScale(d.startYear))
      .attr('y', (d) => yScale(d.label) ?? 0)
      .attr('width', (d) => xScale(d.endYear) - xScale(d.startYear))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => d.color)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(120)
          .attr('fill', d3.color(d.color)?.darker(0.7)?.toString() || d.color);

        this.tooltip
          .style('opacity', 0.8)
          .style('font-family', 'Montserrat')
          .style('padding', '12px').html(`
            <h4>${d.label} style</h4>
            <div>${this.formatYear(d.startYear)} → ${this.formatYear(d.endYear)}</div>
          `);

        this.moveTooltip(event);
      })
      .on('mousemove', (event) => {
        this.moveTooltip(event);
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(120)
          .attr('fill', d.color);

        this.tooltip.style('opacity', '0');
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
        .attr('fill', '#222')
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
    d3.select('body').select('.timeline-tooltip').remove();

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'timeline-tooltip')
      .style('position', 'fixed')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('background', '#111')
      .style('color', '#fff')
      .style('padding', '8px 10px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('line-height', '1.4')
      .style('box-shadow', '0 8px 24px rgba(0,0,0,0.2)')
      .style('z-index', '1000');
  }

  private moveTooltip(event: MouseEvent): void {
    this.tooltip.style('left', `${event.clientX + 14}px`).style('top', `${event.clientY + 14}px`);
  }
}
