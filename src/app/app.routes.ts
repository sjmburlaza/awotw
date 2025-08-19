import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Detail } from './detail/detail';
import { Quiz } from './quiz/quiz';
import { Search } from './search/search';

export const routes: Routes = [
  { path: 'home', component: Home },
  { path: 'detail/:id', component: Detail },
  { path: 'search', component: Search },
  { path: 'quiz', component: Quiz },
  { path: '**', redirectTo: 'home' }
];
