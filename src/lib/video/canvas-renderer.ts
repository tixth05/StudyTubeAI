import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a text slide image using Canvas
 */
export async function generateTextSlide(
    text: string,
    width: number = 1920,
    height: number = 1080
): Promise<string> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#6C63FF');
    gradient.addColorStop(0.5, '#8B8BFF');
    gradient.addColorStop(1, '#F5F7FF');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap text
    const maxWidth = width - 200;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    // Draw lines
    const lineHeight = 90;
    const startY = (height - (lines.length * lineHeight)) / 2;

    lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + (index * lineHeight) + lineHeight / 2);
    });

    // Add subtle shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    // Save to file
    const tempDir = path.join(process.cwd(), 'temp', 'slides');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `slide-${Date.now()}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
}

/**
 * Generate multiple slides from scene data
 */
export async function generateSlides(scenes: Array<{ text: string }>): Promise<string[]> {
    const slidePaths: string[] = [];

    for (const scene of scenes) {
        const slidePath = await generateTextSlide(scene.text);
        slidePaths.push(slidePath);
    }

    return slidePaths;
}

/**
 * Clean up temporary slide files
 */
export function cleanupSlides(slidePaths: string[]): void {
    for (const slidePath of slidePaths) {
        try {
            if (fs.existsSync(slidePath)) {
                fs.unlinkSync(slidePath);
            }
        } catch (error) {
            console.error('Error cleaning up slide:', error);
        }
    }
}
