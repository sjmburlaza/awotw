import { AfterViewInit, Component, DestroyRef, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { DataService, Item } from 'src/app/services/data.service';
import { COLOR_VARS, getCssColor } from 'src/app/shared/theme-colors';

@Component({
  selector: 'app-map',
  imports: [RouterModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  errorMessage = '';
  hasMarkers = true;

  ngAfterViewInit(): void {
    this.initMap();
    this.loadWonders();
  }

  ngOnDestroy(): void {
    this.markersLayer?.clearLayers();
    this.map?.off();
    this.map?.remove();
    this.markersLayer = undefined;
    this.map = undefined;
  }

  private initMap(): void {
    this.map = L.map('map').setView([47.7017066, 10.8602689], 5);
    this.markersLayer = L.layerGroup().addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      noWrap: true,
      bounds: [
        [-90, -180],
        [90, 180],
      ],
    }).addTo(this.map);

    this.map.setMaxBounds([
      [-90, -180],
      [90, 180],
    ]);
  }

  private loadWonders(): void {
    this.dataService
      .getWonders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wonders: Item[]) => {
          const markersLayer = this.markersLayer;
          if (!markersLayer) return;

          let markerCount = 0;
          markersLayer.clearLayers();

          wonders.forEach((wonder) => {
            if (!wonder.lat || !wonder.lon) return;

            const marker = L.marker([+wonder.lat, +wonder.lon], {
              icon: this.createColoredIcon(wonder.color),
              keyboard: true,
              title: wonder.name,
              alt: wonder.name,
            }).addTo(markersLayer);

            marker.bindPopup(this.createWonderPopup(wonder), {
              className: 'map-wonder-popup',
              maxWidth: 272,
              minWidth: 272,
            });
            markerCount++;
          });

          this.errorMessage = '';
          this.hasMarkers = markerCount > 0;
        },
        error: () => {
          this.errorMessage = 'Unable to load map markers.';
          this.hasMarkers = false;
        },
      });
  }

  private createColoredIcon(color?: string | null): L.DivIcon {
    const icon = document.createElement('div');
    icon.className = 'custom-marker';
    icon.appendChild(this.createPinSvg(this.getSafeHexColor(color)));

    return L.divIcon({
      className: '',
      html: icon,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  }

  private createWonderPopup(wonder: Item): HTMLElement {
    const popup = document.createElement('div');
    popup.className = 'map-popup';

    const name = document.createElement('strong');
    name.className = 'map-popup__title';
    name.textContent = wonder.name;

    const location = document.createElement('em');
    location.className = 'map-popup__location';
    location.textContent = wonder.location;

    popup.appendChild(name);
    popup.appendChild(location);

    const imageFrame = document.createElement('div');
    imageFrame.className = 'map-popup__image-frame';

    const imageUrl = this.getSafeUrl(wonder.imageURL);
    if (imageUrl) {
      const image = document.createElement('img');
      image.className = 'map-popup__image';
      image.src = imageUrl;
      image.alt = wonder.name;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        image.remove();
        imageFrame.appendChild(this.createImageError());
      });
      imageFrame.appendChild(image);
    } else {
      imageFrame.appendChild(this.createImageError());
    }
    popup.appendChild(imageFrame);

    const descriptionUrl = this.getSafeUrl(wonder.descriptionURL);
    if (descriptionUrl) {
      const link = document.createElement('a');
      link.className = 'map-popup__link';
      link.href = descriptionUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.ariaLabel = `Open reference page for ${wonder.name}`;
      link.textContent = 'Learn more';
      popup.appendChild(link);
    }

    return popup;
  }

  private createImageError(): HTMLDivElement {
    const imageError = document.createElement('div');
    imageError.className = 'map-popup__image-error';
    imageError.textContent = 'Image unavailable';
    return imageError;
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

  private getSafeHexColor(color?: string | null): string {
    return color && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color)
      ? color
      : getCssColor(COLOR_VARS.pinFallback);
  }

  private getSafeUrl(url?: string | null): string | null {
    if (!url) return null;

    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
    } catch {
      return null;
    }
  }
}
