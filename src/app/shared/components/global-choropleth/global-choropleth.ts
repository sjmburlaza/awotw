import { AfterViewInit, Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { take } from 'rxjs';
import { GeoService } from 'src/app/services/geo.service';

@Component({
  selector: 'app-global-choropleth',
  imports: [],
  templateUrl: './global-choropleth.html',
  styleUrl: './global-choropleth.scss'
})
export class GlobalChoroplethComponent implements AfterViewInit, OnChanges {
  @Input() countryValues: Record<string, number> = {};

  private readonly geoService = inject(GeoService);

  private map!: L.Map;
  private countriesLayer?: L.GeoJSON;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['countryValues'] && this.countriesLayer) {
      this.updateMapStyles();
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadCountries();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 0);
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
    this.geoService.getCountries().pipe(take(1)).subscribe({
      next: (geoJson) => {
        this.countriesLayer = L.geoJSON(geoJson as GeoJSON.FeatureCollection, {
          style: (feature) => this.countryStyle(feature),
          onEachFeature: (feature, layer) => {
            this.bindCountryLayerEvents(feature, layer);
          },
        }).addTo(this.map);
      },
      error: (error) => {
        console.error('Failed to load countries GeoJSON:', error);
      },
    });
  }

  private bindCountryLayerEvents(feature: any, layer: L.Layer): void {
    const countryName = this.getFeatureName(feature);
    const value = this.countryValues[countryName] ?? 0;

    if (value > 0) {
      layer.bindPopup(`
        <strong>${countryName}</strong><br />
        Count: ${value}
      `);

      layer.on('mouseover', () => {
        (layer as L.Path).setStyle({
          weight: 2,
          color: '#111827',
          fillOpacity: 0.9,
        });
      });

      layer.on('mouseout', () => {
        (layer as L.Path).setStyle(this.countryStyle(feature));
      });
    } else {
      layer.unbindPopup();
      layer.closePopup();
    }
  }

  private getFeatureName(feature: any): string {
    return (feature as GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>).properties?.name ?? 'Unknown';
  }

  private updateMapStyles(): void {
    if (!this.countriesLayer) return;

    this.countriesLayer.eachLayer((layer) => {
      const feature = (layer as L.GeoJSON<any>).feature;
      if (!feature) return;

      const countryName = this.getFeatureName(feature);
      const value = this.countryValues[countryName] ?? 0;

      (layer as L.Path).setStyle(this.countryStyle(feature));

      if (value > 0) {
        layer.bindPopup(`
          <strong>${countryName}</strong><br />
          Count: ${value}
        `);
      } else {
        layer.unbindPopup();
        layer.closePopup();
      }
    });
  }

  private countryStyle(feature: any): L.PathOptions {
    const countryName = this.getFeatureName(feature);
    const value = this.countryValues[countryName] ?? 0;
    const values = Object.values(this.countryValues);
    const max = values.length ? Math.max(...values) : 0;

    return {
      fillColor: this.getColor(value, max),
      weight: 1,
      opacity: 1,
      color: '#ffffff',
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
