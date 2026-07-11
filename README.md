# Architectural Wonders of the World

An Angular app for exploring notable architectural works through searchable data views, maps, charts, timelines, and lightweight games. The app is backed by local JSON datasets for wonders, building heights, landmark visits, and architectural style ranges.

## Features

- Explore 161 architectural wonders with grouped grids, detail pages, highlighted search, and wiki/image metadata.
- Browse by map, 3D globe, timeline, style, continent, alphabetical order, or building use.
- Compare landmark datasets with bar, pie, line, gallery, and choropleth chart views.
- Play through the `/games` hub: GeoGuesser, Recreate Timeline, Architecture Puzzle, and category quizzes.
- Use dark mode, loading states, scroll animations, and desktop-focused navigation.

## Tech Stack

Angular 20, TypeScript, SCSS, RxJS, Leaflet, globe.gl, D3, Chart.js/ng2-charts, Jest, Playwright, ESLint, and Prettier.

## Requirements

- Node.js `^20.19.0`, `^22.12.0`, or `>=24.0.0`
- npm

## Getting Started

```bash
npm install
npm start
```

Open `http://localhost:4200/`. Unknown routes redirect to `/home`.

## Scripts

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm start`             | Runs the Angular dev server.               |
| `npm run build`         | Builds the app into `dist/`.               |
| `npm test`              | Runs Jest unit tests.                      |
| `npm run e2e`           | Runs Playwright smoke tests.               |
| `npm run lint`          | Runs Angular ESLint.                       |
| `npm run format`        | Formats the project with Prettier.         |
| `npm run geocode`       | Generates coordinate-enriched wonder data. |
| `npm run test:coverage` | Runs Jest with coverage.                   |
| `npm run e2e:headed`    | Runs Playwright in a headed browser.       |

## Routes

| Route                        | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `/home`                      | Main interactive wonder grid.                          |
| `/detail/:id`                | Detail page for a selected wonder.                     |
| `/search?q=term`             | Search results for wonder names.                       |
| `/games`                     | Games hub.                                             |
| `/games/geoguesser`          | Map-based location guessing game with scoring.         |
| `/games/recreate-timeline`   | Drag-and-check architectural style timeline game.      |
| `/games/architecture-puzzle` | Image tile puzzle with selectable wonders and sizes.   |
| `/games/quiz`                | Quizzes for names, locations, styles, years, and uses. |
| `/map`                       | 2D Leaflet map with wonder markers.                    |
| `/globe`                     | 3D globe with clickable wonder pins.                   |
| `/timeline`                  | Chronological wonder timeline.                         |
| `/charts`                    | Tallest-building and landmark-visit dashboards.        |
| `/style`                     | Wonders grouped by architectural style.                |
| `/alphabetical`              | Wonders grouped alphabetically.                        |
| `/location`                  | Wonders grouped by continent.                          |
| `/programmatic`              | Wonders grouped by building use.                       |

## Project Structure

```text
src/
  app/
    features/       Route-level views, including the games hub and games
    services/       Data, loading, geolocation, and scroll services
    shared/         Reusable UI, pipes, directives, constants, and helpers
  assets/
    images/         Static image and SVG assets
    json/           Local app datasets
scripts/            Dataset enrichment helpers
public/             Public Angular assets
```

## Data

The app reads these local datasets through `DataService`:

| File                                    | Purpose                              |
| --------------------------------------- | ------------------------------------ |
| `src/assets/json/wonders.json`          | Main architectural wonders dataset.  |
| `src/assets/json/tallestBuildings.json` | Tallest buildings dataset.           |
| `src/assets/json/mostVisited.json`      | Most visited landmarks dataset.      |
| `src/assets/json/stylesTimeline.json`   | Architectural style timeline ranges. |

Helper scripts in `scripts/` can refresh coordinates, Wikipedia summaries, images, and colors. They call external APIs, so review generated files before replacing the active JSON datasets.

## Notes

- Some views depend on network-loaded assets such as OpenStreetMap tiles, external images, Wikipedia links, and globe textures.
- The layout currently shows a mobile message and is intended primarily for laptop or desktop viewing.
