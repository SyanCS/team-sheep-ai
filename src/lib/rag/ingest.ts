import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PDFParse } from 'pdf-parse'
import { db } from '@/lib/db'
import { documentChunks, documents } from '@/lib/db/schema'
import { chunkText } from './chunker'
import { embedMany } from './embeddings'

// pdfjs-dist (used by pdf-parse) loads a worker via dynamic import; when bundled by Next.js
// the default path resolves to .next and fails. Set the worker to the real file in node_modules.
function setPdfWorker() {
  try {
    const require = createRequire(import.meta.url)
    const resolved = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
    PDFParse.setWorker(pathToFileURL(resolved).href)
  } catch {
    const cwdPath = join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
    PDFParse.setWorker(pathToFileURL(cwdPath).href)
  }
}
setPdfWorker()

/**
 * Full ingestion pipeline:
 * 1. Parse raw file buffer into plain text (PDF or plain text)
 * 2. Split into overlapping chunks
 * 3. Embed all chunks locally via Transformers.js
 * 4. Persist document + chunks to the database
 */
export async function ingestDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ documentId: string; chunkCount: number }> {
  // Step 1 — Parse
  const rawText = await parseFile(buffer, mimeType)
  if (!rawText.trim()) {
    throw new Error('No text content could be extracted from this file.')
  }

  // Step 2 — Chunk
  const chunks = chunkText(rawText)

  // Step 3 — Embed (all chunks in parallel batches)
  const embeddings = await embedMany(chunks)

  // Step 4 — Persist
  const [doc] = await db
    .insert(documents)
    .values({
      name: fileName,
      fileType: mimeType,
      sizeBytes: buffer.length,
    })
    .returning({ id: documents.id })

  await db.insert(documentChunks).values(
    chunks.map((content, i) => ({
      documentId: doc.id,
      content,
      embedding: embeddings[i],
      chunkIndex: i,
    }))
  )

  return { documentId: doc.id, chunkCount: chunks.length }
}

async function parseFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      return result.text
    } finally {
      await parser.destroy()
    }
  }

  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: ${mimeType}. Upload a PDF or plain text file.`)
}
