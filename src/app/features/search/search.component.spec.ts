import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Item } from 'src/app/services/data.service';

import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  const wonders: Item[] = [
    {
      id: 1,
      name: 'Great Wall of China',
      yearBuilt: '0700BC',
      style: 'Fortification',
      buildingType: 'Wall',
      location: 'China',
      continent: 'Asia',
      descriptionURL: '',
      imageURL: '',
      codename: 'great-wall',
      color: '#111111',
    },
    {
      id: 2,
      name: 'Wall House',
      yearBuilt: '2001',
      style: 'Modern',
      buildingType: 'House',
      location: 'Netherlands',
      continent: 'Europe',
      descriptionURL: '',
      imageURL: '',
      codename: 'wall-house',
      color: '#222222',
    },
    {
      id: 3,
      name: 'Stone Wall',
      yearBuilt: '1800',
      style: 'Vernacular',
      buildingType: 'Wall',
      location: 'Scotland',
      continent: 'Europe',
      descriptionURL: '',
      imageURL: '',
      codename: 'stone-wall',
      color: '#333333',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears results and shows the prompt when the query is blank', () => {
    component.performSearch(wonders, '   ');

    expect(component.searchResults).toEqual([]);
    expect(component.emptyMessage).toBe('Enter a search term to find a wonder.');
  });

  it('ranks exact and prefix matches ahead of contains matches', () => {
    component.performSearch(wonders, 'wall');

    expect(component.searchResults.map((item) => item.name)).toEqual([
      'Wall House',
      'Great Wall of China',
      'Stone Wall',
    ]);
    expect(component.emptyMessage).toBe('');
  });

  it('shows an empty message when no wonders match', () => {
    component.performSearch(wonders, 'pyramid');

    expect(component.searchResults).toEqual([]);
    expect(component.emptyMessage).toBe('No wonders found for "pyramid".');
  });
});
