/** @type {import('next').NextConfig} */
const nextConfig = {
    // Prevent native Node.js packages from being bundled for the browser/edge
    serverExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg', 'sharp', 'msedge-tts'],
};

module.exports = nextConfig;
