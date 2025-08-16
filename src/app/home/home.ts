import { Component, inject, OnInit } from '@angular/core';
import { DataService, Group, Item } from '../services/data.service';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

enum Mode {
  ALPHABETICAL = 'ALPHABETICAL',
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  LOCATION = 'LOCATION',
  PROGRAMMATIC = 'PROGRAMMATIC',
  STYLE = 'STYLE'
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  sortModes = [
    Mode.ALPHABETICAL,
    Mode.CHRONOLOGICAL,
    Mode.LOCATION,
    Mode.PROGRAMMATIC,
    Mode.STYLE
  ];
  data!: Item[];
  // sortedByMode!: Mode[];
  groups: Group[] = [];

  constructor(
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => {
      this.data = this.sortInitial(res);
    });
  }

  sortInitial(data: Item[]): Item[] {
    return data.sort((a, b) => a.name.localeCompare(b.name));
  }

  sort(mode: string) {
    if (!mode) return;

    switch(mode) {
      case Mode.ALPHABETICAL:
        this.alphabeticalSort(this.data);
        break;
      case Mode.CHRONOLOGICAL:
        this.chronologicalSort(this.data);
        break;
    }
  }

  alphabeticalSort(data: Item[]) {
    const sorted = [];
    
  }

  chronologicalSort(data: Item[]) {

  }

  locationSort() {

  }

  programmaticSort() {

  }

  styleSort() {

  }
  
}
