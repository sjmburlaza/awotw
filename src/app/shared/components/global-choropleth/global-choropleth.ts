import { AfterViewInit, Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { take } from 'rxjs';
import { GeoService } from 'src/app/services/geo.service';

@Component({
  selector: 'app-global-choropleth',
  imports: [],
  templateUrl: './global-choropleth.html',
  styleUrl: './global-choropleth.scss',
})
export class GlobalChoroplethComponent implements AfterViewInit, OnChanges {
  @Input() countryValues: Record<string, number> = {};

  private readonly geoService = inject(GeoService);

  private map!: L.Map;
  private countriesLayer?: L.GeoJSON;

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
    this.geoService
      .getCountries()
      .pipe(take(1))
      .subscribe({
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
      layer.bindPopup(
        `
        <strong>${countryName}</strong><br />
        Count: ${value}
        `,
        {
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
        },
      );

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
        (this.countriesLayer as L.GeoJSON).resetStyle(layer);
        layer.closePopup();
      });
    } else {
      layer.unbindPopup();
      layer.closePopup();
    }
  }

  private getFeatureName(feature: any): string {
    return (
      (feature as GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>).properties?.name ??
      'Unknown'
    );
  }

  private updateMapStyles(): void {
    if (!this.countriesLayer) return;

    this.countriesLayer.eachLayer((layer) => {
      const feature = (layer as L.GeoJSON<any>).feature;
      if (!feature) return;

      (layer as L.Path).setStyle(this.countryStyle(feature));

      this.bindCountryLayerEvents(feature, layer);
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
