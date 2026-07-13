import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { DataService, Item } from 'src/app/services/data.service';
import { InfoTooltipComponent } from 'src/app/shared/components/info-tooltip/info-tooltip.component';

interface MappableWonder extends Item {
  lat: string;
  lon: string;
}

interface RoundScore {
  distanceKm: number;
  elapsedSeconds: number;
  distanceScore: number;
  timeBonus: number;
  total: number;
}

@Component({
  selector: 'app-geoguesser',
  imports: [InfoTooltipComponent],
  templateUrl: './geoguesser.component.html',
  styleUrl: './geoguesser.component.scss',
})
export class GeoguesserComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly worldBounds: L.LatLngBoundsExpression = [
    [-90, -180],
    [90, 180],
  ];
  private readonly mapCenter: L.LatLngExpression = [20, 0];
  private readonly mapZoom = 2;
  private readonly maxDistanceScore = 1000;
  private readonly maxTimeBonus = 200;
  private readonly timePenaltyPerSecond = 4;
  private readonly distanceDecayKm = 1800;

  private map?: L.Map;
  private cursorPreviewMarker?: L.Marker;
  private guessMarker?: L.Marker;
  private actualMarker?: L.Marker;
  private resultLine?: L.Polyline;
  private timerId?: ReturnType<typeof window.setInterval>;
  private roundStartedAt = 0;

  wonders: MappableWonder[] = [];
  currentWonder?: MappableWonder;
  selectedLatLng?: L.LatLng;
  loading = true;
  errorMessage = '';
  hasSubmitted = false;
  elapsedSeconds = 0;
  roundNumber = 0;
  totalScore = 0;
  result?: RoundScore;

  get hasGuess(): boolean {
    return !!this.selectedLatLng;
  }

  get maxRoundScore(): number {
    return this.maxDistanceScore + this.maxTimeBonus;
  }

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wonders) => {
          this.wonders = wonders.filter((wonder): wonder is MappableWonder =>
            this.hasUsableCoordinates(wonder),
          );
          this.errorMessage = this.wonders.length ? '' : 'No location data available.';
          this.loading = false;
          this.startRoundWhenReady();
        },
        error: () => {
          this.wonders = [];
          this.errorMessage = 'Unable to load GeoGuesser data.';
          this.loading = false;
        },
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
    queueMicrotask(() => this.startRoundWhenReady());
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.clearRoundLayers();
    this.map?.off('click', this.onMapClick);
    this.map?.off('mousemove', this.onMapMouseMove);
    this.map?.remove();
    this.map = undefined;
  }

  submitGuess(): void {
    if (!this.currentWonder || !this.selectedLatLng || this.hasSubmitted) return;

    this.stopTimer();

    const actualLatLng = L.latLng(+this.currentWonder.lat, +this.currentWonder.lon);
    const roundScore = this.calculateRoundScore(
      this.calculateDistanceKm(
        this.selectedLatLng.lat,
        this.selectedLatLng.lng,
        actualLatLng.lat,
        actualLatLng.lng,
      ),
      this.elapsedSeconds,
    );

    this.result = roundScore;
    this.totalScore += roundScore.total;
    this.hasSubmitted = true;
    this.guessMarker?.dragging?.disable();
    this.revealActualLocation(actualLatLng);
  }

  nextRound(): void {
    if (!this.wonders.length) return;

    this.startNewRound();
  }

  calculateDistanceKm(startLat: number, startLon: number, endLat: number, endLon: number): number {
    const earthRadiusKm = 6371;
    const latDelta = this.toRadians(endLat - startLat);
    const lonDelta = this.toRadians(endLon - startLon);
    const startLatRad = this.toRadians(startLat);
    const endLatRad = this.toRadians(endLat);
    const haversine =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(startLatRad) * Math.cos(endLatRad) * Math.sin(lonDelta / 2) ** 2;

    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  calculateRoundScore(distanceKm: number, elapsedSeconds: number): RoundScore {
    const safeDistance = Math.max(0, distanceKm);
    const safeSeconds = Math.max(0, Math.floor(elapsedSeconds));
    const distanceScore = Math.round(
      this.maxDistanceScore * Math.exp(-safeDistance / this.distanceDecayKm),
    );
    const timeBonus = Math.max(0, this.maxTimeBonus - safeSeconds * this.timePenaltyPerSecond);
    const total = distanceScore + timeBonus;

    return {
      distanceKm: safeDistance,
      elapsedSeconds: safeSeconds,
      distanceScore,
      timeBonus,
      total,
    };
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
    if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;

    return `${Math.round(distanceKm).toLocaleString()} km`;
  }

  formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private initMap(): void {
    this.map = L.map('geoguesser-map').setView(this.mapCenter, this.mapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      noWrap: true,
      bounds: this.worldBounds,
    }).addTo(this.map);

    this.map.setMaxBounds(this.worldBounds);
    this.map.on('click', this.onMapClick);
    this.map.on('mousemove', this.onMapMouseMove);
  }

  private readonly onMapClick = (event: L.LeafletMouseEvent): void => {
    if (this.hasSubmitted || !this.currentWonder) return;

    this.placeGuessPin(event.latlng);
  };

  private readonly onMapMouseMove = (event: L.LeafletMouseEvent): void => {
    if (this.hasSubmitted || this.guessMarker || !this.currentWonder) return;

    this.showCursorPreview(event.latlng);
  };

  private startRoundWhenReady(): void {
    if (!this.map || this.loading || this.errorMessage || this.currentWonder) return;

    this.startNewRound();
  }

  private startNewRound(): void {
    this.stopTimer();
    this.clearRoundLayers();
    this.currentWonder = this.pickWonder();
    this.selectedLatLng = undefined;
    this.hasSubmitted = false;
    this.result = undefined;
    this.elapsedSeconds = 0;
    this.roundNumber++;
    this.map?.setView(this.mapCenter, this.mapZoom);
    this.showCursorPreview(this.map?.getCenter());
    this.startTimer();
  }

  private pickWonder(): MappableWonder {
    if (this.wonders.length === 1) return this.wonders[0];

    let nextWonder = this.wonders[Math.floor(Math.random() * this.wonders.length)];

    while (nextWonder.id === this.currentWonder?.id) {
      nextWonder = this.wonders[Math.floor(Math.random() * this.wonders.length)];
    }

    return nextWonder;
  }

  private placeGuessPin(latLng: L.LatLng): void {
    this.removeCursorPreviewMarker();
    this.selectedLatLng = L.latLng(
      this.clamp(latLng.lat, -90, 90),
      this.clamp(latLng.lng, -180, 180),
    );

    if (this.guessMarker) {
      this.guessMarker.setLatLng(this.selectedLatLng);
      return;
    }

    this.guessMarker = L.marker(this.selectedLatLng, {
      icon: this.createPinIcon('#2563eb', 'Your guess'),
      draggable: true,
      keyboard: true,
      title: 'Your guess',
      alt: 'Your guess',
    }).addTo(this.map as L.Map);

    this.guessMarker.on('dragend', () => {
      if (!this.guessMarker || this.hasSubmitted) return;

      const nextLatLng = this.guessMarker.getLatLng();
      this.selectedLatLng = L.latLng(
        this.clamp(nextLatLng.lat, -90, 90),
        this.clamp(nextLatLng.lng, -180, 180),
      );
      this.guessMarker.setLatLng(this.selectedLatLng);
    });
  }

  private showCursorPreview(latLng?: L.LatLng): void {
    const map = this.map;

    if (!map || !latLng || this.guessMarker || this.hasSubmitted) return;

    if (this.cursorPreviewMarker) {
      this.cursorPreviewMarker.setLatLng(latLng);
      return;
    }

    this.cursorPreviewMarker = L.marker(latLng, {
      icon: this.createPinIcon('#2563eb', 'Pin placement preview', true),
      interactive: false,
      keyboard: false,
      opacity: 0.72,
      zIndexOffset: 1000,
    }).addTo(map);
    this.cursorPreviewMarker.getElement()?.style.setProperty('pointer-events', 'none');
  }

  private revealActualLocation(actualLatLng: L.LatLng): void {
    const map = this.map;

    if (!map || !this.currentWonder || !this.selectedLatLng) return;

    this.actualMarker = L.marker(actualLatLng, {
      icon: this.createPinIcon(
        this.getSafeHexColor(this.currentWonder.color),
        this.currentWonder.name,
      ),
      keyboard: true,
      title: this.currentWonder.name,
      alt: this.currentWonder.name,
    }).addTo(map);

    this.actualMarker.bindPopup(this.createActualLocationPopup(this.currentWonder));
    this.resultLine = L.polyline([this.selectedLatLng, actualLatLng], {
      color: '#2563eb',
      weight: 2,
      dashArray: '6 6',
    }).addTo(map);

    if ((this.result?.distanceKm ?? 0) < 0.1) {
      map.setView(actualLatLng, 12);
      return;
    }

    map.fitBounds(L.latLngBounds([this.selectedLatLng, actualLatLng]).pad(0.3), {
      maxZoom: 8,
      animate: true,
    });
  }

  private createActualLocationPopup(wonder: MappableWonder): HTMLElement {
    const popup = document.createElement('div');
    popup.className = 'map-popup';

    const name = document.createElement('strong');
    name.textContent = wonder.name;

    const location = document.createElement('em');
    location.textContent = wonder.location;

    popup.appendChild(name);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(location);

    return popup;
  }

  private createPinIcon(color: string, label: string, isDecorative = false): L.DivIcon {
    const icon = document.createElement('div');
    icon.className = 'geoguesser-marker';
    if (isDecorative) {
      icon.setAttribute('aria-hidden', 'true');
    } else {
      icon.ariaLabel = label;
    }
    Object.assign(icon.style, {
      alignItems: 'center',
      display: 'flex',
      filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35))',
      justifyContent: 'center',
    });
    icon.appendChild(this.createPinSvg(color));

    return L.divIcon({
      className: '',
      html: icon,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34],
    });
  }

  private removeCursorPreviewMarker(): void {
    this.cursorPreviewMarker?.remove();
    this.cursorPreviewMarker = undefined;
  }

  private createPinSvg(color: string): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '34');
    svg.setAttribute('height', '34');
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

  private clearRoundLayers(): void {
    this.removeCursorPreviewMarker();
    this.guessMarker?.remove();
    this.actualMarker?.remove();
    this.resultLine?.remove();
    this.guessMarker = undefined;
    this.actualMarker = undefined;
    this.resultLine = undefined;
  }

  private startTimer(): void {
    this.roundStartedAt = Date.now();
    this.timerId = window.setInterval(() => this.updateElapsedTime(), 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }

    this.updateElapsedTime();
  }

  private updateElapsedTime(): void {
    if (!this.roundStartedAt) return;

    this.elapsedSeconds = Math.floor((Date.now() - this.roundStartedAt) / 1000);
  }

  private hasUsableCoordinates(wonder: Item): wonder is MappableWonder {
    if (!wonder.lat?.trim() || !wonder.lon?.trim()) return false;

    const lat = Number(wonder.lat);
    const lon = Number(wonder.lon);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  }

  private getSafeHexColor(color?: string | null): string {
    return color && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color) ? color : '#ff5722';
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
