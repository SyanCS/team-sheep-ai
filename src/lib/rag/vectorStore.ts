import { PGVectorStore, DistanceStrategy } from '@langchain/community/vectorstores/pgvector'
import { pool } from '@/lib/db'
import { getEmbeddings } from './embeddings'

let vectorStorePromise: Promise<PGVectorStore> | null = null

async function initVectorStore(): Promise<PGVectorStore> {
  return PGVectorStore.initialize(getEmbeddings(), {
    pool,
    tableName: 'langchain_chunks',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
    },
    distanceStrategy: 'cosine' as DistanceStrategy,
  })
}

/**
 * Returns the shared PGVectorStore instance, initialising it on the first call.
 * On failure the promise is cleared so the next call retries instead of
 * returning a permanently-rejected promise.
 */
export function getVectorStore(): Promise<PGVectorStore> {
  if (!vectorStorePromise) {
    vectorStorePromise = initVectorStore().catch((err) => {
      vectorStorePromise = null
      throw err
    })
  }
  return vectorStorePromise
}
