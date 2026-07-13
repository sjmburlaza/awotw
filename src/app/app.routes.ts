import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import type { WonderGroupFeature } from './features/wonder-groups/wonder-groups.component';

interface WonderGroupRouteData {
  feature: WonderGroupFeature;
}

const wonderGroupRouteData = (feature: WonderGroupFeature): WonderGroupRouteData => ({ feature });

const loadWonderGroupsComponent = () =>
  import('./features/wonder-groups/wonder-groups.component').then((m) => m.WonderGroupsComponent);

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  {
    path: 'detail/:id',
    loadComponent: () => import('./features/detail/detail.component').then((m) => m.DetailComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'games',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/games/games-home/games-home.component').then(
            (m) => m.GamesHomeComponent,
          ),
      },
      {
        path: 'recreate-timeline',
        loadComponent: () =>
          import('./features/games/recreate-timeline/recreate-timeline.component').then(
            (m) => m.RecreateTimelineComponent,
          ),
      },
      {
        path: 'geoguesser',
        loadComponent: () =>
          import('./features/games/geoguesser/geoguesser.component').then(
            (m) => m.GeoguesserComponent,
          ),
      },
      {
        path: 'architecture-puzzle',
        loadComponent: () =>
          import('./features/games/architecture-puzzle/architecture-puzzle.component').then(
            (m) => m.ArchitecturePuzzleComponent,
          ),
      },
      {
        path: 'quiz',
        loadComponent: () =>
          import('./features/games/quiz/quiz.component').then((m) => m.QuizComponent),
      },
      {
        path: 'world-tour-mode',
        loadComponent: () =>
          import('./features/games/world-tour-mode/world-tour-mode.component').then(
            (m) => m.WorldTourModeComponent,
          ),
      },
    ],
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map.component').then((m) => m.MapComponent),
  },
  {
    path: 'globe',
    loadComponent: () => import('./features/globe/globe.component').then((m) => m.GlobeComponent),
  },
  {
    path: 'timeline',
    loadComponent: () =>
      import('./features/timeline/timeline.component').then((m) => m.TimelineComponent),
  },
  {
    path: 'charts',
    loadComponent: () => import('./features/charts/charts.component').then((m) => m.ChartsComponent),
  },
  {
    path: 'style',
    loadComponent: loadWonderGroupsComponent,
    data: wonderGroupRouteData('style'),
  },
  {
    path: 'alphabetical',
    loadComponent: loadWonderGroupsComponent,
    data: wonderGroupRouteData('alphabetical'),
  },
  {
    path: 'location',
    loadComponent: loadWonderGroupsComponent,
    data: wonderGroupRouteData('location'),
  },
  {
    path: 'programmatic',
    loadComponent: loadWonderGroupsComponent,
    data: wonderGroupRouteData('programmatic'),
  },
  { path: '**', redirectTo: 'home' },
];
