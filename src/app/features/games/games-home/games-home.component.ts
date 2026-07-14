import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { URL_PATH } from 'src/app/shared/constants/routes.const';
import { COLOR_VARS, cssVar } from 'src/app/shared/theme-colors';

interface GameOption {
  title: string;
  kicker: string;
  description: string;
  mode: string;
  pace: string;
  route: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-games-home',
  imports: [],
  templateUrl: './games-home.component.html',
  styleUrl: './games-home.component.scss',
})
export class GamesHomeComponent {
  private readonly router = inject(Router);

  readonly games: GameOption[] = [
    {
      title: 'GeoGuesser',
      kicker: 'Map challenge',
      description: 'Pin wonders from clues and memory before the round slips away.',
      mode: 'Location',
      pace: 'Fast',
      route: URL_PATH.GEOGUESSER,
      color: cssVar(COLOR_VARS.gameGeoguesser),
      icon: 'bi-pin-map',
    },
    {
      title: 'Recreate Timeline',
      kicker: 'Chronology',
      description: 'Sequence architectural milestones and keep history in order.',
      mode: 'Timeline',
      pace: 'Tactical',
      route: URL_PATH.RECREATE_TIMELINE,
      color: cssVar(COLOR_VARS.gameTimeline),
      icon: 'bi-hourglass-split',
    },
    {
      title: 'Architecture Puzzle',
      kicker: 'Visual logic',
      description: 'Rebuild landmark images from shuffled pieces and spatial clues.',
      mode: 'Puzzle',
      pace: 'Focused',
      route: URL_PATH.ARCHITECTURE_PUZZLE,
      color: cssVar(COLOR_VARS.gamePuzzle),
      icon: 'bi-grid-3x3-gap',
    },
    {
      title: 'Quizzes',
      kicker: 'Knowledge run',
      description: 'Test styles, places, dates, and details from the wonders archive.',
      mode: 'Quiz',
      pace: 'Classic',
      route: URL_PATH.QUIZ,
      color: cssVar(COLOR_VARS.gameQuiz),
      icon: 'bi-patch-question',
    },
    {
      title: 'World Tour Mode',
      kicker: 'Route builder',
      description: 'Travel across connected wonders and chart a clean global path.',
      mode: 'Tour',
      pace: 'Open',
      route: URL_PATH.WORLD_TOUR_MODE,
      color: cssVar(COLOR_VARS.gameWorldTour),
      icon: 'bi-airplane',
    },
  ];

  onSelectGame(game: GameOption): void {
    this.router.navigate([game.route]);
  }

  goToHome(): void {
    this.router.navigate([URL_PATH.HOME]);
  }
}
