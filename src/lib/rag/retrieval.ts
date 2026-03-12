import { getVectorStore } from './vectorStore'

export interface RetrievedChunk {
  content: string
  similarity: number
  documentName: string
  chunkIndex: number
}

/**
 * Finds the most semantically relevant chunks for a query.
 *
 * Uses PGVectorStore.similaritySearchWithScore (cosine similarity):
 * score closer to 1 = more similar, score closer to 0 = less similar.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK = 5,
  minSimilarity = 0.3
): Promise<RetrievedChunk[]> {
  const vectorStore = await getVectorStore()

  const results = await vectorStore.similaritySearchWithScore(query, topK)

  return results
    .filter(([, score]) => score >= minSimilarity)
    .map(([doc, score]) => ({
      content: doc.pageContent,
      similarity: score,
      documentName: (doc.metadata.documentName as string) ?? 'Unknown',
      chunkIndex: (doc.metadata.chunkIndex as number) ?? 0,
    }))
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
    .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentName}]\n${chunk.content}`)
    .join('\n\n---\n\n')
}
