import { Component, ElementRef, inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { animate, animateChild, AnimationBuilder, query, style, transition, trigger } from '@angular/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

enum Mode {
  ALPHABETICAL = 'ALPHABETICAL',
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  LOCATION = 'LOCATION',
  PROGRAMMATIC = 'PROGRAMMATIC',
  STYLE = 'STYLE'
}

@Component({
  selector: 'app-home',
  imports: [CommonModule,],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  @ViewChildren('animatedItem', { read: ElementRef })
  animatedItems!: QueryList<ElementRef<HTMLLIElement>>;

  private positions = new Map<number, DOMRect>();

  sortModes = [
    Mode.ALPHABETICAL,
    Mode.CHRONOLOGICAL,
    Mode.LOCATION,
    Mode.PROGRAMMATIC,
    Mode.STYLE
  ];
  data: Item[] = [];
  groups: Group[] = [];

  constructor(
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => {
      this.data = res;
      this.groups = this.groupByAttribute(this.data, 'style');
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

  sort(mode: string) {
    this.capturePositions();
    const items = [...this.data];

    switch(mode) {
      case Mode.ALPHABETICAL:
        this.sortAlphabetical(items, 'name');
        this.groups = this.groupByAttribute(items, 'name');
        break;
      case Mode.CHRONOLOGICAL:
        // sorted = this.chronologicalSort(this.data);
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

  chronologicalSort(data: Item[]) {

  }
  
}
