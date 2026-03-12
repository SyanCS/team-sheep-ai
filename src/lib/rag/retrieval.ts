import { cosineDistance, desc, gt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documentChunks, documents } from '@/lib/db/schema'
import { embedText } from './embeddings'

export interface RetrievedChunk {
  content: string
  similarity: number
  documentName: string
  chunkIndex: number
}

/**
 * Finds the most semantically relevant chunks for a given query.
 *
 * Flow:
 * 1. Embed the query using the same model used during ingestion
 * 2. Use pgvector's cosine distance operator (<=> ) to rank all stored chunks
 * 3. Return the top-k results above a minimum similarity threshold
 */
export async function retrieveRelevantChunks(
  query: string,
  topK = 5,
  minSimilarity = 0.3
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query)

  // `1 - cosineDistance` converts distance (0=identical, 2=opposite)
  // into similarity (1=identical, -1=opposite). Values above 0.3 are
  // generally considered semantically related for MiniLM.
  const similarity = sql<number>`1 - (${cosineDistance(documentChunks.embedding, queryEmbedding)})`

  const rows = await db
    .select({
      content: documentChunks.content,
      similarity,
      documentName: documents.name,
      chunkIndex: documentChunks.chunkIndex,
    })
    .from(documentChunks)
    .innerJoin(documents, sql`${documentChunks.documentId} = ${documents.id}`)
    .where(gt(similarity, minSimilarity))
    .orderBy(desc(similarity))
    .limit(topK)

  return rows
}

/**
 * Formats retrieved chunks into a context block ready to be injected
 * into the LLM system prompt.
 */
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant knowledge found in the uploaded documents.'
  }

  return chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.documentName}]\n${chunk.content}`
    )
    .join('\n\n---\n\n')
}
