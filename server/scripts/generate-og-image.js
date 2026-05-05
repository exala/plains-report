// Run this script once to generate the OG image:
// npm install canvas --workspace=server
// node server/scripts/generate-og-image.js
//
// Output: client/public/og-image.png
// Size: 1200x630px

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const WIDTH = 1200;
const HEIGHT = 630;
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// Auburn orange background
ctx.fillStyle = '#E87722';
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Dark overlay for depth
ctx.fillStyle = 'rgba(10, 15, 26, 0.35)';
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Subtle grain texture
for (let i = 0; i < 8000; i++) {
  const x = Math.random() * WIDTH;
  const y = Math.random() * HEIGHT;
  ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
  ctx.fillRect(x, y, 1, 1);
}

// Orange rule lines
ctx.fillStyle = 'rgba(255,255,255,0.15)';
ctx.fillRect(80, 220, WIDTH - 160, 2);
ctx.fillRect(80, 420, WIDTH - 160, 2);

// Main title
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 88px serif';
ctx.textAlign = 'center';
ctx.fillText('THE PLAINS REPORT', WIDTH / 2, 340);

// Tagline
ctx.fillStyle = 'rgba(255,255,255,0.75)';
ctx.font = '32px serif';
ctx.fillText('Auburn Football Intelligence — Delivered by Easy Earl', WIDTH / 2, 400);

const outputPath = path.join(__dirname, '../../client/public/og-image.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);
console.log(`OG image written to ${outputPath}`);
