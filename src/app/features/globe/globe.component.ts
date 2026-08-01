import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import Globe, { GlobeInstance } from 'globe.gl';
import { catchError, EMPTY, map, take, tap } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { LoaderTetrisComponent } from 'src/app/shared/components/loader-tetris/loader-tetris.component';
import { LoaderComponent } from 'src/app/shared/components/loader/loader.component';
import { COLOR_VARS, getCssColor } from 'src/app/shared/theme-colors';

interface WonderMarker extends Item {
  latNum: number;
  lonNum: number;
}

interface PopupPosition {
  left: number;
  top: number;
}

const POPUP_MARKER_GAP_PX = 8;
const GLOBE_FOCUS_TRANSITION_MS = 1800;
const GLOBE_OFFSET_SMOOTHING = 0.12;
const GLOBE_OFFSET_SETTLE_DISTANCE_PX = 0.5;

@Component({
  selector: 'app-globe',
  imports: [RouterModule, LoaderComponent, LoaderTetrisComponent],
  templateUrl: './globe.component.html',
  styleUrl: './globe.component.scss',
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly ngZone = inject(NgZone);
  private readonly prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  @ViewChild('globeContainer', { static: true })
  globeContainer!: ElementRef<HTMLDivElement>;

  private globe?: GlobeInstance;
  private isGlobeReady = false;
  private areMarkersReady = false;
  private expectedMarkerCount = 0;
  private renderedMarkerCount = 0;
  private renderedMarkers = new WeakSet<WonderMarker>();
  private readonly markerListeners = new Map<
    HTMLElement,
    { click: EventListener; keydown: EventListener }
  >();
  isLoading = true;
  errorMessage = '';
  hasMarkers = true;

  selectedWonder: WonderMarker | null = null;
  popupPosition: PopupPosition | null = null;
  popupImageSrc = '';
  isPopupImageLoading = false;
  hasPopupImageError = false;

  private selectedMarkerElement?: HTMLElement;
  private globeResizeObserver?: ResizeObserver;
  private globeResizeFrameId?: number;
  private popupTrackingFrameId?: number;
  private popupImageLoadId = 0;
  private popupImagePreloader?: HTMLImageElement;
  private globeOffsetY = 0;
  private focusTransitionStartTime?: number;
  private focusOffsetStartY = 0;
  private focusOffsetTargetY?: number;

  ngAfterViewInit(): void {
    this.initGlobe();
    this.loadWonders();
  }

  ngOnDestroy(): void {
    this.clearSelectedWonder();
    this.stopGlobeResizeTracking();
    this.removeMarkerListeners();
    this.globe?.htmlElementsData([]);
    this.globe = undefined;
    this.globeContainer.nativeElement.replaceChildren();
  }

  private initGlobe(): void {
    this.globe = new Globe(this.globeContainer.nativeElement)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .htmlElementsData([])
      .htmlLat('latNum')
      .htmlLng('lonNum')
      .htmlElement((d: object) => this.createMarkerElement(d as WonderMarker))
      .onGlobeReady(() => {
        this.ngZone.run(() => {
          this.isGlobeReady = true;
          this.updateLoadingState();
          this.scheduleGlobeResize();
        });
      })
      .pointOfView({ lat: 40, lng: 0, altitude: 1.5 }, 1000);

    this.startGlobeResizeTracking();
  }

  private startGlobeResizeTracking(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.globeResizeObserver = new ResizeObserver(() => this.resizeGlobe());
    this.globeResizeObserver.observe(this.globeContainer.nativeElement);
  }

  private scheduleGlobeResize(): void {
    if (this.globeResizeFrameId !== undefined) {
      cancelAnimationFrame(this.globeResizeFrameId);
    }

    this.globeResizeFrameId = requestAnimationFrame(() => {
      this.globeResizeFrameId = undefined;
      this.resizeGlobe();
    });
  }

  private resizeGlobe(): void {
    const { clientHeight, clientWidth } = this.globeContainer.nativeElement;

    if (!this.globe || clientWidth <= 0 || clientHeight <= 0) return;

    this.globe.width(clientWidth).height(clientHeight);
    this.centerPopupOnGlobe();
  }

  private stopGlobeResizeTracking(): void {
    this.globeResizeObserver?.disconnect();
    this.globeResizeObserver = undefined;

    if (this.globeResizeFrameId === undefined) return;

    cancelAnimationFrame(this.globeResizeFrameId);
    this.globeResizeFrameId = undefined;
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
              (wonder): WonderMarker => ({
                ...wonder,
                latNum: Number(wonder.lat),
                lonNum: Number(wonder.lon),
              }),
            )
            .filter((wonder) => !Number.isNaN(wonder.latNum) && !Number.isNaN(wonder.lonNum)),
        ),
        tap((validWonders) => {
          this.clearSelectedWonder();
          this.removeMarkerListeners();
          this.errorMessage = '';
          this.hasMarkers = validWonders.length > 0;
          this.areMarkersReady = false;
          this.expectedMarkerCount = validWonders.length;
          this.renderedMarkerCount = 0;
          this.renderedMarkers = new WeakSet<WonderMarker>();
          this.globe?.htmlElementsData(validWonders);

          if (validWonders.length === 0) {
            this.areMarkersReady = true;
            this.updateLoadingState();
          }
        }),
        catchError(() => {
          this.errorMessage = 'Unable to load globe markers.';
          this.hasMarkers = false;
          this.areMarkersReady = true;
          this.updateLoadingState();
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private createMarkerElement(wonder: WonderMarker): HTMLElement {
    const el = document.createElement('div');
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.cursor = 'pointer';
    el.style.transform = 'translate(-50%, -100%)';
    el.style.pointerEvents = 'auto';
    el.title = wonder.name;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Show details for ${wonder.name}`);

    el.appendChild(this.createPinSvg(this.getSafeHexColor(wonder.color)));

    const clickHandler: EventListener = (event) => {
      event.stopPropagation();
      this.selectWonder(wonder, el);
    };

    const keydownHandler: EventListener = (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;

      keyboardEvent.preventDefault();
      this.selectWonder(wonder, el);
    };

    el.addEventListener('click', clickHandler);
    el.addEventListener('keydown', keydownHandler);
    this.markerListeners.set(el, { click: clickHandler, keydown: keydownHandler });
    this.markMarkerRendered(wonder);

    return el;
  }

  private markMarkerRendered(wonder: WonderMarker): void {
    if (this.renderedMarkers.has(wonder)) return;

    this.renderedMarkers.add(wonder);
    this.renderedMarkerCount++;

    if (this.renderedMarkerCount < this.expectedMarkerCount) return;

    this.ngZone.run(() => {
      this.areMarkersReady = true;
      this.updateLoadingState();
    });
  }

  private updateLoadingState(): void {
    this.isLoading = !this.isGlobeReady || !this.areMarkersReady;
  }

  clearSelectedWonder(): void {
    this.stopPopupTracking();
    this.clearGlobeFocusTransition();
    this.resetPopupImage();
    this.selectedWonder = null;
    this.selectedMarkerElement = undefined;
    this.popupPosition = null;
  }

  private selectWonder(wonder: WonderMarker, markerElement: HTMLElement): void {
    this.startGlobeFocusTransition();
    this.selectedWonder = wonder;
    this.selectedMarkerElement = markerElement;
    this.loadPopupImage(wonder.imageURL);
    this.updatePopupPosition();
    this.startPopupTracking();

    this.globe?.pointOfView(
      {
        lat: wonder.latNum,
        lng: wonder.lonNum,
        altitude: 0.5,
      },
      this.prefersReducedMotion ? 0 : GLOBE_FOCUS_TRANSITION_MS,
    );
  }

  private loadPopupImage(imageUrl: string): void {
    this.popupImageLoadId++;
    const loadId = this.popupImageLoadId;

    this.popupImageSrc = imageUrl;
    this.isPopupImageLoading = Boolean(imageUrl);
    this.hasPopupImageError = !imageUrl;
    this.popupImagePreloader = undefined;

    if (!imageUrl) return;

    const image = new Image();
    this.popupImagePreloader = image;

    image.onload = () => {
      this.ngZone.run(() => {
        if (loadId !== this.popupImageLoadId) return;

        this.isPopupImageLoading = false;
        this.hasPopupImageError = false;
      });
    };

    image.onerror = () => {
      this.ngZone.run(() => {
        if (loadId !== this.popupImageLoadId) return;

        this.isPopupImageLoading = false;
        this.hasPopupImageError = true;
      });
    };

    image.src = imageUrl;
  }

  private resetPopupImage(): void {
    this.popupImageLoadId++;
    this.popupImagePreloader = undefined;
    this.popupImageSrc = '';
    this.isPopupImageLoading = false;
    this.hasPopupImageError = false;
  }

  private startPopupTracking(): void {
    this.stopPopupTracking();

    const trackPopupPosition = (timestamp: number) => {
      if (!this.selectedMarkerElement) {
        this.popupTrackingFrameId = undefined;
        return;
      }

      this.updatePopupPosition();
      this.centerPopupOnGlobe(timestamp);
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
    if (!this.selectedMarkerElement) {
      this.popupPosition = null;
      return;
    }

    const globeRect = this.globeContainer.nativeElement.getBoundingClientRect();
    const markerRect = this.selectedMarkerElement.getBoundingClientRect();

    this.popupPosition = {
      left: markerRect.left - globeRect.left + markerRect.width / 2,
      top: markerRect.top - globeRect.top,
    };
  }

  private centerPopupOnGlobe(timestamp = performance.now()): void {
    if (!this.globe || !this.selectedMarkerElement) return;

    const popupElement =
      this.globeContainer.nativeElement.parentElement?.querySelector<HTMLElement>('.popup-card');

    if (!popupElement) return;

    const globeRect = this.globeContainer.nativeElement.getBoundingClientRect();
    const popupHeight = popupElement.getBoundingClientRect().height;
    const markerRect = this.selectedMarkerElement.getBoundingClientRect();
    const globeHeight = this.globeContainer.nativeElement.clientHeight || globeRect.height;

    if (popupHeight <= 0 || globeHeight <= 0) return;

    const markerScreenPosition = this.selectedWonder
      ? this.globe.getScreenCoords(this.selectedWonder.latNum, this.selectedWonder.lonNum, 0)
      : null;
    const markerTop = markerRect.top - globeRect.top;
    const markerAnchorInset =
      markerScreenPosition && Number.isFinite(markerScreenPosition.y)
        ? Math.max(0, markerScreenPosition.y - markerTop)
        : markerRect.height;
    const desiredOffset = markerAnchorInset + POPUP_MARKER_GAP_PX + popupHeight / 2;
    const maximumOffset = Math.max(0, globeHeight / 2 - markerAnchorInset);

    this.setGlobeOffset(Math.min(desiredOffset, maximumOffset), timestamp);
  }

  private setGlobeOffset(targetOffsetY: number, timestamp: number): void {
    if (!this.globe) return;

    if (this.prefersReducedMotion) {
      this.applyGlobeOffset(targetOffsetY);
      return;
    }

    if (this.focusTransitionStartTime !== undefined) {
      this.focusOffsetTargetY ??= targetOffsetY;

      const progress = Math.min(
        1,
        Math.max(0, (timestamp - this.focusTransitionStartTime) / GLOBE_FOCUS_TRANSITION_MS),
      );
      const easedProgress =
        progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const synchronizedOffset =
        this.focusOffsetStartY + (this.focusOffsetTargetY - this.focusOffsetStartY) * easedProgress;

      this.applyGlobeOffset(synchronizedOffset);

      if (progress >= 1) {
        this.clearGlobeFocusTransition();
      }

      return;
    }

    const offsetDifference = targetOffsetY - this.globeOffsetY;

    if (Math.abs(offsetDifference) < GLOBE_OFFSET_SETTLE_DISTANCE_PX) return;

    const easedOffset = this.globeOffsetY + offsetDifference * GLOBE_OFFSET_SMOOTHING;
    const nextOffset =
      Math.abs(targetOffsetY - easedOffset) < GLOBE_OFFSET_SETTLE_DISTANCE_PX
        ? targetOffsetY
        : easedOffset;

    this.applyGlobeOffset(nextOffset);
  }

  private startGlobeFocusTransition(): void {
    this.focusOffsetStartY = this.globeOffsetY;
    this.focusOffsetTargetY = undefined;
    this.focusTransitionStartTime = this.prefersReducedMotion ? undefined : performance.now();
  }

  private clearGlobeFocusTransition(): void {
    this.focusTransitionStartTime = undefined;
    this.focusOffsetTargetY = undefined;
  }

  private applyGlobeOffset(offsetY: number): void {
    if (!this.globe || Math.abs(this.globeOffsetY - offsetY) < 0.01) return;

    this.globeOffsetY = offsetY;
    this.globe.globeOffset([0, offsetY]);
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

  private getSafeHexColor(color?: string): string {
    return color && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color)
      ? color
      : getCssColor(COLOR_VARS.pinFallback);
  }

  private removeMarkerListeners(): void {
    this.markerListeners.forEach((listeners, element) => {
      element.removeEventListener('click', listeners.click);
      element.removeEventListener('keydown', listeners.keydown);
    });
    this.markerListeners.clear();
  }
}
