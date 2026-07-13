import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChartComponent } from './bar-chart.component';

interface TestBarChartItem {
  name: string;
  color: string;
  value: string;
}

describe('BarChartComponent', () => {
  let component: BarChartComponent<TestBarChartItem>;
  let fixture: ComponentFixture<BarChartComponent<TestBarChartItem>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartComponent) as unknown as ComponentFixture<
      BarChartComponent<TestBarChartItem>
    >;
    component = fixture.componentInstance;
    component.data = [];
    component.key = 'value';
    component.tooltipBuilder = () => [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
