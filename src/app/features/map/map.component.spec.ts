import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Item } from 'src/app/services/data.service';

import { MapComponent } from './map.component';

interface MapComponentInternals {
  createWonderPopup(wonder: Item): HTMLElement;
}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  const wonder: Item = {
    id: 1,
    name: 'Step Pyramid of Djoser',
    yearBuilt: '2630 BCE',
    style: 'Ancient Egyptian',
    buildingType: 'Pyramid',
    location: 'Saqqara, Egypt',
    continent: 'Africa',
    descriptionURL: 'https://example.com/djoser',
    imageURL: 'https://example.com/djoser.jpg',
    codename: 'step-pyramid-of-djoser',
    color: '#d97706',
    lat: '29.8712',
    lon: '31.2165',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('creates globe-style popup content for a wonder marker', () => {
    const popup = (component as unknown as MapComponentInternals).createWonderPopup(wonder);

    expect(popup.className).toBe('map-popup');
    expect(popup.querySelector('.map-popup__title')?.textContent).toBe(wonder.name);
    expect(popup.querySelector('.map-popup__location')?.textContent).toBe(wonder.location);

    const image = popup.querySelector('.map-popup__image') as HTMLImageElement;
    expect(image.src).toBe(wonder.imageURL);
    expect(image.alt).toBe(wonder.name);

    const link = popup.querySelector('.map-popup__link') as HTMLAnchorElement;
    expect(link.href).toBe(wonder.descriptionURL);
    expect(link.textContent).toBe('Learn more');
  });

  it('shows the image unavailable fallback if the popup image fails', () => {
    const popup = (component as unknown as MapComponentInternals).createWonderPopup(wonder);
    const image = popup.querySelector('.map-popup__image') as HTMLImageElement;

    image.dispatchEvent(new Event('error'));

    expect(popup.querySelector('.map-popup__image')).toBeNull();
    expect(popup.querySelector('.map-popup__image-error')?.textContent).toBe('Image unavailable');
  });
});
