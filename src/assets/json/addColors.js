import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "mostVisited.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));


function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Generate pastel hex color
function getPastelHexColor() {
  const h = Math.floor(Math.random() * 360); // full spectrum
  const s = 60 + Math.random() * 20;         // ~60–80% saturation
  const l = 75 + Math.random() * 10;         // ~75–85% lightness
  return hslToHex(h, s, l);
}

const updatedData = data.map((item) => ({
  ...item,
  color: getPastelHexColor(),
}));

const outPath = path.join(__dirname, "landmarks_with_colors.json");
fs.writeFileSync(outPath, JSON.stringify(updatedData, null, 2), "utf8");

console.log("✅ Colors added! File saved to", outPath);
