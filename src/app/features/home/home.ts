import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoaderComponent } from 'src/app/shared/components/loader/loader';
import { DataService, Group, Item } from 'src/app/services/data.service';
import { LoaderService } from 'src/app/services/loader-service';
import { SortMode } from 'src/app/shared/constants/sort-mode.const';
import { groupWondersBySortMode } from 'src/app/shared/utils-helper';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

@Component({
  selector: 'app-home',
  imports: [CommonModule, LoaderComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly dataService = inject(DataService);
  private readonly router = inject(Router);
  private readonly loaderService = inject(LoaderService);

  @ViewChildren('animatedItem', { read: ElementRef })
  animatedItems!: QueryList<ElementRef<HTMLLIElement>>;

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
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe({
        next: (res: Item[]) => {
          this.data = res;
          this.groups = groupWondersBySortMode(this.data, SortMode.STYLE);
          this.errorMessage = '';
          this.isLoading = false;
          this.loaderService.setLoading(false);
        },
        error: () => {
          this.data = [];
          this.groups = [];
          this.errorMessage = 'Unable to load wonders.';
          this.isLoading = false;
          this.loaderService.setLoading(false);
        },
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

    if (luma < 100) {
      return 'white';
    } else {
      return 'black';
    }
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
