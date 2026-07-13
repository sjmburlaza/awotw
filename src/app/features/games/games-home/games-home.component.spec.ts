import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

import { GamesHomeComponent } from './games-home.component';

describe('GamesHomeComponent', () => {
  let component: GamesHomeComponent;
  let fixture: ComponentFixture<GamesHomeComponent>;
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    router = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GamesHomeComponent],
      providers: [{ provide: Router, useValue: router }],
    }).compileComponents();

    fixture = TestBed.createComponent(GamesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the available games', () => {
    expect(component.games.map((game) => game.title)).toEqual([
      'GeoGuesser',
      'Recreate Timeline',
      'Architecture Puzzle',
      'Quizzes',
      'World Tour Mode',
    ]);
  });

  it('navigates to the selected game', () => {
    component.onSelectGame(component.games[0]);

    expect(router.navigate).toHaveBeenCalledWith([URL_PATH.GEOGUESSER]);
  });
});
