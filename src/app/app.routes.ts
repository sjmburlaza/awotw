import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  {
    path: 'detail/:id',
    loadComponent: () => import('./features/detail/detail').then((m) => m.DetailComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchComponent),
  },
  {
    path: 'games',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/games/games-home/games-home').then((m) => m.GamesHomeComponent),
      },
      {
        path: 'recreate-timeline',
        loadComponent: () =>
          import('./features/games/recreate-timeline/recreate-timeline').then(
            (m) => m.RecreateTimelineComponent,
          ),
      },
      {
        path: 'geoguesser',
        loadComponent: () =>
          import('./features/games/geoguesser/geoguesser').then((m) => m.GeoguesserComponent),
      },
      {
        path: 'architecture-puzzle',
        loadComponent: () =>
          import('./features/games/architecture-puzzle/architecture-puzzle').then(
            (m) => m.ArchitecturePuzzleComponent,
          ),
      },
      {
        path: 'quiz',
        loadComponent: () => import('./features/games/quiz/quiz').then((m) => m.QuizComponent),
      },
      {
        path: 'world-tour-mode',
        loadComponent: () =>
          import('./features/games/world-tour-mode/world-tour-mode').then(
            (m) => m.WorldTourModeComponent,
          ),
      },
    ],
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map').then((m) => m.MapComponent),
  },
  {
    path: 'globe',
    loadComponent: () => import('./features/globe/globe').then((m) => m.GlobeComponent),
  },
  {
    path: 'timeline',
    loadComponent: () => import('./features/timeline/timeline').then((m) => m.TimelineComponent),
  },
  {
    path: 'charts',
    loadComponent: () => import('./features/charts/charts').then((m) => m.ChartsComponent),
  },
  {
    path: 'style',
    loadComponent: () => import('./features/style/style').then((m) => m.StyleComponent),
  },
  {
    path: 'alphabetical',
    loadComponent: () =>
      import('./features/alphabetical/alphabetical').then((m) => m.AlphabeticalComponent),
  },
  {
    path: 'location',
    loadComponent: () => import('./features/location/location').then((m) => m.LocationComponent),
  },
  {
    path: 'programmatic',
    loadComponent: () =>
      import('./features/programmatic/programmatic').then((m) => m.ProgrammaticComponent),
  },
  { path: '**', redirectTo: 'home' },
];
