import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers'

// Module-level singleton — the model loads once per Node.js process.
let embeddingsInstance: HuggingFaceTransformersEmbeddings | null = null

export function getEmbeddings(): HuggingFaceTransformersEmbeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new HuggingFaceTransformersEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2',
    })
  }
  return embeddingsInstance
}
