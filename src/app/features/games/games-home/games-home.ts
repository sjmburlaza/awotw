import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { URL_PATH } from 'src/app/shared/constants/routes.const';
import { COLOR_VARS, cssVar } from 'src/app/shared/theme-colors';

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
      color: cssVar(COLOR_VARS.gameGeoguesser),
    },
    {
      title: 'Recreate Timeline',
      route: URL_PATH.RECREATE_TIMELINE,
      color: cssVar(COLOR_VARS.gameTimeline),
    },
    {
      title: 'Architecture Puzzle',
      route: URL_PATH.ARCHITECTURE_PUZZLE,
      color: cssVar(COLOR_VARS.gamePuzzle),
    },
    {
      title: 'Quizzes',
      route: URL_PATH.QUIZ,
      color: cssVar(COLOR_VARS.gameQuiz),
    },
    {
      title: 'World Tour Mode',
      route: URL_PATH.WORLD_TOUR_MODE,
      color: cssVar(COLOR_VARS.gameWorldTour),
    },
  ];

  onSelectGame(game: GameOption): void {
    this.router.navigate([game.route]);
  }
}
