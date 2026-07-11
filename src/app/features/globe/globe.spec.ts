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

  beforeEach(async () => {
    dataServiceMock = {
      getWonders: jest.fn(() => of([wonder])),
    };

    await TestBed.configureTestingModule({
      imports: [GlobeComponent],
      providers: [{ provide: DataService, useValue: dataServiceMock }],
    }).compileComponents();

    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    fixture = TestBed.createComponent(GlobeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
