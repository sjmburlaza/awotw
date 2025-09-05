import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-chart',
  imports: [BaseChartDirective],
  templateUrl: './chart.html',
  styleUrl: './chart.scss'
})
export class Chart implements OnChanges {
  @Input() chartType: ChartType = 'bar';
  @Input() chartData!: ChartConfiguration['data'];
  @Input() chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    }
  }

  updatedData!: ChartConfiguration['data'];
  currentType!: ChartType;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && this.chartData) {
      this.updatedData = { ...this.chartData }
    }
    if (changes['chartType']) {
      this.currentType = this.chartType;
    }
  }

}
