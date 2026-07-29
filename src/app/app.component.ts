import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { HeaderComponent } from './features/header/header.component';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top.component';
import { URL_PATH } from './shared/constants/routes.const';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, BackToTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly responsivePaths = new Set<string>([
    URL_PATH.SEARCH,
    URL_PATH.MAP,
    URL_PATH.TIMELINE,
    URL_PATH.CHARTS,
  ]);

  protected title = 'architectural-wonders-v2';
  protected isGamesRoute = this.isGamesPath(this.router.url);
  protected isResponsiveRoute = this.isResponsivePath(this.router.url);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.isGamesRoute = this.isGamesPath(event.urlAfterRedirects);
        this.isResponsiveRoute = this.isResponsivePath(event.urlAfterRedirects);
      });
  }

  private isGamesPath(url: string): boolean {
    const [path] = url.split(/[?#]/);

    return path === URL_PATH.GAMES || path.startsWith(`${URL_PATH.GAMES}/`);
  }

  private isHomePath(url: string): boolean {
    const [path] = url.split(/[?#]/);

    return path === '/' || path === URL_PATH.HOME;
  }

  private isResponsivePath(url: string): boolean {
    const [path] = url.split(/[?#]/);

    return this.isHomePath(url) || this.responsivePaths.has(path);
  }
}
