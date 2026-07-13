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

  it('renders an optional tooltip image', () => {
    component.imageSrc = 'https://example.com/wonder.jpg';
    component.imageAlt = 'Image hint for Great Pyramid of Giza';
    fixture.detectChanges();

    const tooltip = fixture.nativeElement.querySelector('#test-tooltip') as HTMLElement;
    const image = fixture.nativeElement.querySelector('.info-tooltip__image') as HTMLImageElement;

    expect(tooltip.classList).toContain('info-tooltip__content--media');
    expect(image).toBeTruthy();
    expect(image.src).toBe('https://example.com/wonder.jpg');
    expect(image.alt).toBe('Image hint for Great Pyramid of Giza');
  });
});
