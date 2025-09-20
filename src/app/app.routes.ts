import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { DetailComponent } from './features/detail/detail';
import { AlphabeticalComponent } from './features/alphabetical/alphabetical';
import { ChartsComponent } from './features/charts/charts';
import { ProgrammaticComponent } from './features/programmatic/programmatic';
import { QuizComponent } from './features/quiz/quiz';
import { SearchComponent } from './features/search/search';
import { StyleComponent } from './features/style/style';
import { TimelineComponent } from './features/timeline/timeline';
import { MapComponent } from './features/map/map';
import { LocationComponent } from './features/location/location';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'detail/:id', component: DetailComponent },
  { path: 'search', component: SearchComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'map', component: MapComponent },
  { path: 'timeline', component: TimelineComponent },
  { path: 'charts', component: ChartsComponent },
  { path: 'style', component: StyleComponent },
  { path: 'alphabetical', component: AlphabeticalComponent },
  { path: 'location', component: LocationComponent },
  { path: 'programmatic', component: ProgrammaticComponent },
  { path: '**', redirectTo: 'home' },
];
