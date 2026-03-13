import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Document } from '@langchain/core/documents'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { getVectorStore } from './vectorStore'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
})

/**
 * Full ingestion pipeline — mirrors the exemplo-embeddings-neo4j-rag flow:
 * 1. Load file → LangChain Documents  (PDFLoader or plain text)
 * 2. Split      → RecursiveCharacterTextSplitter
 * 3. Persist document metadata to the `documents` table (Drizzle)
 * 4. Add chunks + embeddings to the vector store (PGVectorStore)
 */
export async function ingestDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ documentId: string; chunkCount: number }> {
  // Step 1 — Load
  let rawDocs: Document[]

  if (mimeType === 'application/pdf') {
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' })
    const loader = new PDFLoader(blob, { splitPages: false })
    rawDocs = await loader.load()
  } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    rawDocs = [new Document({ pageContent: buffer.toString('utf-8') })]
  } else {
    throw new Error(`Unsupported file type: ${mimeType}. Upload a PDF or plain text file.`)
  }

  if (!rawDocs[0]?.pageContent?.trim()) {
    throw new Error('No text content could be extracted from this file.')
  }

  // Step 2 — Split
  const chunks = await splitter.splitDocuments(rawDocs)

  // Step 3 — Persist document metadata
  const [doc] = await db
    .insert(documents)
    .values({ name: fileName, fileType: mimeType, sizeBytes: buffer.length })
    .returning({ id: documents.id })

  // Step 4 — Attach metadata and store in vector store.
  // Roll back the document record if embedding fails to avoid orphaned rows.
  const docsWithMeta = chunks.map((chunk, i) =>
    new Document({
      pageContent: chunk.pageContent,
      metadata: {
        documentId: doc.id,
        documentName: fileName,
        chunkIndex: i,
      },
    })
  )

  try {
    const vectorStore = await getVectorStore()
    await vectorStore.addDocuments(docsWithMeta)
  } catch (err) {
    await db.delete(documents).where(eq(documents.id, doc.id))
    throw err
  }

  return { documentId: doc.id, chunkCount: chunks.length }
}
