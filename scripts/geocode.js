import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '../src/assets/json/wonders.json');
const outputFile = path.join(__dirname, '../src/assets/json/wonders.with-coords.json');

async function geocodeLocation(location) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  console.log(`🌍 Geocoding: ${location}`);

  const res = await fetch(url, { headers: { 'User-Agent': 'WondersApp/1.0' } });
  const data = await res.json();

  return data.length > 0 ? { lat: data[0].lat, lon: data[0].lon } : null;
}

async function main() {
  const wonders = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

  for (let wonder of wonders) {
    const coords = await geocodeLocation(wonder.location);
    if (coords) {
      wonder.lat = coords.lat;
      wonder.lon = coords.lon;
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(wonders, null, 2));
  console.log(`✅ Saved with coordinates → ${outputFile}`);
}

main();
