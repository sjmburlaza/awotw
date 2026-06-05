import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineChartV2Component } from './timeline-chart-v2';

describe('TimelineChartV2Component', () => {
  let component: TimelineChartV2Component;
  let fixture: ComponentFixture<TimelineChartV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineChartV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimelineChartV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
