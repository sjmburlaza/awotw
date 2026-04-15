import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private readonly http = inject(HttpClient);
  private url = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

  getCountries() {
    return this.http.get(this.url);
  }
}
