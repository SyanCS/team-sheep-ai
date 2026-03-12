import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Don't bundle these — they rely on dynamic worker paths that break when bundled.
  serverExternalPackages: ['@xenova/transformers', 'sharp', 'pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
