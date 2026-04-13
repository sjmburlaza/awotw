import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { StyleRange } from 'src/app/services/data.service';

@Component({
  selector: 'app-timeline-chart',
  imports: [],
  templateUrl: './timeline-chart.html',
  styleUrl: './timeline-chart.scss'
})
export class TimelineChartComponent implements AfterViewInit {
  @Input() styles: StyleRange[] = [];
  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  private renderChart(): void {
    const element = this.chartContainer.nativeElement;

    d3.select(element).selectAll('*').remove();

    const width = 1200;
    const rowHeight = 42;
    const margin = { top: 24, right: 30, bottom: 56, left: 180 };
    const height = margin.top + margin.bottom + this.styles.length * rowHeight;

    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

    const minYear = d3.min(this.styles, d => Math.min(d.startYear, d.endYear) ?? -1000) ?? -1000;
    const maxYear = d3.max(this.styles, d => Math.max(d.startYear, d.endYear) ?? 1000) ?? 1000;

    const paddedMinYear = minYear - 100;
    const paddedMaxYear = maxYear + 100;

    const x = d3
      .scaleLinear()
      .domain([paddedMinYear, paddedMaxYear])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleBand<string>()
      .domain(this.styles.map(d => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.28);

    // Background row guides
    svg
      .selectAll('line.row-guide')
      .data(this.styles)
      .join('line')
      .attr('class', 'row-guide')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('y2', d => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    // X axis ticks
    const tickValues = this.buildTickValues(paddedMinYear, paddedMaxYear);

    const xAxis = d3
      .axisBottom<number>(x)
      .tickValues(tickValues)
      .tickFormat(d => this.formatHistoricalYear(d));

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#6b7280'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#d1d5db'))
      .call(g => g.selectAll('.tick text').attr('font-size', 11));

    // Y axis
    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('.tick text').attr('font-size', 12));

    // Year boundary between BC and AD
    // There is no historical year 0, but visually this line separates negative and positive years.
    if (paddedMinYear < 0 && paddedMaxYear > 0) {
      svg
        .append('line')
        .attr('x1', x(0))
        .attr('x2', x(0))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#dc2626')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5 4');

      svg
        .append('text')
        .attr('x', x(0) + 6)
        .attr('y', margin.top - 6)
        .attr('font-size', 11)
        .attr('fill', '#dc2626')
        .text('BC / AD boundary');
    }

    // Bars
    svg
      .selectAll('rect.timeline-bar')
      .data(this.styles)
      .join('rect')
      .attr('class', 'timeline-bar')
      .attr('x', d => x(Math.min(d.startYear, d.endYear)))
      .attr('y', d => y(d.label) ?? 0)
      .attr('width', d => {
        const start = x(Math.min(d.startYear, d.endYear));
        const end = x(Math.max(d.startYear, d.endYear));
        return Math.max(2, end - start);
      })
      .attr('height', y.bandwidth())
      .attr('fill', d => d.color ?? '#2563eb');

    // Range labels on bars
    svg
      .selectAll('text.bar-range-label')
      .data(this.styles)
      .join('text')
      .attr('class', 'bar-range-label')
      .attr('x', d => x(Math.min(d.startYear, d.endYear)) + 8)
      .attr('y', d => (y(d.label) ?? 0) + y.bandwidth() / 2 + 4)
      .attr('fill', 'white')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .text(d => `${this.formatHistoricalYear(d.startYear)} – ${this.formatHistoricalYear(d.endYear)}`)
      .each(function (d) {
        const textSel = d3.select(this as SVGTextElement);
        const textEl = this as SVGTextElement;
        const barStart = x(Math.min(d.startYear, d.endYear));
        const barEnd = x(Math.max(d.startYear, d.endYear));
        const chartLeft = margin.left;
        const chartRight = width - margin.right;
        const textWidth = textEl.getComputedTextLength();

        // CASE 1: fits on the right
        const spaceRight = chartRight - barEnd;
        if (textWidth + 6 <= spaceRight) {
          textSel
            .attr('x', barEnd + 6)
            .attr('text-anchor', 'start')
            .attr('fill', '#111');
          return;
        }

        // CASE 2: fits on the left
        const spaceLeft = barStart - chartLeft;
        if (textWidth + 6 <= spaceLeft) {
          textSel
            .attr('x', barStart - 6)
            .attr('text-anchor', 'end')
            .attr('fill', '#111');
          return;
        }

        // CASE 3: no space → hide
        textSel.text('');
      });
  }

  private formatHistoricalYear(year: number): string {
    const rounded = Math.round(year);

    if (rounded < 0) {
      return `${Math.abs(rounded)} BC`;
    }

    if (rounded > 0) {
      return `${rounded} AD`;
    }

    return '';
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
}
