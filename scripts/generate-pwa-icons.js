/**
 * Generates icon-192.png and icon-512.png (Kurpur logo) for PWA install icon.
 * Uses pngjs (pure JS, no native deps) so it runs on Windows.
 * Run: npm run generate-icons
 */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const publicDir = path.join(__dirname, "..", "public");
const sizes = [192, 512];

// Kurpur "K" path from logo.svg (viewBox 0 0 512 512), as polygon points [x,y]...
const K_POINTS = [
  [160, 120], [160, 392], [208, 392], [208, 264], [300, 392], [356, 392],
  [276, 256], [356, 120], [300, 120], [228, 236], [228, 120], [180, 120]
];

function pointInPolygon(px, py, points) {
  let inside = false;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i][0], yi = points[i][1];
    const xj = points[j][0], yj = points[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function createIcon(size) {
  const scale = size / 512;
  const kScaled = K_POINTS.map(([x, y]) => [x * scale, y * scale]);
  const png = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const isK = pointInPolygon(x, y, kScaled);
      if (isK) {
        png.data[idx] = 255;     // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 255; // B
        png.data[idx + 3] = 255; // A
      } else {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 255;
      }
    }
  }

  return png;
}

function writePngSync(png, filePath) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
}

sizes.forEach((size) => {
  const outPath = path.join(publicDir, `icon-${size}.png`);
  const png = createIcon(size);
  writePngSync(png, outPath);
  console.log("Created", outPath);
});
