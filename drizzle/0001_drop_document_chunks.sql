-- `document_chunks` was the original custom vector store table.
-- It has been superseded by the LangChain-managed `langchain_chunks` table
-- (PGVectorStore). Drop the FK constraint first, then the table itself.
ALTER TABLE "document_chunks" DROP CONSTRAINT IF EXISTS "document_chunks_document_id_documents_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "embedding_hnsw_idx";
--> statement-breakpoint
DROP TABLE IF EXISTS "document_chunks";
