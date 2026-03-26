import { getDb } from '../../db/database'

export interface Advertiser {
  id: number
  name: string
  tag_name: string
  tag_code: string
  created_at: string
  updated_at: string
}

export interface CreateAdvertiserInput {
  name: string
  tag_name: string
  tag_code: string
}

export const AdvertiserRepository = {
  async list(): Promise<Advertiser[]> {
    const db = getDb()
    const result = await db.execute('SELECT * FROM advertisers ORDER BY created_at DESC')
    return result.rows as unknown as Advertiser[]
  },

  async findById(id: number): Promise<Advertiser | undefined> {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM advertisers WHERE id = ?',
      args: [id],
    })
    return result.rows[0] as unknown as Advertiser | undefined
  },

  async findByName(name: string): Promise<Advertiser | undefined> {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM advertisers WHERE name = ?',
      args: [name],
    })
    return result.rows[0] as unknown as Advertiser | undefined
  },

  async create(input: CreateAdvertiserInput): Promise<Advertiser> {
    const db = getDb()
    const result = await db.execute({
      sql: 'INSERT INTO advertisers (name, tag_name, tag_code) VALUES (?, ?, ?) RETURNING *',
      args: [input.name, input.tag_name, input.tag_code],
    })
    return result.rows[0] as unknown as Advertiser
  },

  async update(
    id: number,
    input: Partial<Pick<Advertiser, 'tag_name' | 'tag_code'>>
  ): Promise<Advertiser | undefined> {
    const db = getDb()
    const fields: string[] = []
    const args: (string | number)[] = []
    if (input.tag_name !== undefined) {
      fields.push('tag_name = ?')
      args.push(input.tag_name)
    }
    if (input.tag_code !== undefined) {
      fields.push('tag_code = ?')
      args.push(input.tag_code)
    }
    fields.push("updated_at = datetime('now')")
    args.push(id)
    const result = await db.execute({
      sql: `UPDATE advertisers SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
      args,
    })
    return result.rows[0] as unknown as Advertiser | undefined
  },

  async delete(id: number): Promise<boolean> {
    const db = getDb()
    const result = await db.execute({
      sql: 'DELETE FROM advertisers WHERE id = ?',
      args: [id],
    })
    return (result.rowsAffected ?? 0) > 0
  },
}
