import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineChartV2 } from './timeline-chart-v2';

describe('TimelineChartV2', () => {
  let component: TimelineChartV2;
  let fixture: ComponentFixture<TimelineChartV2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineChartV2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimelineChartV2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
