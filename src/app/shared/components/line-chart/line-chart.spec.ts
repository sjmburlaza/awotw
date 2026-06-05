import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineChartComponent } from './line-chart';

interface TestLineChartItem {
  name: string;
  year: string;
  height: string;
}

describe('LineChartComponent', () => {
  let component: LineChartComponent<TestLineChartItem>;
  let fixture: ComponentFixture<LineChartComponent<TestLineChartItem>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent) as unknown as ComponentFixture<
      LineChartComponent<TestLineChartItem>
    >;
    component = fixture.componentInstance;
    component.data = [];
    component.labelKey = 'year';
    component.valueKey = 'height';
    component.tooltipBuilder = () => [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
