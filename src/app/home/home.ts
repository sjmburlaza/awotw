import { AfterViewInit, Component, ElementRef, inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Loader } from '../shared/components/loader/loader';
import { groupByYearBuilt } from '../shared/utils-helper';

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
    private router: Router
  ) {}

  ngOnInit() {
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => {
      this.data = res;
      this.groups = this.groupByAttribute(this.data, 'style');
      this.isLoading = false;
    });
  }

  ngAfterViewInit() {
    this.capturePositions();
  }

  private capturePositions() {
    this.positions.clear();
    this.animatedItems.forEach((el, i) => {
      const rect = el.nativeElement.getBoundingClientRect();
      this.positions.set(this.data[i].id, rect);
    });
  }

  private playAnimations() {
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

  sortAlphabetical(data: Item[], attribute: keyof Item): Item[] {
    return data.sort((a, b) => {
      const keyA = String(a[attribute]);
      const keyB = String(b[attribute]);
      return keyA.localeCompare(keyB);
    });
  }

  updateSelectedMode(selectedMode: {name: string; isSelected: boolean}) {
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
        this.sortAlphabetical(items, 'name');
        this.groups = this.groupByAttribute(items, 'name');
        break;
      case Mode.CHRONOLOGICAL:
        this.groups = groupByYearBuilt(items);
        break;
      case Mode.LOCATION:
        this.sortAlphabetical(items, 'continent');
        this.groups = this.groupByAttribute(items, 'continent');
        break;
      case Mode.PROGRAMMATIC:
        this.sortAlphabetical(items, 'buildingType');
        this.groups = this.groupByAttribute(items, 'buildingType');
        break;
      case Mode.STYLE:
        this.groups = this.groupByAttribute(items, 'style');
        break;
    }

    requestAnimationFrame(() => {
      this.playAnimations();
    });
  }

  groupByAttribute(data: Item[], attribute: keyof Item): Group[] {
    const map = new Map<string, Item[]>();

    for (const item of data) {
      const groupkey = attribute === 'name' ? String(item[attribute][0]) :  String(item[attribute]);

      if (!map.has(groupkey)) {
        map.set(groupkey, []);
      }
      map.get(groupkey)!.push(item);
    }

    return Array.from(map.entries()).map(([groupName, items]) => ({
      groupName,
      items
    }));
  }
 
  getDynamicStyle(item: Item) {
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
    this.router.navigate(['/detail/' + itemId]);
  }
  
}
