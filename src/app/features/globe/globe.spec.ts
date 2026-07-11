import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';

import { GlobeComponent } from './globe';

interface TestWonderMarker extends Item {
  latNum: number;
  lonNum: number;
}

interface GlobeComponentInternals {
  selectWonder(wonder: TestWonderMarker, markerElement: HTMLElement): void;
}

describe('Globe', () => {
  let component: GlobeComponent;
  let fixture: ComponentFixture<GlobeComponent>;
  let dataServiceMock: Pick<DataService, 'getWonders'>;
  let preloadImages: HTMLImageElement[];

  const wonder: TestWonderMarker = {
    id: 1,
    name: 'Taj Mahal',
    yearBuilt: '1648',
    style: 'Mughal',
    buildingType: 'Mausoleum',
    location: 'Agra, India',
    continent: 'Asia',
    descriptionURL: 'https://example.com/taj-mahal',
    imageURL: 'https://example.com/taj-mahal.jpg',
    codename: 'taj-mahal',
    color: '#ffffff',
    lat: '27.1751',
    lon: '78.0421',
    latNum: 27.1751,
    lonNum: 78.0421,
  };

  const secondWonder: TestWonderMarker = {
    ...wonder,
    id: 2,
    name: 'Colosseum',
    location: 'Rome, Italy',
    descriptionURL: 'https://example.com/colosseum',
    imageURL: 'https://example.com/colosseum.jpg',
    codename: 'colosseum',
    lat: '41.8902',
    lon: '12.4922',
    latNum: 41.8902,
    lonNum: 12.4922,
  };

  beforeEach(async () => {
    dataServiceMock = {
      getWonders: jest.fn(() => of([wonder, secondWonder])),
    };
    preloadImages = [];

    await TestBed.configureTestingModule({
      imports: [GlobeComponent],
      providers: [{ provide: DataService, useValue: dataServiceMock }],
    }).compileComponents();

    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    jest.spyOn(window, 'Image').mockImplementation(() => {
      const image = document.createElement('img');
      preloadImages.push(image);
      return image;
    });

    fixture = TestBed.createComponent(GlobeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links to the map and World Tour Mode from the globe navigator', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('.navigator a')) as HTMLAnchorElement[];

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Switch to 2D map',
      'Play World Tour Mode',
    ]);
    expect(links[0].getAttribute('href')).toBe('/map');
    expect(links[1].getAttribute('href')).toBe('/games/world-tour-mode');
  });

  it('positions the popup directly above the selected marker', () => {
    const globeContainer = fixture.nativeElement.querySelector('.globe-container') as HTMLElement;
    const markerElement = document.createElement('div');
    const componentInternals = component as unknown as GlobeComponentInternals;

    jest
      .spyOn(globeContainer, 'getBoundingClientRect')
      .mockReturnValue(createDomRect({ left: 100, top: 50, width: 800, height: 600 }));
    jest
      .spyOn(markerElement, 'getBoundingClientRect')
      .mockReturnValue(createDomRect({ left: 280, top: 170, width: 30, height: 30 }));

    componentInternals.selectWonder(wonder, markerElement);
    fixture.detectChanges();

    const popup = fixture.nativeElement.querySelector('.popup-card') as HTMLElement;
    expect(popup.style.left).toBe('195px');
    expect(popup.style.top).toBe('120px');
  });

  it('shows the image loader when the next selected marker image is still loading', () => {
    const firstMarker = document.createElement('div');
    const secondMarker = document.createElement('div');
    const componentInternals = component as unknown as GlobeComponentInternals;

    componentInternals.selectWonder(wonder, firstMarker);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.popup-card__image-loader')).toBeTruthy();

    preloadImages[0].onload?.call(preloadImages[0], new Event('load'));
    fixture.detectChanges();

    const loadedImage = fixture.nativeElement.querySelector('.popup-card__image') as HTMLImageElement;
    expect(loadedImage.src).toBe(wonder.imageURL);
    expect(fixture.nativeElement.querySelector('.popup-card__image-loader')).toBeNull();

    componentInternals.selectWonder(secondWonder, secondMarker);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.popup-card__image')).toBeNull();
    expect(fixture.nativeElement.querySelector('.popup-card__image-loader')).toBeTruthy();

    preloadImages[1].onload?.call(preloadImages[1], new Event('load'));
    fixture.detectChanges();

    const nextImage = fixture.nativeElement.querySelector('.popup-card__image') as HTMLImageElement;
    expect(nextImage.src).toBe(secondWonder.imageURL);
  });
});

function createDomRect({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}
