import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Group {
  groupName: string;
  items: Item[];
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
  lat: string;
  lon: string;
}


@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  getData(): Observable<Item[]> {
    return this.http.get<Item[]>('assets/json/wonders.json');
  }
}
