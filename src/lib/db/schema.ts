import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core'

/**
 * Tracks uploaded document metadata. Chunk vectors are stored separately in
 * `langchain_chunks`, managed by LangChain's PGVectorStore.
 */
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  fileType: text('file_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
