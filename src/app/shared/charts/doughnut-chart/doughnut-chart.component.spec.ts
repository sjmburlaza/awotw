import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoughnutChartComponent } from './doughnut-chart.component';

interface TestDoughnutChartItem {
  name: string;
  type: string;
}

describe('DoughnutChartComponent', () => {
  let component: DoughnutChartComponent<TestDoughnutChartItem>;
  let fixture: ComponentFixture<DoughnutChartComponent<TestDoughnutChartItem>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoughnutChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DoughnutChartComponent) as unknown as ComponentFixture<
      DoughnutChartComponent<TestDoughnutChartItem>
    >;
    component = fixture.componentInstance;
    component.data = [];
    component.key = 'type';
    component.tooltipBuilder = () => [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
