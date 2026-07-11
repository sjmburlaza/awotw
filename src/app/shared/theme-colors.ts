export interface ThemeColors {
  text: string;
  muted: string;
  axis: string;
  grid: string;
  surface: string;
  tooltipBackground: string;
  tooltipText: string;
  cursor: string;
  boundary: string;
  mapStroke: string;
}

const lightTheme: ThemeColors = {
  text: '#222222',
  muted: '#6b7280',
  axis: '#6b7280',
  grid: '#e5e7eb',
  surface: '#ffffff',
  tooltipBackground: '#111827',
  tooltipText: '#ffffff',
  cursor: '#9ca3af',
  boundary: '#dc2626',
  mapStroke: '#ffffff',
};

const darkTheme: ThemeColors = {
  text: '#e8ddd6',
  muted: '#d8cfc8',
  axis: '#b8adaf',
  grid: '#3f3a40',
  surface: '#2d2d31',
  tooltipBackground: '#e8ddd6',
  tooltipText: '#222222',
  cursor: '#d8cfc8',
  boundary: '#ff8fa3',
  mapStroke: '#2d2d31',
};

export function isDarkModeEnabled(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains('dark-mode');
}

export function getThemeColors(): ThemeColors {
  return isDarkModeEnabled() ? darkTheme : lightTheme;
}
