import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

interface GameOption {
  title: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-games-home',
  imports: [],
  templateUrl: './games-home.html',
  styleUrl: './games-home.scss',
})
export class GamesHomeComponent {
  private readonly router = inject(Router);

  readonly games: GameOption[] = [
    {
      title: 'GeoGuesser',
      route: URL_PATH.GEOGUESSER,
      color: '#2563eb',
    },
    {
      title: 'Recreate Timeline',
      route: URL_PATH.RECREATE_TIMELINE,
      color: '#f97316',
    },
    {
      title: 'Architecture Puzzle',
      route: URL_PATH.ARCHITECTURE_PUZZLE,
      color: '#0f766e',
    },
    {
      title: 'Quizzes',
      route: URL_PATH.QUIZ,
      color: '#cc3e3e',
    },
    {
      title: 'World Tour Mode',
      route: URL_PATH.WORLD_TOUR_MODE,
      color: '#0891b2',
    },
  ];

  onSelectGame(game: GameOption): void {
    this.router.navigate([game.route]);
  }
}
