import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers'

// Module-level singleton — the model loads once per Node.js process and is
// reused for every subsequent call. This avoids the ~1s cold-start overhead
// on each request.
let extractor: FeatureExtractionPipeline | null = null

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return extractor
}

/**
 * Converts a text string into a 384-dimensional embedding vector.
 * Uses mean pooling + L2 normalization, which is the correct strategy
 * for sentence similarity with all-MiniLM-L6-v2.
 */
export async function embedText(text: string): Promise<number[]> {
  const model = await getExtractor()
  const result = await model(text, { pooling: 'mean', normalize: true })
  return Array.from(result.data as Float32Array)
}

/**
 * Embeds multiple texts sequentially. Batching is handled by the model
 * internally, but sequential calls share the same loaded model instance.
 */
export async function embedMany(texts: string[]): Promise<number[][]> {
  const model = await getExtractor()
  const results = await Promise.all(
    texts.map((text) => model(text, { pooling: 'mean', normalize: true }))
  )
  return results.map((r) => Array.from(r.data as Float32Array))
}
