import { AfterViewInit, Component, inject } from '@angular/core';
import * as L from 'leaflet';
import { DataService, Item } from '../services/data.service';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class Map implements AfterViewInit {
  private dataService = inject(DataService);

  private map!: L.Map;

  ngAfterViewInit(): void {
    this.initMap();
    this.loadWonders();
  }

  private initMap(): void {
    this.map = L.map('map').setView([47.7017066, 10.8602689], 5);

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
    this.dataService.getWonders().subscribe((wonders: Item[]) => {
      wonders.forEach((wonder) => {
        if (!wonder.lat || !wonder.lon) return;

        const marker = L.marker([+wonder.lat, +wonder.lon], {
          icon: this.createColoredIcon(wonder.color),
        }).addTo(this.map);

        marker.bindPopup(`
          <strong>${wonder.name}</strong><br>
          <em>${wonder.location}</em><br>
          <img src="${wonder.imageURL}" width="150" /><br>
          <a href="${wonder.descriptionURL}" target="_blank">Learn more</a>
        `);
      });
    });
  }

  private createColoredIcon(color: string): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="${color}" viewBox="0 0 24 24">
          <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5
                  c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5
                  2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  }
}
