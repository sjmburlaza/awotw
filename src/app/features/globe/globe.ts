import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import Globe, { GlobeInstance } from 'globe.gl';
import { catchError, EMPTY, map, take, tap } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { LoaderComponent } from 'src/app/shared/components/loader/loader';

interface WonderMarker extends Item {
  latNum: number;
  lonNum: number;
}

interface PopupPosition {
  left: number;
  top: number;
}

@Component({
  selector: 'app-globe',
  imports: [RouterModule, LoaderComponent],
  templateUrl: './globe.html',
  styleUrl: './globe.scss',
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);

  @ViewChild('globeContainer', { static: true })
  globeContainer!: ElementRef<HTMLDivElement>;

  private globe?: GlobeInstance;
  private readonly markerListeners = new Map<
    HTMLElement,
    { click: EventListener; keydown: EventListener }
  >();
  isLoading = true;
  errorMessage = '';
  hasMarkers = true;

  selectedWonder: WonderMarker | null = null;
  popupPosition: PopupPosition | null = null;

  private selectedMarkerElement?: HTMLElement;
  private popupTrackingFrameId?: number;

  ngAfterViewInit(): void {
    this.initGlobe();
    this.loadWonders();
  }

  ngOnDestroy(): void {
    this.clearSelectedWonder();
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
      .onGlobeReady(() => (this.isLoading = false))
      .pointOfView({ lat: 40, lng: 0, altitude: 1.5 }, 1000);
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
          this.globe?.htmlElementsData(validWonders);
        }),
        catchError(() => {
          this.errorMessage = 'Unable to load globe markers.';
          this.hasMarkers = false;
          this.isLoading = false;
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

    return el;
  }

  clearSelectedWonder(): void {
    this.stopPopupTracking();
    this.selectedWonder = null;
    this.selectedMarkerElement = undefined;
    this.popupPosition = null;
  }

  private selectWonder(wonder: WonderMarker, markerElement: HTMLElement): void {
    this.selectedWonder = wonder;
    this.selectedMarkerElement = markerElement;
    this.updatePopupPosition();
    this.startPopupTracking();

    this.globe?.pointOfView(
      {
        lat: wonder.latNum,
        lng: wonder.lonNum,
        altitude: 0.5,
      },
      1200,
    );
  }

  private startPopupTracking(): void {
    this.stopPopupTracking();

    const trackPopupPosition = () => {
      if (!this.selectedMarkerElement) {
        this.popupTrackingFrameId = undefined;
        return;
      }

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
    return color && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color) ? color : '#ff5722';
  }

  private removeMarkerListeners(): void {
    this.markerListeners.forEach((listeners, element) => {
      element.removeEventListener('click', listeners.click);
      element.removeEventListener('keydown', listeners.keydown);
    });
    this.markerListeners.clear();
  }
}
