import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineComponent } from './timeline.component';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an accessible timeline page heading after loading', () => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: jest.fn(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        takeRecords: jest.fn(() => []),
        unobserve: jest.fn(),
      })),
    });
    component.loading = false;
    component.groups = [{ groupName: 'Ancient', items: [] }];
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector(
      '#timeline-page-title',
    ) as HTMLHeadingElement;

    expect(heading.tagName).toBe('H1');
    expect(heading.textContent?.trim()).toBe('Architecture through the millennia');
  });
});
