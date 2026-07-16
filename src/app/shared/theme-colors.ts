export interface ThemeColors {
  text: string;
  muted: string;
  axis: string;
  grid: string;
  surface: string;
  tooltipBackground: string;
  tooltipText: string;
  tooltipBorder: string;
  tooltipShadow: string;
  cursor: string;
  boundary: string;
  mapStroke: string;
  choroplethScale: string[];
  lineFill: string;
  lineStroke: string;
  linePoint: string;
  chartLabel: string;
  chartFallback: string;
  categoryPalette: string[];
  pinPrimary: string;
  pinFallback: string;
  pinShadow: string;
  puzzleGridLine: string;
  puzzleFocus: string;
  selected: string;
  globeMarkerGlow: string;
  onDark: string;
  onLight: string;
}

export const COLOR_VARS = {
  text: '--app-text',
  muted: '--app-muted',
  axis: '--app-axis',
  grid: '--app-grid',
  surface: '--app-surface',
  tooltipBackground: '--app-tooltip-bg',
  tooltipText: '--app-tooltip-text',
  tooltipBorder: '--app-tooltip-border',
  tooltipShadow: '--app-tooltip-shadow',
  cursor: '--app-cursor',
  boundary: '--app-boundary',
  mapStroke: '--app-map-stroke',
  lineFill: '--app-chart-line-fill',
  lineStroke: '--app-chart-line-stroke',
  linePoint: '--app-chart-line-point',
  chartLabel: '--app-chart-label',
  chartFallback: '--app-chart-fallback',
  pinPrimary: '--app-pin-primary',
  pinFallback: '--app-pin-fallback',
  pinShadow: '--app-pin-shadow',
  puzzleGridLine: '--app-puzzle-grid-line',
  puzzleFocus: '--app-warning-focus',
  selected: '--app-selected',
  globeMarkerGlow: '--app-globe-marker-glow',
  onDark: '--app-on-dark',
  onLight: '--app-on-light',
  gameGeoguesser: '--app-game-geoguesser',
  gameTimeline: '--app-game-timeline',
  gamePuzzle: '--app-game-puzzle',
  gameQuiz: '--app-game-quiz',
  gameQuizLocation: '--app-game-quiz-location',
  gameWorldTour: '--app-game-world-tour',
  gameTallest: '--app-game-tallest',
  category1: '--app-category-1',
  category2: '--app-category-2',
  category3: '--app-category-3',
  category4: '--app-category-4',
  category5: '--app-category-5',
  category6: '--app-category-6',
  category7: '--app-category-7',
} as const;

const CHOROPLETH_COLOR_VARS = [
  '--app-map-empty',
  '--app-map-low',
  '--app-map-mid-low',
  '--app-map-mid',
  '--app-map-mid-high',
  '--app-map-high',
] as const;

const CATEGORY_COLOR_VARS = [
  '--app-category-1',
  '--app-category-2',
  '--app-category-3',
  '--app-category-4',
  '--app-category-5',
  '--app-category-6',
  '--app-category-7',
  '--app-category-8',
] as const;

export type CssColorVariable = (typeof COLOR_VARS)[keyof typeof COLOR_VARS];

export function isDarkModeEnabled(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains('dark-mode');
}

export function cssVar(variableName: CssColorVariable): string {
  return `var(${variableName})`;
}

export function getCssColor(variableName: string): string {
  if (typeof document === 'undefined') {
    return `var(${variableName})`;
  }

  const bodyValue = getComputedStyle(document.body).getPropertyValue(variableName).trim();
  if (bodyValue) return bodyValue;

  const rootValue = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return rootValue || `var(${variableName})`;
}

export function getThemeColors(): ThemeColors {
  return {
    text: getCssColor(COLOR_VARS.text),
    muted: getCssColor(COLOR_VARS.muted),
    axis: getCssColor(COLOR_VARS.axis),
    grid: getCssColor(COLOR_VARS.grid),
    surface: getCssColor(COLOR_VARS.surface),
    tooltipBackground: getCssColor(COLOR_VARS.tooltipBackground),
    tooltipText: getCssColor(COLOR_VARS.tooltipText),
    tooltipBorder: getCssColor(COLOR_VARS.tooltipBorder),
    tooltipShadow: getCssColor(COLOR_VARS.tooltipShadow),
    cursor: getCssColor(COLOR_VARS.cursor),
    boundary: getCssColor(COLOR_VARS.boundary),
    mapStroke: getCssColor(COLOR_VARS.mapStroke),
    choroplethScale: CHOROPLETH_COLOR_VARS.map(getCssColor),
    lineFill: getCssColor(COLOR_VARS.lineFill),
    lineStroke: getCssColor(COLOR_VARS.lineStroke),
    linePoint: getCssColor(COLOR_VARS.linePoint),
    chartLabel: getCssColor(COLOR_VARS.chartLabel),
    chartFallback: getCssColor(COLOR_VARS.chartFallback),
    categoryPalette: CATEGORY_COLOR_VARS.map(getCssColor),
    pinPrimary: getCssColor(COLOR_VARS.pinPrimary),
    pinFallback: getCssColor(COLOR_VARS.pinFallback),
    pinShadow: getCssColor(COLOR_VARS.pinShadow),
    puzzleGridLine: getCssColor(COLOR_VARS.puzzleGridLine),
    puzzleFocus: getCssColor(COLOR_VARS.puzzleFocus),
    selected: getCssColor(COLOR_VARS.selected),
    globeMarkerGlow: getCssColor(COLOR_VARS.globeMarkerGlow),
    onDark: getCssColor(COLOR_VARS.onDark),
    onLight: getCssColor(COLOR_VARS.onLight),
  };
}
