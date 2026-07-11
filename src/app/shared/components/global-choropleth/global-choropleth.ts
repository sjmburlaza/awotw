import {
  AfterViewInit,
  Component,
  DestroyRef,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { GeoService } from 'src/app/services/geo.service';
import { getThemeColors } from '../../theme-colors';

interface CountryProperties {
  name?: string;
}

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, CountryProperties>;
type CountryFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, CountryProperties>;
type CountryLayer = L.Layer & { feature?: CountryFeature };

@Component({
  selector: 'app-global-choropleth',
  imports: [],
  templateUrl: './global-choropleth.html',
  styleUrl: './global-choropleth.scss',
})
export class GlobalChoroplethComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() countryValues: Record<string, number> = {};

  private readonly geoService = inject(GeoService);
  private readonly destroyRef = inject(DestroyRef);

  private map?: L.Map;
  private countriesLayer?: L.GeoJSON<CountryProperties>;
  private resizeTimer?: ReturnType<typeof setTimeout>;
  errorMessage = '';

  legend = [
    { label: '0%', color: '#f3f4f6' },
    { label: '1-20%', color: '#fda4af' },
    { label: '21-40%', color: '#fb7185' },
    { label: '41-60%', color: '#fc466b' },
    { label: '61-80%', color: '#be123c' },
    { label: '81-100%', color: '#881337' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['countryValues'] && this.countriesLayer) {
      this.updateMapStyles();
    }
  }

  @HostListener('window:awotw-theme-change')
  onThemeChange(): void {
    this.updateMapStyles();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadCountries();

    this.resizeTimer = setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.countriesLayer?.off();
    this.countriesLayer?.remove();
    this.map?.off();
    this.map?.remove();
    this.countriesLayer = undefined;
    this.map = undefined;
  }

  private initMap(): void {
    this.map = L.map('world-map', {
      center: [20, 0],
      zoom: 2,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private loadCountries(): void {
    this.geoService
      .getCountries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (geoJson) => {
          if (!this.map) return;

          this.errorMessage = '';
          this.countriesLayer = L.geoJSON<CountryProperties>(geoJson as CountryFeatureCollection, {
            style: (feature) => this.countryStyle(feature),
            onEachFeature: (feature, layer) => {
              this.bindCountryLayerEvents(feature, layer);
            },
          }).addTo(this.map);
        },
        error: () => {
          this.errorMessage = 'Unable to load country map data.';
        },
      });
  }

  private bindCountryLayerEvents(feature: CountryFeature | undefined, layer: L.Layer): void {
    const countryName = this.getFeatureName(feature);
    const value = this.countryValues[countryName] ?? 0;

    layer.off('mouseover');
    layer.off('mouseout');
    layer.unbindPopup();
    layer.closePopup();

    if (value > 0) {
      layer.bindPopup(this.createCountryPopup(countryName, value), {
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
      });

      layer.on('mouseover', (e: L.LeafletMouseEvent) => {
        const path = layer as L.Path;

        path.setStyle({
          fillOpacity: 1,
        });

        if (countryName === 'Russia') {
          layer.openPopup(e.latlng);
        } else {
          const center = (layer as L.Polygon).getBounds().getCenter();
          layer.openPopup(center);
        }
      });

      layer.on('mouseout', () => {
        this.countriesLayer?.resetStyle(layer);
        layer.closePopup();
      });
    }
  }

  private getFeatureName(feature: CountryFeature | undefined): string {
    return feature?.properties?.name ?? 'Unknown';
  }

  private createCountryPopup(countryName: string, value: number): HTMLElement {
    const popup = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = countryName;

    popup.appendChild(name);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(document.createTextNode(`Count: ${value}`));

    return popup;
  }

  private updateMapStyles(): void {
    if (!this.countriesLayer) return;

    this.countriesLayer.eachLayer((layer) => {
      const feature = (layer as CountryLayer).feature;
      if (!feature) return;

      (layer as L.Path).setStyle(this.countryStyle(feature));

      this.bindCountryLayerEvents(feature, layer);
    });
  }

  private countryStyle(feature: CountryFeature | undefined): L.PathOptions {
    const countryName = this.getFeatureName(feature);
    const value = this.countryValues[countryName] ?? 0;
    const values = Object.values(this.countryValues);
    const max = values.length ? Math.max(...values) : 0;
    const theme = getThemeColors();

    return {
      fillColor: this.getColor(value, max),
      weight: 1,
      opacity: 1,
      color: theme.mapStroke,
      fillOpacity: 0.75,
    };
  }

  private getColor(value: number, max: number): string {
    if (max === 0) return '#f3f4f6';

    const ratio = value / max;

    if (ratio > 0.8) return '#881337';
    if (ratio > 0.6) return '#be123c';
    if (ratio > 0.4) return '#fc466b';
    if (ratio > 0.2) return '#fb7185';
    if (ratio > 0) return '#fda4af';
    return '#f3f4f6';
  }
}
