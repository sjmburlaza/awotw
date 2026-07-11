import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import Globe, { GlobeInstance } from 'globe.gl';
import { catchError, EMPTY, map, take, tap } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { LoaderComponent } from 'src/app/shared/components/loader/loader';

type QuizCode = 'name' | 'location' | 'style' | 'yearBuilt' | 'buildingType';

interface QuizType {
  code: QuizCode;
  prompt: () => string;
}

interface TourQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
}

interface TourStop extends Item {
  latNum: number;
  lonNum: number;
}

interface AnswerResult {
  isCorrect: boolean;
  selectedOption: string;
  correctAnswer: string;
  message: string;
}

interface PopupPosition {
  left: number;
  top: number;
}

@Component({
  selector: 'app-world-tour-mode',
  imports: [RouterModule, LoaderComponent],
  templateUrl: './world-tour-mode.html',
  styleUrl: './world-tour-mode.scss',
})
export class WorldTourModeComponent implements AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly ngZone = inject(NgZone);
  private readonly quizTypes: QuizType[] = [
    {
      code: 'name',
      prompt: () => 'Which wonder is marked here?',
    },
    {
      code: 'location',
      prompt: () => 'Where is this wonder located?',
    },
    {
      code: 'style',
      prompt: () => 'What style is this wonder?',
    },
    {
      code: 'yearBuilt',
      prompt: () => 'When was this wonder built?',
    },
    {
      code: 'buildingType',
      prompt: () => 'What is this wonder used for?',
    },
  ];
  private readonly advanceDelayMs = 2500;

  @ViewChild('globeContainer', { static: true })
  globeContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('quizPopup')
  quizPopup?: ElementRef<HTMLDivElement>;

  private globe?: GlobeInstance;
  private isGlobeReady = false;
  private isDataLoading = true;
  private readonly clearedStopIds = new Set<number>();
  private readonly markerElementsById = new Map<number, HTMLElement>();
  private readonly markerListeners = new Map<
    HTMLElement,
    { click: EventListener; keydown: EventListener }
  >();
  private selectedMarkerElement?: HTMLElement;
  private popupTrackingFrameId?: number;
  private timerId?: number;
  private timerStartedAt = 0;
  private advanceTimerId?: number;
  private globeReadyFallbackId?: number;

  stops: TourStop[] = [];
  currentStop: TourStop | null = null;
  currentQuestion: TourQuestion | null = null;
  popupPosition: PopupPosition | null = null;
  answerResult: AnswerResult | null = null;
  isLoading = true;
  errorMessage = '';
  hasMarkers = true;
  elapsedSeconds = 0;
  attempts = 0;
  isFinished = false;
  isPopupPositionFrozen = false;

  get totalStops(): number {
    return this.stops.length;
  }

  get clearedCount(): number {
    return this.clearedStopIds.size;
  }

  get remainingCount(): number {
    return Math.max(0, this.totalStops - this.clearedCount);
  }

  ngAfterViewInit(): void {
    this.initGlobe();
    this.loadWonders();
  }

  ngOnDestroy(): void {
    this.clearAdvanceTimer();
    this.clearGlobeReadyFallbackTimer();
    this.stopTimer();
    this.clearCurrentStop();
    this.removeMarkerListeners();
    this.globe?.htmlElementsData([]);
    this.globe = undefined;
    this.globeContainer.nativeElement.replaceChildren();
  }

  submitAnswer(option: string): void {
    if (!this.currentStop || !this.currentQuestion || this.answerResult || this.isFinished) return;

    const wasCorrect = option === this.currentQuestion.correctAnswer;
    const anchoredPopupPosition = this.popupPosition;
    const frozenPopupPosition = this.getCurrentPopupTopLeft();

    this.attempts++;
    this.stopPopupTracking();
    this.popupPosition = frozenPopupPosition ?? anchoredPopupPosition;
    this.isPopupPositionFrozen = Boolean(frozenPopupPosition);
    this.answerResult = {
      isCorrect: wasCorrect,
      selectedOption: option,
      correctAnswer: this.currentQuestion.correctAnswer,
      message: wasCorrect ? 'Correct. Marker cleared.' : 'Not quite. Marker stays on the globe.',
    };

    if (wasCorrect) {
      this.clearedStopIds.add(this.currentStop.id);
    }

    this.clearAdvanceTimer();
    this.advanceTimerId = window.setTimeout(() => {
      this.ngZone.run(() => this.advanceAfterAnswer());
    }, this.advanceDelayMs);
  }

  restartGame(): void {
    if (!this.stops.length) return;

    this.clearAdvanceTimer();
    this.stopTimer();
    this.clearCurrentStop();
    this.clearedStopIds.clear();
    this.stops = this.shuffleArray([...this.stops]);
    this.attempts = 0;
    this.elapsedSeconds = 0;
    this.isFinished = false;
    this.hasMarkers = true;
    this.updateGlobeMarkers();
    this.startTimer();
    this.activateNextStop();
  }

  formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private initGlobe(): void {
    this.globe = new Globe(this.globeContainer.nativeElement)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .htmlElementsData([])
      .htmlLat('latNum')
      .htmlLng('lonNum')
      .htmlElement((d: object) => this.createMarkerElement(d as TourStop))
      .onGlobeReady(() => {
        this.ngZone.run(() => this.markGlobeReady());
      })
      .pointOfView({ lat: 25, lng: 0, altitude: 1.7 }, 1000);

    this.lockGlobeControls();

    this.globeReadyFallbackId = window.setTimeout(() => {
      this.ngZone.run(() => this.markGlobeReady());
    }, 1500);
  }

  private lockGlobeControls(): void {
    const controls = this.globe?.controls();

    if (!controls) return;

    controls.enabled = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = false;
  }

  private loadWonders(): void {
    this.dataService
      .getWonders()
      .pipe(
        take(1),
        map((wonders) =>
          wonders
            .filter((wonder) => wonder.lat && wonder.lon)
            .map(
              (wonder): TourStop => ({
                ...wonder,
                latNum: Number(wonder.lat),
                lonNum: Number(wonder.lon),
              }),
            )
            .filter((wonder) => !Number.isNaN(wonder.latNum) && !Number.isNaN(wonder.lonNum)),
        ),
        map((wonders) => this.shuffleArray(wonders)),
        tap((validWonders) => {
          this.stops = validWonders;
          this.errorMessage = validWonders.length ? '' : 'No world tour markers available.';
          this.hasMarkers = validWonders.length > 0;
          this.isDataLoading = false;
          this.updateGlobeMarkers();
          this.updateLoadingState();
          this.startTourWhenReady();
        }),
        catchError(() => {
          this.stops = [];
          this.errorMessage = 'Unable to load World Tour Mode data.';
          this.hasMarkers = false;
          this.isDataLoading = false;
          this.updateLoadingState();
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private startTourWhenReady(): void {
    if (
      !this.globe ||
      !this.isGlobeReady ||
      this.isDataLoading ||
      this.errorMessage ||
      !this.stops.length ||
      this.currentStop ||
      this.isFinished
    ) {
      return;
    }

    this.startTimer();
    this.activateNextStop();
  }

  private updateLoadingState(): void {
    this.isLoading = this.isDataLoading || !this.isGlobeReady;
  }

  private markGlobeReady(): void {
    if (this.isGlobeReady) return;

    this.clearGlobeReadyFallbackTimer();
    this.isGlobeReady = true;
    this.updateLoadingState();
    this.startTourWhenReady();
  }

  private advanceAfterAnswer(): void {
    this.clearAdvanceTimer();

    if (this.answerResult?.isCorrect) {
      this.stopPopupTracking();
      this.selectedMarkerElement = undefined;
      this.updateGlobeMarkers();
    }

    if (this.remainingCount === 0) {
      this.finishGame();
      return;
    }

    this.activateNextStop();
  }

  private activateNextStop(): void {
    const nextStop = this.findNextStop();

    if (!nextStop) {
      this.finishGame();
      return;
    }

    this.activateStop(nextStop);
  }

  private activateStop(stop: TourStop): void {
    if (this.clearedStopIds.has(stop.id) || this.isFinished) return;

    this.clearAdvanceTimer();
    this.answerResult = null;
    this.isPopupPositionFrozen = false;
    this.currentStop = stop;
    this.currentQuestion = this.generateQuestion(stop);
    this.attachSelectedMarker(stop);
    this.refreshMarkerSelectionState();

    this.globe?.pointOfView(
      {
        lat: stop.latNum,
        lng: stop.lonNum,
        altitude: 0.55,
      },
      1200,
    );
  }

  private findNextStop(): TourStop | undefined {
    const remainingStops = this.getRemainingStops();

    if (!remainingStops.length) return undefined;
    if (!this.currentStop) return remainingStops[0];

    const currentIndex = this.stops.findIndex((stop) => stop.id === this.currentStop?.id);

    if (currentIndex === -1) return remainingStops[0];

    for (let offset = 1; offset <= this.stops.length; offset++) {
      const candidate = this.stops[(currentIndex + offset) % this.stops.length];

      if (!this.clearedStopIds.has(candidate.id)) return candidate;
    }

    return undefined;
  }

  private generateQuestion(stop: TourStop): TourQuestion {
    const type = this.quizTypes[this.generateRandomNum(this.quizTypes.length)];
    const correctAnswer = String(stop[type.code] ?? '');
    const options = [correctAnswer];
    const optionPool = Array.from(
      new Set(
        this.stops
          .map((dataItem) => String(dataItem[type.code] ?? ''))
          .filter((option) => option && option !== correctAnswer),
      ),
    );

    while (options.length < 5 && optionPool.length) {
      const idx = this.generateRandomNum(optionPool.length);
      const [option] = optionPool.splice(idx, 1);
      options.push(option);
    }

    return {
      prompt: type.prompt(),
      options: this.shuffleArray(options),
      correctAnswer,
    };
  }

  private createMarkerElement(wonder: TourStop): HTMLElement {
    const el = document.createElement('div');
    const previousElement = this.markerElementsById.get(wonder.id);

    el.style.width = '30px';
    el.style.height = '30px';
    el.style.cursor = 'pointer';
    el.style.transform = 'translate(-50%, -100%)';
    el.style.pointerEvents = 'auto';
    el.style.transition = 'filter 160ms ease';
    el.title = wonder.name;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Fly to ${wonder.name}`);

    el.appendChild(this.createPinSvg(this.getSafeHexColor(wonder.color)));

    const clickHandler: EventListener = (event) => {
      event.stopPropagation();
      this.ngZone.run(() => this.activateStop(wonder));
    };

    const keydownHandler: EventListener = (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;

      keyboardEvent.preventDefault();
      this.ngZone.run(() => this.activateStop(wonder));
    };

    el.addEventListener('click', clickHandler);
    el.addEventListener('keydown', keydownHandler);
    if (previousElement) {
      this.removeMarkerElementListeners(previousElement);
    }

    this.markerListeners.set(el, { click: clickHandler, keydown: keydownHandler });
    this.markerElementsById.set(wonder.id, el);
    this.setMarkerActiveState(el, wonder.id === this.currentStop?.id);

    return el;
  }

  private attachSelectedMarker(stop: TourStop): void {
    this.stopPopupTracking();
    this.selectedMarkerElement = this.markerElementsById.get(stop.id);
    this.updatePopupPosition();
    this.startPopupTracking();
  }

  private startPopupTracking(): void {
    this.stopPopupTracking();

    const trackPopupPosition = () => {
      if (this.answerResult || this.isPopupPositionFrozen) {
        this.popupTrackingFrameId = undefined;
        return;
      }

      if (!this.selectedMarkerElement && this.currentStop) {
        this.selectedMarkerElement = this.markerElementsById.get(this.currentStop.id);
      }

      this.ensureActiveMarkerState();
      this.updatePopupPosition();
      this.popupTrackingFrameId = requestAnimationFrame(trackPopupPosition);
    };

    this.popupTrackingFrameId = requestAnimationFrame(trackPopupPosition);
  }

  private stopPopupTracking(): void {
    if (this.popupTrackingFrameId === undefined) return;

    cancelAnimationFrame(this.popupTrackingFrameId);
    this.popupTrackingFrameId = undefined;
  }

  private updatePopupPosition(): void {
    if (this.isPopupPositionFrozen) return;

    const globeRect = this.globeContainer.nativeElement.getBoundingClientRect();
    const markerAnchor = this.getMarkerAnchorPosition(globeRect);

    if (!markerAnchor) {
      this.popupPosition = null;
      return;
    }

    const popupHalfWidth = 180;
    const minLeft = Math.min(popupHalfWidth + 16, Math.max(16, globeRect.width - 16));
    const maxLeft = Math.max(minLeft, globeRect.width - popupHalfWidth - 16);
    const minTop = this.getMinimumPopupAnchorTop(globeRect);
    const maxTop = Math.max(minTop, globeRect.height - 20);

    this.popupPosition = {
      left: this.clamp(markerAnchor.left, minLeft, maxLeft),
      top: this.clamp(markerAnchor.top, minTop, maxTop),
    };
  }

  private getMarkerAnchorPosition(globeRect: DOMRect): PopupPosition | null {
    if (this.selectedMarkerElement) {
      const markerRect = this.selectedMarkerElement.getBoundingClientRect();

      return {
        left: markerRect.left - globeRect.left + markerRect.width / 2,
        top: markerRect.top - globeRect.top,
      };
    }

    if (!this.currentStop || !this.globe) return null;

    const screenCoords = this.globe.getScreenCoords(
      this.currentStop.latNum,
      this.currentStop.lonNum,
      0,
    );

    if (!Number.isFinite(screenCoords.x) || !Number.isFinite(screenCoords.y)) return null;

    return {
      left: screenCoords.x,
      top: screenCoords.y,
    };
  }

  private getCurrentPopupTopLeft(): PopupPosition | null {
    const popupEl = this.quizPopup?.nativeElement;

    if (!popupEl) return null;

    const globeRect = this.globeContainer.nativeElement.getBoundingClientRect();
    const popupRect = popupEl.getBoundingClientRect();

    return {
      left: popupRect.left - globeRect.left,
      top: popupRect.top - globeRect.top,
    };
  }

  private getMinimumPopupAnchorTop(globeRect: DOMRect): number {
    const popupHeight = this.quizPopup?.nativeElement.getBoundingClientRect().height ?? 0;
    const preferredMinTop = popupHeight > 0 ? popupHeight + 14 : 300;

    return Math.min(preferredMinTop, Math.max(24, globeRect.height - 20));
  }

  private updateGlobeMarkers(): void {
    this.globe?.htmlElementsData(this.getRemainingStops());
    this.hasMarkers = this.remainingCount > 0;
    this.refreshMarkerSelectionState();
  }

  private getRemainingStops(): TourStop[] {
    return this.stops.filter((stop) => !this.clearedStopIds.has(stop.id));
  }

  private refreshMarkerSelectionState(): void {
    this.markerElementsById.forEach((element, id) => {
      this.setMarkerActiveState(element, id === this.currentStop?.id);
    });
  }

  private ensureActiveMarkerState(): void {
    if (!this.currentStop) return;

    const activeMarker = this.markerElementsById.get(this.currentStop.id);

    if (!activeMarker) return;

    this.selectedMarkerElement = activeMarker;
    this.refreshMarkerSelectionState();
  }

  private setMarkerActiveState(element: HTMLElement, isActive: boolean): void {
    element.style.filter = isActive
      ? 'drop-shadow(0 0 5px #ffffff) drop-shadow(0 0 14px #38bdf8) drop-shadow(0 6px 10px rgba(0, 0, 0, 0.55))'
      : '';
    element.style.zIndex = isActive ? '3' : '';

    if (isActive) {
      element.setAttribute('aria-current', 'location');
    } else {
      element.removeAttribute('aria-current');
    }
  }

  private finishGame(): void {
    this.stopTimer();
    this.clearCurrentStop();
    this.isFinished = true;
    this.hasMarkers = false;
    this.updateGlobeMarkers();
    this.globe?.pointOfView({ lat: 20, lng: 0, altitude: 1.7 }, 1200);
  }

  private clearCurrentStop(): void {
    this.stopPopupTracking();
    this.selectedMarkerElement = undefined;
    this.currentStop = null;
    this.currentQuestion = null;
    this.popupPosition = null;
    this.answerResult = null;
    this.isPopupPositionFrozen = false;
    this.refreshMarkerSelectionState();
  }

  private startTimer(): void {
    if (this.timerId !== undefined) return;

    this.timerStartedAt = Date.now() - this.elapsedSeconds * 1000;
    this.timerId = window.setInterval(() => {
      this.ngZone.run(() => {
        this.elapsedSeconds = Math.floor((Date.now() - this.timerStartedAt) / 1000);
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId === undefined) return;

    clearInterval(this.timerId);
    this.timerId = undefined;
  }

  private clearAdvanceTimer(): void {
    if (this.advanceTimerId === undefined) return;

    clearTimeout(this.advanceTimerId);
    this.advanceTimerId = undefined;
  }

  private clearGlobeReadyFallbackTimer(): void {
    if (this.globeReadyFallbackId === undefined) return;

    clearTimeout(this.globeReadyFallbackId);
    this.globeReadyFallbackId = undefined;
  }

  private createPinSvg(color: string): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '30');
    svg.setAttribute('height', '30');
    svg.setAttribute('fill', color);
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      'M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    );
    svg.appendChild(path);

    return svg;
  }

  private generateRandomNum(arrLength: number): number {
    return Math.floor(Math.random() * arrLength);
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  private getSafeHexColor(color?: string): string {
    return color && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color) ? color : '#ff5722';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private removeMarkerListeners(): void {
    this.markerElementsById.forEach((element) => this.removeMarkerElementListeners(element));
    this.markerListeners.clear();
    this.markerElementsById.clear();
  }

  private removeMarkerElementListeners(element: HTMLElement): void {
    const listeners = this.markerListeners.get(element);

    if (!listeners) return;

    element.removeEventListener('click', listeners.click);
    element.removeEventListener('keydown', listeners.keydown);
    this.markerListeners.delete(element);
  }
}
