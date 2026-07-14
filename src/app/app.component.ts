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

  protected title = 'architectural-wonders-v2';
  protected isGamesRoute = this.isGamesPath(this.router.url);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.isGamesRoute = this.isGamesPath(event.urlAfterRedirects);
      });
  }

  private isGamesPath(url: string): boolean {
    const [path] = url.split(/[?#]/);

    return path === URL_PATH.GAMES || path.startsWith(`${URL_PATH.GAMES}/`);
  }
}
