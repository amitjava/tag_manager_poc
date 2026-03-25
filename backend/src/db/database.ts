import { createClient, Client } from '@libsql/client'

let client: Client

function getDbUrl(): string {
  if (process.env.NODE_ENV === 'test') return ':memory:'
  if (process.env.VERCEL) return 'file:/tmp/tag-manager.db'
  return 'file:tag-manager.db'
}

export function getDb(): Client {
  if (!client) {
    client = createClient({ url: getDbUrl() })
  }
  return client
}

export async function resetDb(): Promise<void> {
  if (client) {
    client.close()
    client = undefined as unknown as Client
  }
}

export async function runMigrations(): Promise<void> {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS advertisers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      tag_name TEXT NOT NULL,
      tag_code TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}
