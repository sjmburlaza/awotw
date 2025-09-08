import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Detail } from './detail/detail';
import { Quiz } from './quiz/quiz';
import { Search } from './search/search';
import { Map } from './map/map';
import { Timeline } from './timeline/timeline';
import { Charts } from './charts/charts';
import { Style } from './style/style';
import { Alphabetical } from './alphabetical/alphabetical';
import { Location } from './location/location';
import { Programmatic } from './programmatic/programmatic';

export const routes: Routes = [
  { path: 'home', component: Home },
  { path: 'detail/:id', component: Detail },
  { path: 'search', component: Search },
  { path: 'quiz', component: Quiz },
  { path: 'map', component: Map },
  { path: 'timeline', component: Timeline },
  { path: 'charts', component: Charts },
  { path: 'style', component: Style },
  { path: 'alphabetical', component: Alphabetical },
  { path: 'location', component: Location },
  { path: 'programmatic', component: Programmatic },
  { path: '**', redirectTo: 'home' }
];
