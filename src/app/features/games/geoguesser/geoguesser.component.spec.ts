import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import * as L from 'leaflet';
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
    window.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [GeoguesserComponent],
      providers: [
        {
          provide: DataService,
          useValue: {
            getWonders: () => of(mockWonders),
          },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
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

  it('loads the top five saved scores from local storage', async () => {
    fixture.destroy();
    window.localStorage.setItem(
      'geoguesser-top-scores',
      JSON.stringify([
        { score: 20, completedAt: '2026-07-10T10:00:00.000Z' },
        { score: 80, completedAt: '2026-07-10T11:00:00.000Z' },
        { score: 40, completedAt: '2026-07-10T12:00:00.000Z' },
        { score: 100, completedAt: '2026-07-10T13:00:00.000Z' },
        { score: 60, completedAt: '2026-07-10T14:00:00.000Z' },
        { score: 10, completedAt: '2026-07-10T15:00:00.000Z' },
      ]),
    );

    fixture = TestBed.createComponent(GeoguesserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.topScores.map((score) => score.score)).toEqual([100, 80, 60, 40, 20]);
  });

  it('records the score and shows the popup after ten rounds', () => {
    component.roundNumber = 10;
    component.totalScore = 4200;
    component.currentWonder = component.wonders[0];
    component.selectedLatLng = {
      lat: Number(component.currentWonder.lat),
      lng: Number(component.currentWonder.lon),
    } as L.LatLng;

    component.submitGuess();

    const savedScores = JSON.parse(window.localStorage.getItem('geoguesser-top-scores') ?? '[]');

    expect(component.showScorePopup).toBe(true);
    expect(component.latestSavedScore?.score).toBeGreaterThan(4200);
    expect(savedScores).toHaveLength(1);
    expect(savedScores[0].score).toBe(component.latestSavedScore?.score);
  });

  it('opens the leaderboard from the panel controller without resetting the game', () => {
    component.totalScore = 1200;
    component.roundNumber = 4;
    fixture.detectChanges();

    const leaderboardButton = fixture.nativeElement.querySelector(
      'button[aria-label="Check leaderboard"]',
    ) as HTMLButtonElement;
    leaderboardButton.click();
    fixture.detectChanges();

    expect(component.showLeaderboardPopup).toBe(true);
    expect(fixture.nativeElement.querySelector('app-leaderboard-popup h2').textContent).toContain(
      'GeoGuesser leaderboard',
    );

    fixture.nativeElement.querySelector('.leaderboard-popup__action').click();
    fixture.detectChanges();

    expect(component.showLeaderboardPopup).toBe(false);
    expect(component.totalScore).toBe(1200);
    expect(component.roundNumber).toBe(4);
  });
});
