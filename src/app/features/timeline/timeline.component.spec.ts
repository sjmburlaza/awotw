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

  it('shows each wonder description at the bottom without timeline facts or a tooltip', () => {
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
    component.groups = [
      {
        groupName: 'Ancient',
        items: [
          {
            id: 1,
            name: 'Step Pyramid of Djoser',
            description: "Egypt's first monumental stone pyramid.",
            yearBuilt: '2667-2648 BC',
            style: 'Egyptian',
            buildingType: 'Memorial',
            location: 'Saqqara, Egypt',
            continent: 'Africa',
            descriptionURL: '',
            imageURL: '',
            codename: 'SPD',
            color: '#566D7E',
          },
        ],
      },
    ];
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.item__description')?.textContent?.trim()).toBe(
      "Egypt's first monumental stone pyramid.",
    );
    expect(element.querySelector('.item__description .bi-lightbulb')).not.toBeNull();
    expect(element.querySelector('.item__facts')).toBeNull();
    expect(element.querySelector('.item__info')).toBeNull();
  });
});
