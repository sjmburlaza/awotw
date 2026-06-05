# Architectural Wonders of the World

An Angular data-visualization app for exploring notable architectural works across history. The app combines a sortable wonder index, detail pages, search, quiz interactions, map and globe views, timelines, and chart dashboards backed by local JSON datasets.

## Features

- Interactive home grid of architectural wonders grouped by style, year, location, use, or alphabetical order.
- Detail pages with images, location metadata, Wikipedia links, and enriched wiki excerpts.
- Search page with highlighted matches and relevance sorting.
- Quiz mode for testing names, locations, styles, years built, and building uses.
- Leaflet map view with colored markers and popups for wonders with coordinates.
- 3D globe view with clickable wonder pins and focused camera movement.
- Timeline and grouping views for chronological, style, continent, alphabetical, and use-based exploration.
- Charts dashboard for tallest buildings and most visited landmarks, including bar charts, pie charts, line trends, image galleries, and a global choropleth.
- Dark mode toggle and animated navigation states.

## Tech Stack

- Angular 20
- TypeScript
- SCSS
- RxJS
- Leaflet
- globe.gl
- D3
- Chart.js and ng2-charts
- ESLint and Prettier for code quality

## Requirements

- Node.js `^20.19.0`, `^22.12.0`, or `>=24.0.0`
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm start
```

Open the app at:

```text
http://localhost:4200/
```

The app redirects unknown routes to `/home`.

## Available Scripts

```bash
npm start
```

Runs the Angular development server.

```bash
npm run build
```

Builds the app into the `dist/` directory.

```bash
npm test
```

Runs unit tests with Jest.

```bash
npm run e2e
```

Runs Playwright end-to-end smoke tests for the main app flows.

```bash
npm run lint
```

Runs Angular ESLint over TypeScript and template files.

```bash
npm run format
```

Formats the project with Prettier.

```bash
npm run geocode
```

Generates `src/assets/json/wonders.with-coords.json` by looking up coordinates for each wonder location through OpenStreetMap Nominatim.

## App Routes

| Route            | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `/home`          | Main interactive wonder grid.                                    |
| `/detail/:id`    | Detail page for a selected wonder.                               |
| `/search?q=term` | Search results for wonder names.                                 |
| `/quiz`          | Quiz mode.                                                       |
| `/map`           | 2D Leaflet map with wonder markers.                              |
| `/globe`         | 3D globe with wonder markers.                                    |
| `/timeline`      | Chronological wonder timeline.                                   |
| `/charts`        | Data dashboard for tallest buildings and most visited landmarks. |
| `/style`         | Wonders grouped by architectural style.                          |
| `/alphabetical`  | Wonders grouped alphabetically.                                  |
| `/location`      | Wonders grouped by continent.                                    |
| `/programmatic`  | Wonders grouped by building use.                                 |

## Project Structure

```text
src/
  app/
    features/              Feature pages and route-level components
    services/              Shared data, loading, geolocation, and scroll services
    shared/
      components/          Reusable chart, map, tooltip, gallery, loader, and grouping UI
      constants/           Route constants
      directives/          Scroll animation directives
      pipes/               Display and highlight pipes
      utils-helper.ts      Grouping, sorting, and formatting helpers
  assets/
    images/                Static images and SVG assets
    json/                  Local datasets used by the app
scripts/                   Data enrichment and geocoding scripts
public/                    Public Angular assets
```

## Data Sources

The app reads local JSON files through `DataService`:

| File                                    | Purpose                                                     |
| --------------------------------------- | ----------------------------------------------------------- |
| `src/assets/json/wonders.json`          | Main list of 161 architectural wonders.                     |
| `src/assets/json/tallestBuildings.json` | Top 50 tallest buildings dataset.                           |
| `src/assets/json/mostVisited.json`      | Top 50 most visited landmarks dataset.                      |
| `src/assets/json/stylesTimeline.json`   | Architectural style ranges used by timeline visualizations. |

Main wonder entries include fields such as:

```ts
{
  id: number;
  name: string;
  yearBuilt: string;
  style: string;
  buildingType: string;
  location: string;
  continent: string;
  descriptionURL: string;
  imageURL: string;
  codename: string;
  color: string;
  lat?: string;
  lon?: string;
  wiki?: {
    title?: string;
    description?: string;
    extract?: string;
    wikipedia?: string;
  };
}
```

## Data Maintenance

The repository includes helper scripts for enriching the main wonders dataset:

- `scripts/geocode.js` reads `wonders.json`, fetches latitude and longitude values from OpenStreetMap Nominatim, and writes `wonders.with-coords.json`.
- `scripts/wikidata.js` reads `wonders.json`, fetches summary metadata from Wikipedia with a Wikidata fallback, and writes `wonders.wiki.json`.

These scripts call external APIs, so run them only when you need to refresh or expand the dataset. Review generated files before replacing the active `wonders.json`.

## Notes

- Some visual features depend on network-loaded assets, including OpenStreetMap tiles, external wonder images, Wikipedia links, and globe textures from `unpkg.com`.
- The current app layout displays a mobile message and is intended primarily for laptop or desktop viewing.
- Production builds use Angular's default production configuration and output to `dist/`.
