import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

const WIDTH = 1280;
const HEIGHT = 720;

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        if ((current + ' ' + word).trim().length <= maxCharsPerLine) {
            current = (current + ' ' + word).trim();
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines.slice(0, 4); // Max 4 lines per slide
}

function buildSlideSVG(sceneText: string, slideNumber: number, total: number): string {
    const title = `Scene ${slideNumber} of ${total}`;
    const bodyLines = wrapText(escapeXml(sceneText), 52);
    const lineHeight = 52;
    const startY = HEIGHT / 2 - (bodyLines.length * lineHeight) / 2 + 10;

    const textElements = bodyLines
        .map((line, i) => `<text x="640" y="${startY + i * lineHeight}" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle" opacity="0.95">${line}</text>`)
        .join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0533;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2d1b69;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a0533;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6C63FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B8BFF;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- Top accent bar -->
  <rect x="0" y="0" width="${WIDTH}" height="6" fill="url(#accent)" />
  <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="url(#accent)" />

  <!-- Scene number badge -->
  <rect x="60" y="50" width="200" height="44" rx="22" fill="url(#accent)" opacity="0.8" />
  <text x="160" y="78" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(title)}</text>

  <!-- Decorative circle -->
  <circle cx="640" cy="140" r="60" fill="#6C63FF" opacity="0.15" />
  <circle cx="640" cy="140" r="40" fill="#6C63FF" opacity="0.2" />
  <circle cx="640" cy="140" r="22" fill="#6C63FF" opacity="0.6" />

  <!-- Body text -->
  ${textElements}

  <!-- Progress dots -->
  ${Array.from({ length: total }, (_, i) => `<circle cx="${WIDTH / 2 - ((total - 1) * 20) / 2 + i * 20}" cy="${HEIGHT - 40}" r="6" fill="${i === slideNumber - 1 ? '#8B8BFF' : 'rgba(255,255,255,0.3)'}" />`).join('\n  ')}
</svg>`;
}

export async function generateSlides(scenes: string[], outputDir: string): Promise<string[]> {
    const slidePaths: string[] = [];
    const total = Math.min(scenes.length, 5);

    for (let i = 0; i < total; i++) {
        const svgContent = buildSlideSVG(scenes[i], i + 1, total);
        const outputPath = path.join(outputDir, `slide-${i}.png`);

        await sharp(Buffer.from(svgContent))
            .png()
            .toFile(outputPath);

        slidePaths.push(outputPath);
        console.log(`[Slides] Generated slide ${i + 1}/${total}`);
    }

    return slidePaths;
}
