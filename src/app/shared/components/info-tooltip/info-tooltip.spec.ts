import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoTooltipComponent } from './info-tooltip';

describe('InfoTooltipComponent', () => {
  let component: InfoTooltipComponent;
  let fixture: ComponentFixture<InfoTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoTooltipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoTooltipComponent);
    component = fixture.componentInstance;
    component.text = 'Helpful explanation.';
    component.ariaLabel = 'Explain this value';
    component.tooltipId = 'test-tooltip';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders accessible tooltip text', () => {
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('button');
    const tooltip = element.querySelector('#test-tooltip');

    expect(button?.getAttribute('aria-label')).toBe('Explain this value');
    expect(button?.getAttribute('aria-describedby')).toBe('test-tooltip');
    expect(tooltip?.textContent?.trim()).toBe('Helpful explanation.');
  });
});
