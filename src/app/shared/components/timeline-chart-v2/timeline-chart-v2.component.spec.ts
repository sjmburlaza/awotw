import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineChartV2Component } from './timeline-chart-v2.component';

type TimelineChartV2ComponentWithTooltipPosition = TimelineChartV2Component & {
  getContainedTooltipPosition: (
    clientX: number,
    clientY: number,
    containerRect: { left: number; top: number; width: number; height: number },
    tooltipRect: { width: number; height: number },
  ) => { left: number; top: number };
};

describe('TimelineChartV2Component', () => {
  let component: TimelineChartV2Component;
  let fixture: ComponentFixture<TimelineChartV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineChartV2Component],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineChartV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('positions the tooltip inside the chart container near the lower-right edge', () => {
    const position = (
      component as unknown as TimelineChartV2ComponentWithTooltipPosition
    ).getContainedTooltipPosition(
      480,
      470,
      { left: 100, top: 200, width: 400, height: 300 },
      { width: 120, height: 80 },
    );

    expect(position).toEqual({ left: 246, top: 176 });
  });

  it('clamps the tooltip inside narrow chart containers', () => {
    const position = (
      component as unknown as TimelineChartV2ComponentWithTooltipPosition
    ).getContainedTooltipPosition(
      50,
      50,
      { left: 0, top: 0, width: 100, height: 90 },
      { width: 160, height: 120 },
    );

    expect(position).toEqual({ left: 8, top: 8 });
  });
});
