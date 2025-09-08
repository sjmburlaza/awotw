import { AfterViewInit, Component, ElementRef, inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Loader } from '../shared/components/loader/loader';
import { groupByAttribute, groupByYearBuilt, sortAlphabetical } from '../shared/utils-helper';
import { LoaderService } from '../services/loader-service';
import { URL } from '../shared/constants/routes.const';

enum Mode {
  ALPHABETICAL = 'ALPHABETICAL',
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  LOCATION = 'LOCATION',
  PROGRAMMATIC = 'PROGRAMMATIC',
  STYLE = 'STYLE'
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, Loader],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, AfterViewInit {
  @ViewChildren('animatedItem', { read: ElementRef })
  animatedItems!: QueryList<ElementRef<HTMLLIElement>>;

  private positions = new Map<number, DOMRect>();
  readonly URL = URL;

  sortModes = [
    {
      name: Mode.ALPHABETICAL,
      isSelected: false
    },
    {
      name: Mode.CHRONOLOGICAL,
      isSelected: false
    },
    {
      name: Mode.LOCATION,
      isSelected: false
    },
    {
      name: Mode.PROGRAMMATIC,
      isSelected: false
    },
    {
      name: Mode.STYLE,
      isSelected: true
    }
  ];
  data: Item[] = [];
  groups: Group[] = [];
  isLoading = true;

  constructor(
    private dataService: DataService,
    private router: Router,
    private loaderService: LoaderService,
  ) {}

  ngOnInit(): void {
    this.loaderService.setLoading(true);
    this.dataService.getWonders().pipe(take(1)).subscribe((res: Item[]) => {
      this.data = res;
      this.groups = groupByAttribute(this.data, 'style');
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

  updateSelectedMode(selectedMode: {name: string; isSelected: boolean}): void {
    this.sortModes = this.sortModes.map(mode => {
      return {
        name: mode.name,
        isSelected: mode.name === selectedMode.name,
      }
    })
  }

  sort(mode: {name: string; isSelected: boolean}): void {
    this.capturePositions();
    this.updateSelectedMode(mode);
    const items = [...this.data];

    switch(mode.name) {
      case Mode.ALPHABETICAL:
        sortAlphabetical(items, 'name');
        this.groups = groupByAttribute(items, 'name');
        break;
      case Mode.CHRONOLOGICAL:
        this.groups = groupByYearBuilt(items);
        break;
      case Mode.LOCATION:
        sortAlphabetical(items, 'continent');
        this.groups = groupByAttribute(items, 'continent');
        break;
      case Mode.PROGRAMMATIC:
        sortAlphabetical(items, 'buildingType');
        this.groups = groupByAttribute(items, 'buildingType');
        break;
      case Mode.STYLE:
        this.groups = groupByAttribute(items, 'style');
        break;
    }

    requestAnimationFrame(() => {
      this.playAnimations();
    });
  }
 
  getDynamicStyle(item: Item): {color: string, backgroundColor: string} {
    const fontColor = this.getColor(item.color);
    return {
      color: fontColor,
      backgroundColor: item.color
    }
  }

  getColor(hexcode: string): string {
    const c = hexcode.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    if (luma < 100) {
      return 'white';
    } else {
      return 'black';
    }
  }

  goToDetailPage(itemId: number): void {
    this.router.navigate([URL.DETAIL + '/' + itemId]);
  }

  goToSection(fragment: string): void {
    const mode = this.sortModes.find((mode) => mode.isSelected);

    switch(mode?.name) {
      case Mode.CHRONOLOGICAL:
        this.router.navigate([URL.TIMELINE], { fragment }); 
        break;
      case Mode.ALPHABETICAL:
        this.router.navigate([URL.ALPHABETICAL], { fragment }); 
        break;
      case Mode.LOCATION:
        this.router.navigate([URL.LOCATION], { fragment }); 
        break;
      case Mode.PROGRAMMATIC:
        this.router.navigate([URL.PROGRAMMATIC], { fragment }); 
        break;
      case Mode.STYLE:
        this.router.navigate([URL.STYLE], { fragment }); 
        break;
    }
  }
  
}
