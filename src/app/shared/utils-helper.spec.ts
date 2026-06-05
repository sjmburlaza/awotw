import { Item } from '../services/data.service';
import { SortMode } from './constants/sort-mode.const';
import {
  groupByAttribute,
  groupByYearBuilt,
  groupWondersBySortMode,
  ordinalSuffix,
  sortAlphabetical,
  sortMapObject,
  sortWondersByMode,
} from './utils-helper';

const wonder = (overrides: Partial<Item>): Item => ({
  id: 0,
  name: 'Default Wonder',
  yearBuilt: '1900',
  style: 'Modern',
  buildingType: 'Museum',
  location: 'Default City, Default Country',
  continent: 'Europe',
  descriptionURL: '',
  imageURL: '',
  codename: 'default',
  color: '#000000',
  ...overrides,
});

describe('utils-helper', () => {
  const wonders = [
    wonder({
      id: 1,
      name: 'Beta Tower',
      yearBuilt: '2001',
      buildingType: 'Tower',
      continent: 'Asia',
      style: 'Futurist',
    }),
    wonder({
      id: 2,
      name: 'Alpha Gate',
      yearBuilt: '0450BC',
      buildingType: 'Gate',
      continent: 'Europe',
      style: 'Ancient',
    }),
    wonder({
      id: 3,
      name: 'Gamma Hall',
      yearBuilt: '1999',
      buildingType: 'Hall',
      continent: 'Europe',
      style: 'Modern',
    }),
  ];

  it('sorts wonders alphabetically by a selected attribute', () => {
    const result = sortAlphabetical([...wonders], 'name');

    expect(result.map((item) => item.name)).toEqual(['Alpha Gate', 'Beta Tower', 'Gamma Hall']);
  });

  it('groups names by their first letter', () => {
    const result = groupByAttribute(wonders, 'name');

    expect(result).toEqual([
      { groupName: 'B', items: [wonders[0]] },
      { groupName: 'A', items: [wonders[1]] },
      { groupName: 'G', items: [wonders[2]] },
    ]);
  });

  it('keeps BC items first when grouping chronologically', () => {
    const result = groupByYearBuilt(wonders);

    expect(result.map((group) => group.groupName)).toEqual(['BC', '1900s', '2000s']);
    expect(result[0].items).toEqual([wonders[1]]);
  });

  it('splits large 1900s chronological groups into two buckets', () => {
    const twentiethCenturyWonders = Array.from({ length: 14 }, (_, index) =>
      wonder({
        id: index,
        name: `Wonder ${String(index).padStart(2, '0')}`,
        yearBuilt: `19${String(index).padStart(2, '0')}`,
      }),
    );

    const result = groupByYearBuilt(twentiethCenturyWonders);

    expect(result.map((group) => group.groupName)).toEqual(['BC', '1900s-a', '1900s-b']);
    expect(result.find((group) => group.groupName === '1900s-a')?.items).toHaveLength(13);
    expect(result.find((group) => group.groupName === '1900s-b')?.items).toHaveLength(1);
  });

  it('groups wonders according to the selected sort mode', () => {
    const result = groupWondersBySortMode(wonders, SortMode.LOCATION);

    expect(result.map((group) => group.groupName)).toEqual(['Asia', 'Europe']);
    expect(result[1].items.map((item) => item.name)).toEqual(['Alpha Gate', 'Gamma Hall']);
  });

  it('flattens sorted groups for the selected mode', () => {
    const result = sortWondersByMode(wonders, SortMode.PROGRAMMATIC);

    expect(result.map((item) => item.buildingType)).toEqual(['Gate', 'Hall', 'Tower']);
  });

  it('sorts maps by descending numeric values', () => {
    const result = sortMapObject(
      new Map([
        ['A', 1],
        ['B', 3],
        ['C', 2],
      ]),
    );

    expect([...result.entries()]).toEqual([
      ['B', 3],
      ['C', 2],
      ['A', 1],
    ]);
  });

  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [21, '21st'],
  ])('formats %i with an ordinal suffix', (value, expected) => {
    expect(ordinalSuffix(value)).toBe(expected);
  });
});
