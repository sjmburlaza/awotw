type Accessor<T> = (value: T) => number;

interface SelectionChain {
  append: () => SelectionChain;
  attr: () => SelectionChain;
  call: (callback?: ((value: SelectionChain) => void) | unknown) => SelectionChain;
  data: () => SelectionChain;
  domain: () => SelectionChain;
  duration: () => SelectionChain;
  each: () => SelectionChain;
  enter: () => SelectionChain;
  html: () => SelectionChain;
  join: () => SelectionChain;
  lower: () => SelectionChain;
  node: () => null;
  on: () => SelectionChain;
  padding: () => SelectionChain;
  range: () => SelectionChain;
  remove: () => SelectionChain;
  select: () => SelectionChain;
  selectAll: () => SelectionChain;
  style: () => SelectionChain;
  text: () => SelectionChain;
  tickFormat: () => SelectionChain;
  tickValues: () => SelectionChain;
  transition: () => SelectionChain;
}

const chain: SelectionChain = {
  append: () => chain,
  attr: () => chain,
  call: (callback) => {
    if (typeof callback === 'function') {
      callback(chain);
    }
    return chain;
  },
  data: () => chain,
  domain: () => chain,
  duration: () => chain,
  each: () => chain,
  enter: () => chain,
  html: () => chain,
  join: () => chain,
  lower: () => chain,
  node: () => null,
  on: () => chain,
  padding: () => chain,
  range: () => chain,
  remove: () => chain,
  select: () => chain,
  selectAll: () => chain,
  style: () => chain,
  text: () => chain,
  tickFormat: () => chain,
  tickValues: () => chain,
  transition: () => chain,
};

const linearScale = ((value: number) => value) as ((value: number) => number) & {
  domain: () => typeof linearScale;
  range: () => typeof linearScale;
};
linearScale.domain = () => linearScale;
linearScale.range = () => linearScale;

const bandScale = ((value: string) => (value ? 0 : undefined)) as ((value: string) => number) & {
  bandwidth: () => number;
  domain: () => typeof bandScale;
  padding: () => typeof bandScale;
  range: () => typeof bandScale;
};
bandScale.bandwidth = () => 20;
bandScale.domain = () => bandScale;
bandScale.padding = () => bandScale;
bandScale.range = () => bandScale;

export const select = () => chain;
export const scaleLinear = () => linearScale;
export const scaleBand = () => bandScale;
export const axisBottom = () => chain;
export const axisLeft = () => chain;
export const axisTop = () => chain;
export const pointer = () => [0, 0] as [number, number];
export const color = (value: string) => ({
  darker: () => ({
    toString: () => value,
  }),
});

export function min<T>(items: T[], accessor: Accessor<T>): number | undefined {
  return items.length ? Math.min(...items.map(accessor)) : undefined;
}

export function max<T>(items: T[], accessor: Accessor<T>): number | undefined {
  return items.length ? Math.max(...items.map(accessor)) : undefined;
}
