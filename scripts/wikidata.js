import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '../src/assets/json/wonders.json');
const outputFile = path.join(__dirname, '../src/assets/json/wonders.wiki.json');

/**
 * Fetch short summary/description from Wikipedia REST API
 */
async function getWikiSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  return {
    title: data.title,
    description: data.description || "",
    extract: data.extract || "",
    wikipedia: data.content_urls?.desktop?.page || ""
  };
}

/**
 * Fetch description from Wikidata EntityData API
 */
async function getWikidataDescription(title) {
  // First, search for the entity ID
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=${encodeURIComponent(
    title
  )}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.search || searchData.search.length === 0) return null;

  const entityId = searchData.search[0].id;

  // Get full entity data
  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
  const entityRes = await fetch(entityUrl);
  const entityData = await entityRes.json();

  const entity = entityData.entities[entityId];
  return {
    title: entity.labels.en?.value || title,
    description: entity.descriptions.en?.value || "",
    extract: "", // Wikidata doesn’t provide extracts
    wikipedia: entity.sitelinks?.enwiki?.url || ""
  };
}

/**
 * Main script
 */
async function enrichData() {
  const wonders = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  const enriched = [];

  for (const wonder of wonders) {
    console.log(`🔍 Fetching data for: ${wonder.name}...`);

    let wikiData = await getWikiSummary(wonder.name);

    if (!wikiData) {
      console.log(`⚠️ Wikipedia not found, falling back to Wikidata for: ${wonder.name}`);
      wikiData = await getWikidataDescription(wonder.name);
    }

    enriched.push({
      ...wonder,
      wiki: wikiData
    });

    // small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync(outputFile, JSON.stringify(enriched, null, 2));
  console.log(`✅ Enriched data saved to ${outputFile}`);
}

enrichData().catch(err => console.error(err));
