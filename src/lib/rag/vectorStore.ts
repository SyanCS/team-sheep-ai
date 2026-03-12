import { PGVectorStore, DistanceStrategy } from '@langchain/community/vectorstores/pgvector'
import { Pool } from 'pg'
import { getEmbeddings } from './embeddings'

let vectorStorePromise: Promise<PGVectorStore> | null = null

async function initVectorStore(): Promise<PGVectorStore> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

  const store = await PGVectorStore.initialize(getEmbeddings(), {
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

  return store
}

/**
 * Returns the shared PGVectorStore instance, initialising it (and creating
 * the underlying table) on the first call.
 */
export function getVectorStore(): Promise<PGVectorStore> {
  if (!vectorStorePromise) {
    vectorStorePromise = initVectorStore()
  }
  return vectorStorePromise
}
