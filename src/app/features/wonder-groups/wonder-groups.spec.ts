import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';

import { WonderGroupFeature, WonderGroupsComponent } from './wonder-groups';

describe('WonderGroupsComponent', () => {
  let fixture: ComponentFixture<WonderGroupsComponent>;
  let component: WonderGroupsComponent;
  let fragment$: Subject<string | null>;

  const wonders: Item[] = [
    {
      id: 1,
      name: 'Ziggurat of Ur',
      yearBuilt: '2100BC',
      style: 'Ancient',
      buildingType: 'Temple',
      location: 'Dhi Qar, Iraq',
      continent: 'Asia',
      descriptionURL: '',
      imageURL: '',
      codename: 'ziggurat-of-ur',
      color: '#111111',
    },
    {
      id: 2,
      name: 'Colosseum',
      yearBuilt: '0080',
      style: 'Greek, Roman',
      buildingType: 'Amphitheater',
      location: 'Rome, Italy',
      continent: 'Europe',
      descriptionURL: '',
      imageURL: '',
      codename: 'colosseum',
      color: '#222222',
    },
    {
      id: 3,
      name: 'Angkor Wat',
      yearBuilt: '1150',
      style: 'Khmer',
      buildingType: 'Temple',
      location: 'Siem Reap, Cambodia',
      continent: 'Asia',
      descriptionURL: '',
      imageURL: '',
      codename: 'angkor-wat',
      color: '#333333',
    },
  ];

  const dataService = {
    getWonders: jest.fn(() => of(wonders)),
  };

  const activatedRoute: {
    snapshot: { data: Record<string, unknown> };
    fragment: Observable<string | null>;
  } = {
    snapshot: { data: {} },
    fragment: of(null),
  };

  const scrollService = {
    scrollToFragment: jest.fn(),
  };

  beforeEach(async () => {
    fragment$ = new Subject<string | null>();
    activatedRoute.fragment = fragment$.asObservable();
    activatedRoute.snapshot.data = {};
    dataService.getWonders.mockReturnValue(of(wonders));
    scrollService.scrollToFragment.mockClear();

    await TestBed.configureTestingModule({
      imports: [WonderGroupsComponent],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ScrollService, useValue: scrollService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it.each([
    ['alphabetical', 'Alphabetical Grouping', ['A', 'C', 'Z']],
    ['location', 'Grouping by Continent', ['Asia', 'Europe']],
    ['programmatic', 'Grouping by Use', ['Amphitheater', 'Temple']],
    ['style', 'Architectural Styles', ['Ancient', 'Greek, Roman', 'Khmer']],
  ] as const)(
    'loads %s grouping config',
    (feature: WonderGroupFeature, expectedTitle, expectedGroupNames) => {
      createComponent(feature);

      expect(component.title).toBe(expectedTitle);

      component.groups$.subscribe((groups) => {
        expect(groups.map((group) => group.groupName)).toEqual(expectedGroupNames);
      });
    },
  );

  it('falls back to alphabetical grouping when route data is missing', () => {
    createComponent();

    expect(component.title).toBe('Alphabetical Grouping');

    component.groups$.subscribe((groups) => {
      expect(groups.map((group) => group.groupName)).toEqual(['A', 'C', 'Z']);
    });
  });

  it('shows the feature-specific error message when loading fails', () => {
    activatedRoute.snapshot.data = { feature: 'style' };
    dataService.getWonders.mockReturnValue(throwError(() => new Error('Unable to load')));

    fixture = TestBed.createComponent(WonderGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Unable to load architectural styles.');
  });

  it('scrolls to the active fragment', () => {
    createComponent('location');

    fragment$.next('Asia');

    expect(scrollService.scrollToFragment).toHaveBeenCalledWith('Asia', 50);
  });

  function createComponent(feature?: WonderGroupFeature): void {
    activatedRoute.snapshot.data = feature ? { feature } : {};
    fixture = TestBed.createComponent(WonderGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});
