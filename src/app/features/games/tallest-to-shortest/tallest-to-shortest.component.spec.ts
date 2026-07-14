import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DataService, TallestBuilding } from 'src/app/services/data.service';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

import { TallestToShortestComponent } from './tallest-to-shortest.component';

const mockBuildings: TallestBuilding[] = Array.from({ length: 24 }, (_, index) => ({
  type: 'building',
  name: `Building ${index + 1}`,
  city: `City ${index + 1}`,
  country: 'Country',
  height_m: String(900 - index * 10),
  year_completed: '2020',
  description: 'A tall building.',
  color: '#8b5cf6',
  image_url: `https://example.com/building-${index + 1}.jpg`,
}));

describe('TallestToShortestComponent', () => {
  let component: TallestToShortestComponent;
  let fixture: ComponentFixture<TallestToShortestComponent>;
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    router = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [TallestToShortestComponent],
      providers: [
        { provide: DataService, useValue: { getTallestBuildings: () => of(mockBuildings) } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TallestToShortestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads 21 unique randomized buildings for a round', () => {
    expect(component.buildings).toHaveLength(21);
    expect(new Set(component.buildings.map((building) => building.name)).size).toBe(21);
    expect(component.correctOrder).toHaveLength(21);
  });

  it('scores a correctly sorted round', () => {
    component.buildings = [...component.correctOrder];

    component.submitOrder();

    expect(component.score).toBe(21);
    expect(component.hasSubmitted).toBe(true);
  });

  it('moves a selected card to the chosen position', () => {
    const firstBuilding = component.buildings[0];

    component.onCardClick(0);
    component.onCardClick(3);

    expect(component.buildings[3]).toBe(firstBuilding);
    expect(component.selectedIndex).toBeNull();
  });

  it('reveals the correct descending order and locks the round', () => {
    component.revealAnswer();

    const heights = component.buildings.map((building) => Number(building.height_m));
    expect(heights).toEqual([...heights].sort((a, b) => b - a));
    expect(component.hasRevealedAnswer).toBe(true);
  });

  it('navigates back to the games home', () => {
    component.goToGamesHome();

    expect(router.navigate).toHaveBeenCalledWith([URL_PATH.GAMES]);
  });
});

describe('TallestToShortestComponent data errors', () => {
  it('shows an error when the data cannot be loaded', async () => {
    await TestBed.configureTestingModule({
      imports: [TallestToShortestComponent],
      providers: [
        {
          provide: DataService,
          useValue: { getTallestBuildings: () => throwError(() => new Error('failed')) },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(TallestToShortestComponent);
    errorFixture.detectChanges();

    expect(errorFixture.componentInstance.errorMessage).toBe(
      'Unable to load the tallest buildings game data.',
    );
  });
});
