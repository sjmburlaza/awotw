import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { orbitControls } from 'globe.gl';
import { COLOR_VARS, cssVar } from 'src/app/shared/theme-colors';

import { WorldTourModeComponent } from './world-tour-mode.component';

interface WorldTourModeInternals {
  selectedMarkerElement?: HTMLElement;
  markerElementsById: Map<number, HTMLElement>;
  ensureActiveMarkerState(): void;
  updatePopupPosition(): void;
}

describe('WorldTourModeComponent', () => {
  let component: WorldTourModeComponent;
  let fixture: ComponentFixture<WorldTourModeComponent>;
  let dataServiceMock: Pick<DataService, 'getWonders'>;

  const wonders: Item[] = [
    createWonder(
      1,
      'Taj Mahal',
      'Agra, India',
      'Mughal',
      'Mausoleum',
      '1648',
      '27.1751',
      '78.0421',
    ),
    createWonder(
      2,
      'Colosseum',
      'Rome, Italy',
      'Roman',
      'Amphitheatre',
      '80',
      '41.8902',
      '12.4922',
    ),
    createWonder(
      3,
      'Eiffel Tower',
      'Paris, France',
      'Structural Expressionist',
      'Observation tower',
      '1889',
      '48.8584',
      '2.2945',
    ),
    createWonder(
      4,
      'Sydney Opera House',
      'Sydney, Australia',
      'Expressionist',
      'Performing arts',
      '1973',
      '-33.8568',
      '151.2153',
    ),
    createWonder(
      5,
      'Machu Picchu',
      'Cusco Region, Peru',
      'Inca',
      'Citadel',
      '1450',
      '-13.1631',
      '-72.545',
    ),
  ];

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    dataServiceMock = {
      getWonders: jest.fn(() => of(wonders)),
    };

    await TestBed.configureTestingModule({
      imports: [WorldTourModeComponent],
      providers: [{ provide: DataService, useValue: dataServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(WorldTourModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('starts a tour with a random quiz question anchored to a stop', () => {
    expect(component).toBeTruthy();
    expect(component.totalStops).toBe(wonders.length);
    expect(component.currentStop).toBeTruthy();
    expect(component.currentQuestion).toBeTruthy();
    expect(component.currentQuestion?.options).toContain(component.currentQuestion.correctAnswer);
  });

  it('locks globe controls while playing', () => {
    expect(orbitControls.enabled).toBe(false);
    expect(orbitControls.enableRotate).toBe(false);
    expect(orbitControls.enableZoom).toBe(false);
    expect(orbitControls.enablePan).toBe(false);
    expect(orbitControls.autoRotate).toBe(false);
  });

  it('does not reveal the active wonder name or location in helper text', () => {
    const currentStop = component.currentStop as Item;
    const tourLabel = fixture.nativeElement.querySelector('.tour-label');
    const tourPromptTitle = fixture.nativeElement.querySelector('.tour-prompt strong');
    const tourInstruction = fixture.nativeElement.querySelector('.tour-instruction') as HTMLElement;
    const popupMeta = fixture.nativeElement.querySelector('.quiz-popup__meta');
    const popupImage = fixture.nativeElement.querySelector(
      '.quiz-popup__image',
    ) as HTMLImageElement;

    expect(tourLabel).toBeNull();
    expect(tourPromptTitle).toBeNull();
    expect(tourInstruction.textContent?.trim()).toBe(
      'To complete the game, clear all the markers by answering each pop-up question correctly.',
    );
    expect(tourInstruction.textContent).not.toContain('Active stop');
    expect(tourInstruction.textContent).not.toContain('Marker in focus');
    expect(tourInstruction.textContent).not.toContain(currentStop.name);
    expect(tourInstruction.textContent).not.toContain(currentStop.location);
    expect(component.currentQuestion?.prompt).not.toContain(currentStop.name);
    expect(component.currentQuestion?.prompt).not.toContain(currentStop.location);
    expect(popupMeta).toBeNull();
    expect(popupImage.alt).toBe('Current world tour stop');
  });

  it('marks the current active stop marker as visually distinct', () => {
    const currentStopId = component.currentStop?.id as number;
    const markerElements = (component as unknown as WorldTourModeInternals).markerElementsById;
    const activeMarker = markerElements.get(currentStopId);
    const inactiveMarker = Array.from(markerElements.entries()).find(
      ([id]) => id !== currentStopId,
    )?.[1];

    expect(activeMarker?.getAttribute('aria-current')).toBe('location');
    expect(activeMarker?.style.filter).toBe(cssVar(COLOR_VARS.globeMarkerGlow));
    expect(activeMarker?.style.zIndex).toBe('3');
    expect(inactiveMarker?.getAttribute('aria-current')).toBeNull();
    expect(inactiveMarker?.style.filter).toBe('');
  });

  it('clears the current marker after a correct answer and advances to another stop', () => {
    const currentStopId = component.currentStop?.id;
    const correctAnswer = component.currentQuestion?.correctAnswer as string;

    component.submitAnswer(correctAnswer);

    expect(component.answerResult?.isCorrect).toBe(true);
    expect(component.clearedCount).toBe(1);
    expect(component.remainingCount).toBe(wonders.length - 1);

    jest.advanceTimersByTime(2500);

    expect(component.currentStop?.id).not.toBe(currentStopId);
    expect(component.currentQuestion).toBeTruthy();

    const nextStopId = component.currentStop?.id as number;
    const markerElements = (component as unknown as WorldTourModeInternals).markerElementsById;
    const activeMarker = markerElements.get(nextStopId);

    expect(activeMarker?.getAttribute('aria-current')).toBe('location');
    expect(activeMarker?.style.filter).toBe(cssVar(COLOR_VARS.globeMarkerGlow));
    expect(activeMarker?.style.zIndex).toBe('3');
  });

  it('keeps the popup visible long enough to show correct-answer feedback', () => {
    const currentStopId = component.currentStop?.id;
    const correctAnswer = component.currentQuestion?.correctAnswer as string;

    expect(fixture.nativeElement.querySelector('.quiz-popup__feedback')).toBeNull();
    expect(fixture.nativeElement.querySelector('.quiz-popup__feedback-slot')).toBeNull();

    component.submitAnswer(correctAnswer);
    jest.advanceTimersByTime(999);
    fixture.detectChanges();

    const popup = fixture.nativeElement.querySelector('.quiz-popup');
    const question = fixture.nativeElement.querySelector('.quiz-popup__question');
    const correctOption = fixture.nativeElement.querySelector('.quiz-popup__option.is-correct');
    const feedback = fixture.nativeElement.querySelector('.quiz-popup__feedback');

    expect(popup).toBeTruthy();
    expect(popup.classList.contains('has-feedback')).toBe(true);
    expect(popup.classList.contains('is-frozen-position')).toBe(true);
    expect(popup.classList.contains('is-fallback-position')).toBe(false);
    expect(component.isPopupPositionFrozen).toBe(true);
    expect(popup.style.left).toBeTruthy();
    expect(popup.style.top).toBeTruthy();
    expect(question).toBeTruthy();
    expect(correctOption?.textContent).toContain(correctAnswer);
    expect(feedback?.textContent).toContain('Correct. Marker cleared.');
    expect(component.currentStop?.id).toBe(currentStopId);
  });

  it('reapplies the active marker glow if globe rendering overwrites it after advancing', () => {
    const correctAnswer = component.currentQuestion?.correctAnswer as string;

    component.submitAnswer(correctAnswer);
    jest.advanceTimersByTime(2500);

    const internals = component as unknown as WorldTourModeInternals;
    const activeMarker = internals.markerElementsById.get(component.currentStop?.id as number);

    activeMarker?.removeAttribute('aria-current');
    if (activeMarker) {
      activeMarker.style.filter = '';
      activeMarker.style.zIndex = '';
    }

    internals.ensureActiveMarkerState();

    expect(activeMarker?.getAttribute('aria-current')).toBe('location');
    expect(activeMarker?.style.filter).toBe(cssVar(COLOR_VARS.globeMarkerGlow));
    expect(activeMarker?.style.zIndex).toBe('3');
  });

  it('uses globe screen coordinates while waiting for the next marker anchor', () => {
    const internals = component as unknown as WorldTourModeInternals;

    jest
      .spyOn(component.globeContainer.nativeElement, 'getBoundingClientRect')
      .mockReturnValue(createRect({ width: 1200, height: 700 }));

    internals.selectedMarkerElement = undefined;
    internals.updatePopupPosition();
    fixture.detectChanges();

    const popup = fixture.nativeElement.querySelector('.quiz-popup') as HTMLElement;

    expect(component.currentQuestion).toBeTruthy();
    expect(component.popupPosition).toEqual({ left: 600, top: 300 });
    expect(popup).toBeTruthy();
    expect(popup.classList.contains('is-fallback-position')).toBe(false);
    expect(popup.style.left).toBe('600px');
    expect(popup.style.top).toBe('300px');
  });

  it('keeps the current marker after a wrong answer and still advances', () => {
    const currentStopId = component.currentStop?.id;
    const wrongAnswer = component.currentQuestion?.options.find(
      (option) => option !== component.currentQuestion?.correctAnswer,
    ) as string;

    component.submitAnswer(wrongAnswer);

    expect(component.answerResult?.isCorrect).toBe(false);
    expect(component.clearedCount).toBe(0);
    expect(component.remainingCount).toBe(wonders.length);

    jest.advanceTimersByTime(2500);

    expect(component.currentStop?.id).not.toBe(currentStopId);
    expect(component.remainingCount).toBe(wonders.length);
  });

  it('formats tour duration with hours when needed', () => {
    expect(component.formatDuration(65)).toBe('1:05');
    expect(component.formatDuration(3661)).toBe('1:01:01');
  });
});

function createRect({
  left = 0,
  top = 0,
  width = 0,
  height = 0,
}: {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function createWonder(
  id: number,
  name: string,
  location: string,
  style: string,
  buildingType: string,
  yearBuilt: string,
  lat: string,
  lon: string,
): Item {
  return {
    id,
    name,
    yearBuilt,
    style,
    buildingType,
    location,
    continent: 'Test',
    descriptionURL: `https://example.com/${id}`,
    imageURL: `https://example.com/${id}.jpg`,
    codename: String(id),
    color: '#0891b2',
    lat,
    lon,
  };
}
