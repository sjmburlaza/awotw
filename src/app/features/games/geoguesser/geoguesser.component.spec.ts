import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';

import { GeoguesserComponent } from './geoguesser.component';

const mockWonders: Item[] = [
  {
    id: 1,
    name: 'Great Pyramid of Giza',
    yearBuilt: '2589-2566 BC',
    style: 'Egyptian',
    buildingType: 'Memorial',
    location: 'Giza, Egypt',
    continent: 'Africa',
    descriptionURL: '',
    imageURL: '',
    codename: 'GPG',
    color: '#737CA1',
    lat: '29.9870753',
    lon: '31.2118063',
  },
  {
    id: 2,
    name: 'Parthenon',
    yearBuilt: '447-432 BC',
    style: 'Greek',
    buildingType: 'Religious',
    location: 'Athens, Greece',
    continent: 'Europe',
    descriptionURL: '',
    imageURL: '',
    codename: 'PAR',
    color: '#2B3856',
    lat: '37.9755648',
    lon: '23.7348324',
  },
  {
    id: 3,
    name: 'Unmapped wonder',
    yearBuilt: 'Unknown',
    style: 'Unknown',
    buildingType: 'Unknown',
    location: 'Unknown',
    continent: 'Unknown',
    descriptionURL: '',
    imageURL: '',
    codename: 'UNK',
    color: '#111111',
    lat: '',
    lon: '',
  },
];

describe('GeoguesserComponent', () => {
  let component: GeoguesserComponent;
  let fixture: ComponentFixture<GeoguesserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeoguesserComponent],
      providers: [
        {
          provide: DataService,
          useValue: {
            getWonders: () => of(mockWonders),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GeoguesserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts a round with mappable wonders only', () => {
    expect(component.wonders).toHaveLength(2);
    expect(component.currentWonder).toBeTruthy();
    expect(component.roundNumber).toBe(1);
  });

  it('calculates zero distance for the same coordinates', () => {
    const distance = component.calculateDistanceKm(29.9870753, 31.2118063, 29.9870753, 31.2118063);

    expect(distance).toBeLessThan(0.001);
  });

  it('scores closer and faster guesses higher', () => {
    const closeFastScore = component.calculateRoundScore(1, 5);
    const farSlowScore = component.calculateRoundScore(3000, 120);

    expect(closeFastScore.distanceScore).toBeGreaterThan(farSlowScore.distanceScore);
    expect(closeFastScore.timeBonus).toBeGreaterThan(farSlowScore.timeBonus);
    expect(closeFastScore.total).toBeGreaterThan(farSlowScore.total);
  });
});
