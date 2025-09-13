import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Group {
  groupName: string;
  items: Item[];
  description?: string;
}

export interface Item {
  id: number;
  name: string;
  yearBuilt: string;
  style: string;
  buildingType: string;
  location: string;
  continent: string;
  descriptionURL: string;
  imageURL: string;
  codename: string;
  color: string;
  lat?: string;
  lon?: string;
  wiki?: {
    title?: string;
    description?: string;
    extract?: string;
    wikipedia?: string;
  };
}

export type TallestBuilding = {
  type: 'building';
  name: string;
  city: string;
  country: string;
  height_m: string;
  year_completed: string;
  description: string;
  color: string;
  image_url: string;
};

export type MostVisited = {
  type: 'visited';
  name: string;
  location: string;
  visitors_per_year: string;
  year: string;
  color: string;
  image_url: string;
};

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  getWonders(): Observable<Item[]> {
    return this.http.get<Item[]>('assets/json/wonders.json');
  }

  getTallestBuildings(): Observable<TallestBuilding[]> {
    return this.http.get<TallestBuilding[]>('assets/json/tallestBuildings.json');
  }

  getMostVisited(): Observable<MostVisited[]> {
    return this.http.get<MostVisited[]>('assets/json/mostVisited.json');
  }
}
