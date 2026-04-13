import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./features/detail/detail').then((m) => m.DetailComponent),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search').then((m) => m.SearchComponent),
  },
  {
    path: 'quiz',
    loadComponent: () =>
      import('./features/quiz/quiz').then((m) => m.QuizComponent),
  },
  {
    path: 'map',
    loadComponent: () =>
      import('./features/map/map').then((m) => m.MapComponent),
  },
  {
    path: 'globe',
    loadComponent: () =>
      import('./features/globe/globe').then((m) => m.GlobeComponent),
  },
  {
    path: 'timeline',
    loadComponent: () =>
      import('./features/timeline/timeline').then((m) => m.TimelineComponent),
  },
  {
    path: 'charts',
    loadComponent: () =>
      import('./features/charts/charts').then((m) => m.ChartsComponent),
  },
  {
    path: 'style',
    loadComponent: () =>
      import('./features/style/style').then((m) => m.StyleComponent),
  },
  {
    path: 'alphabetical',
    loadComponent: () =>
      import('./features/alphabetical/alphabetical').then(
        (m) => m.AlphabeticalComponent
      ),
  },
  {
    path: 'location',
    loadComponent: () =>
      import('./features/location/location').then((m) => m.LocationComponent),
  },
  {
    path: 'programmatic',
    loadComponent: () =>
      import('./features/programmatic/programmatic').then(
        (m) => m.ProgrammaticComponent
      ),
  },
  { path: '**', redirectTo: 'home' },
];
