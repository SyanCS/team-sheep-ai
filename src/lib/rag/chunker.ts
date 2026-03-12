const CHUNK_SIZE = 1500  // characters (~375 tokens, well under MiniLM's 512 limit)
const CHUNK_OVERLAP = 150 // characters of overlap between consecutive chunks

/**
 * Splits a long text into overlapping chunks so that no single chunk
 * exceeds the embedding model's token limit, while keeping context
 * intact across chunk boundaries via overlap.
 */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  if (normalized.length <= CHUNK_SIZE) {
    return [normalized]
  }

  const chunks: string[] = []
  let start = 0

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length)
    let chunkEnd = end

    // Try to break at a sentence boundary (. ! ?) or paragraph boundary
    // to avoid cutting mid-sentence, but only search within the last 20% of the chunk
    if (end < normalized.length) {
      const searchFrom = start + Math.floor(CHUNK_SIZE * 0.8)
      const sentenceEnd = normalized.slice(searchFrom, end).search(/[.!?]\s/)
      if (sentenceEnd !== -1) {
        chunkEnd = searchFrom + sentenceEnd + 1
      }
    }

    const chunk = normalized.slice(start, chunkEnd).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    // Move start forward by chunk size minus overlap
    start = chunkEnd - CHUNK_OVERLAP
  }

  return chunks
}
