import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';

import { ArchitecturePuzzleComponent } from './architecture-puzzle.component';

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
    imageURL: 'https://example.com/giza.jpg',
    codename: 'GPG',
    color: '#737CA1',
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
    imageURL: 'https://example.com/parthenon.jpg',
    codename: 'PAR',
    color: '#2B3856',
  },
  {
    id: 3,
    name: 'Missing image',
    yearBuilt: 'Unknown',
    style: 'Unknown',
    buildingType: 'Unknown',
    location: 'Unknown',
    continent: 'Unknown',
    descriptionURL: '',
    imageURL: '',
    codename: 'MIS',
    color: '#111111',
  },
];

describe('ArchitecturePuzzleComponent', () => {
  let component: ArchitecturePuzzleComponent;
  let fixture: ComponentFixture<ArchitecturePuzzleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchitecturePuzzleComponent],
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

    fixture = TestBed.createComponent(ArchitecturePuzzleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with image-backed wonders and an 8 x 8 board', () => {
    expect(component.wonders).toHaveLength(2);
    expect(component.currentWonder?.name).toBe('Great Pyramid of Giza');
    expect(component.selectedSize).toBe(8);
    expect(component.pieceCount).toBe(64);
    expect(component.tiles).toHaveLength(64);
  });

  it('supports preset difficulty sizes', () => {
    component.setDifficulty(16);

    expect(component.selectedSize).toBe(16);
    expect(component.isCustomDifficulty).toBe(false);
    expect(component.pieceCount).toBe(256);
  });

  it('clamps custom difficulty from 6 x 6 to 120 x 120', () => {
    component.customSize = 2;
    component.applyCustomSize();

    expect(component.selectedSize).toBe(6);
    expect(component.pieceCount).toBe(36);

    component.customSize = 140;
    component.applyCustomSize();

    expect(component.selectedSize).toBe(120);
    expect(component.pieceCount).toBe(14400);
    expect(component.isCustomDifficulty).toBe(true);
  });

  it('shuffles all source pieces without starting solved', () => {
    component.setDifficulty(6);

    const sourcePieces = component.tiles.map((tile) => tile.sourceIndex);

    expect(new Set(sourcePieces).size).toBe(36);
    expect(component.isSolved()).toBe(false);
  });

  it('marks the board solved when the final swap restores every piece', () => {
    component.setDifficulty(6);
    component.tiles = Array.from({ length: 36 }, (_, index) => ({
      id: index,
      sourceIndex: index,
    }));
    [component.tiles[0], component.tiles[1]] = [component.tiles[1], component.tiles[0]];

    component.selectTile(0);
    component.selectTile(1);

    expect(component.moves).toBe(1);
    expect(component.isComplete).toBe(true);
  });
});
