import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { URL_PATH } from 'src/app/shared/constants/routes.const';
import { LoaderService } from 'src/app/services/loader-service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);
  private loaderService = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  readonly URL_PATH = URL_PATH;
  currentUrl = URL_PATH.HOME;
  isDarkMode = false;
  isHomeClicked = false;
  zoomInText = false;
  searchQuery = '';
  isLoading = true;

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.urlAfterRedirects;
        if (this.currentUrl === URL_PATH.HOME) {
          this.zoomInText = true;
        } else {
          this.zoomInText = false;
        }
        if (!event.url.includes(URL_PATH.SEARCH)) {
          this.searchQuery = '';
        }
      });

    this.loaderService.isLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => (this.isLoading = state));
  }

  onSearch(): void {
    if (this.searchQuery) {
      this.router.navigate([URL_PATH.SEARCH], { queryParams: { q: this.searchQuery } });
    } else {
      this.router.navigate([URL_PATH.HOME]);
    }
  }

  goToMapPage(): void {
    this.router.navigate([URL_PATH.MAP]);
  }

  goToTimelinePage(): void {
    this.router.navigate([URL_PATH.TIMELINE]);
  }

  goToChartsPage(): void {
    this.router.navigate([URL_PATH.CHARTS]);
  }

  goToHomePage(): void {
    this.isHomeClicked = true;
    setTimeout(() => {
      this.router.navigate([URL_PATH.HOME]);
      this.isHomeClicked = false;
    }, 500);
  }

  goToQuizPage(): void {
    this.router.navigate([URL_PATH.QUIZ]);
  }

  onToggleBgMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode');
  }
}
