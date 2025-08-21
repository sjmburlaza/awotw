import { Group, Item } from "../services/data.service";

export function groupByYearBuilt(data: Item[]): Group[] {
  const BC: Item[] = [];
  const AD: Item[] = [];

  for (const item of data) {
    if (item.yearBuilt.endsWith("C")) {
      BC.push(item);
    } else {
      AD.push(item);
    }
  }

  const map = new Map<string, Item[]>();
  for (const item of AD) {
    const year = item.yearBuilt.split("-")[0].padStart(4, "0");
    const century = year.substring(0, 2) + "00s";

    if (!map.has(century)) {
      map.set(century, []);
    }
    map.get(century)!.push(item);
  }

  let groups: Group[] = [
    { groupName: "BC", items: BC },
    ...Array.from(map.entries()).map(([groupName, items]) => ({
      groupName,
      items,
    })),
  ];

  const idx1900s = groups.findIndex((g) => g.groupName === "1900s");
  if (idx1900s !== -1) {
    const items = groups[idx1900s].items;
    const partA = items.slice(0, 13);
    const partB = items.slice(13, 26);

    groups[idx1900s] = { groupName: "1900s-a", items: partA };

    groups.splice(idx1900s + 1, 0, { groupName: "1900s-b", items: partB });
  }

  const bcGroup = groups.shift();
  groups.sort((a, b) => a.groupName.localeCompare(b.groupName));

  return bcGroup ? [bcGroup, ...groups] : groups;
}
