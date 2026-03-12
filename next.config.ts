import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @xenova/transformers uses native Node.js modules (onnxruntime-node)
  // that must not be bundled by webpack — they load as external binaries.
  serverExternalPackages: ['@xenova/transformers', 'sharp'],
}

export default nextConfig
