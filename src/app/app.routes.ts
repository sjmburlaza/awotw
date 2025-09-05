import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Detail } from './detail/detail';
import { Quiz } from './quiz/quiz';
import { Search } from './search/search';
import { Map } from './map/map';
import { Timeline } from './timeline/timeline';
import { Charts } from './charts/charts';

export const routes: Routes = [
  { path: 'home', component: Home },
  { path: 'detail/:id', component: Detail },
  { path: 'search', component: Search },
  { path: 'quiz', component: Quiz },
  { path: 'map', component: Map },
  { path: 'timeline', component: Timeline },
  { path: 'charts', component: Charts },
  { path: '**', redirectTo: 'home' }
];
