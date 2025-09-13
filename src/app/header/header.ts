import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { URL } from '../shared/constants/routes.const';
import { LoaderService } from '../services/loader-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  readonly URL = URL;
  currentUrl = URL.HOME;
  isDarkMode = false;
  isHomeClicked = false;
  zoomInText = false;
  searchQuery = '';
  isLoading = true;

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.urlAfterRedirects;
        if (this.currentUrl === URL.HOME) {
          this.zoomInText = true;
        } else {
          this.zoomInText = false;
        }
        if (!event.url.includes(URL.SEARCH)) {
          this.searchQuery = '';
        }
      });

    this.loaderService.isLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => (this.isLoading = state));
  }

  onSearch(): void {
    if (this.searchQuery) {
      this.router.navigate([URL.SEARCH], { queryParams: { q: this.searchQuery } });
    } else {
      this.router.navigate([URL.HOME]);
    }
  }

  goToMapPage(): void {
    this.router.navigate([URL.MAP]);
  }

  goToTimelinePage(): void {
    this.router.navigate([URL.TIMELINE]);
  }

  goToChartsPage(): void {
    this.router.navigate([URL.CHARTS]);
  }

  goToHomePage(): void {
    this.isHomeClicked = true;
    setTimeout(() => {
      this.router.navigate([URL.HOME]);
      this.isHomeClicked = false;
    }, 500);
  }

  goToQuizPage(): void {
    this.router.navigate([URL.QUIZ]);
  }

  onToggleBgMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode');
  }
}
