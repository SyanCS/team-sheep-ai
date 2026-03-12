import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Don't bundle these — they rely on dynamic worker paths, native binaries, or
  // dynamic requires that break when bundled by Next.js.
  serverExternalPackages: [
    '@huggingface/transformers',
    '@langchain/community',
    'langchain',
    'pdf-parse',
    'pdfjs-dist',
    'sharp',
  ],
}

export default nextConfig
