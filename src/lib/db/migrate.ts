import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

config({ path: '.env.local' })

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  // pgvector extension must exist before the vector column migration runs
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
  console.log('✓ pgvector extension ready')

  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('✓ Migrations applied')

  await pool.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
