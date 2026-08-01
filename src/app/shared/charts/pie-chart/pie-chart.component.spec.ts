import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieChartComponent } from './pie-chart.component';

interface TestPieChartItem {
  name: string;
  type: string;
}

describe('PieChartComponent', () => {
  let component: PieChartComponent<TestPieChartItem>;
  let fixture: ComponentFixture<PieChartComponent<TestPieChartItem>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PieChartComponent) as unknown as ComponentFixture<
      PieChartComponent<TestPieChartItem>
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
