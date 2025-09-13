import fetch from 'node-fetch';
import fs from 'fs';

// Load JSON file
const buildings = JSON.parse(
  fs.readFileSync(new URL('./mostVisited.json', import.meta.url), 'utf-8'),
);

// Function to fetch image from Wikidata
async function getWikidataImage(name) {
  // Step 1: Search for the entity by name
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    name,
  )}&language=en&format=json&limit=1`;

  try {
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchData.search.length) return null;

    const entityId = searchData.search[0].id;

    // Step 2: Get entity data (to extract P18 image)
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
    const entityRes = await fetch(entityUrl);
    const entityData = await entityRes.json();

    const entity = entityData.entities[entityId];
    const imageName = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!imageName) return null;

    // Step 3: Build image URL
    const cleanName = imageName.replace(/ /g, '_');
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${cleanName}`;
  } catch (err) {
    console.error('Error fetching Wikidata image:', name, err);
    return null;
  }
}

async function addImages() {
  for (let item of buildings) {
    let image = await getWikidataImage(item.name);

    // fallback: try "Building, City"
    if (!image) {
      image = await getWikidataImage(`${item.name}, ${item.city}`);
    }

    item.image_url = image || 'NO_IMAGE_FOUND';
    console.log(`✔ ${item.name} → ${item.image_url}`);
  }

  fs.writeFileSync('./buildings_with_images.json', JSON.stringify(buildings, null, 2));
}

addImages();
