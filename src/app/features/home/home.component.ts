import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { catchError, forkJoin, map, of, take, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService, Group, Item } from 'src/app/services/data.service';
import { LoaderService } from 'src/app/services/loader.service';
import { SortMode } from 'src/app/shared/constants/sort-mode.const';
import { groupWondersBySortMode } from 'src/app/shared/utils-helper';
import { URL_PATH } from 'src/app/shared/constants/routes.const';
import { COLOR_VARS, cssVar } from 'src/app/shared/theme-colors';
import { LoaderTetrisComponent } from 'src/app/shared/components/loader-tetris/loader-tetris.component';

const HOME_LOADER_MINIMUM_MS = 800;

@Component({
  selector: 'app-home',
  imports: [CommonModule, LoaderTetrisComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly dataService = inject(DataService);
  private readonly router = inject(Router);
  private readonly loaderService = inject(LoaderService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChildren('animatedItem', { read: ElementRef })
  animatedItems!: QueryList<ElementRef<HTMLButtonElement>>;

  private positions = new Map<number, DOMRect>();
  readonly URL = URL;

  sortModes = [
    {
      name: SortMode.ALPHABETICAL,
      isSelected: false,
    },
    {
      name: SortMode.CHRONOLOGICAL,
      isSelected: false,
    },
    {
      name: SortMode.LOCATION,
      isSelected: false,
    },
    {
      name: SortMode.PROGRAMMATIC,
      isSelected: false,
    },
    {
      name: SortMode.STYLE,
      isSelected: true,
    },
  ];
  data: Item[] = [];
  groups: Group[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loaderService.setLoading(true);
    forkJoin({
      result: this.dataService.getWonders().pipe(
        take(1),
        map((data) => ({ data, errorMessage: '' })),
        catchError(() => of({ data: [] as Item[], errorMessage: 'Unable to load wonders.' })),
      ),
      minimumDisplay: timer(HOME_LOADER_MINIMUM_MS),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ result }) => {
        this.data = result.data;
        this.groups = result.errorMessage ? [] : groupWondersBySortMode(this.data, SortMode.STYLE);
        this.errorMessage = result.errorMessage;
        this.isLoading = false;
        this.loaderService.setLoading(false);
      });
  }

  ngAfterViewInit(): void {
    this.capturePositions();
  }

  private capturePositions(): void {
    this.positions.clear();
    this.animatedItems.forEach((el, i) => {
      const rect = el.nativeElement.getBoundingClientRect();
      this.positions.set(this.data[i].id, rect);
    });
  }

  private playAnimations(): void {
    this.animatedItems.forEach((el, i) => {
      const item = this.data[i];
      const oldRect = this.positions.get(item.id);
      const newRect = el.nativeElement.getBoundingClientRect();

      if (!oldRect) return;

      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;

      if (dx || dy) {
        const node = el.nativeElement;
        node.style.transform = `translate(${dx}px, ${dy}px)`;
        node.style.transition = 'none';

        requestAnimationFrame(() => {
          node.style.transform = '';
          node.style.transition = 'transform 300ms ease';
        });
      }
    });
  }

  updateSelectedMode(selectedMode: { name: SortMode; isSelected: boolean }): void {
    this.sortModes = this.sortModes.map((mode) => {
      return {
        name: mode.name,
        isSelected: mode.name === selectedMode.name,
      };
    });
  }

  sort(mode: { name: SortMode; isSelected: boolean }): void {
    this.capturePositions();
    this.updateSelectedMode(mode);
    this.groups = groupWondersBySortMode(this.data, mode.name);

    requestAnimationFrame(() => {
      this.playAnimations();
    });
  }

  getDynamicStyle(item: Item): { color: string; backgroundColor: string } {
    const fontColor = this.getColor(item.color);
    return {
      color: fontColor,
      backgroundColor: item.color,
    };
  }

  getColor(hexcode: string): string {
    const c = hexcode.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luma < 100 ? cssVar(COLOR_VARS.onDark) : cssVar(COLOR_VARS.onLight);
  }

  goToDetailPage(itemId: number): void {
    const sortMode = this.sortModes.find((mode) => mode.isSelected)?.name ?? SortMode.STYLE;

    this.router.navigate([URL_PATH.DETAIL, itemId], {
      queryParams: { sortMode },
    });
  }

  goToSection(fragment: string): void {
    const mode = this.sortModes.find((mode) => mode.isSelected);

    switch (mode?.name) {
      case SortMode.CHRONOLOGICAL:
        this.router.navigate([URL_PATH.TIMELINE], { fragment });
        break;
      case SortMode.ALPHABETICAL:
        this.router.navigate([URL_PATH.ALPHABETICAL], { fragment });
        break;
      case SortMode.LOCATION:
        this.router.navigate([URL_PATH.LOCATION], { fragment });
        break;
      case SortMode.PROGRAMMATIC:
        this.router.navigate([URL_PATH.PROGRAMMATIC], { fragment });
        break;
      case SortMode.STYLE:
        this.router.navigate([URL_PATH.STYLE], { fragment });
        break;
    }
  }
}
