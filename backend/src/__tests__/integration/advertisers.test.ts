import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import { app } from '../../app'
import { resetDb, runMigrations } from '../../db/database'

const TEST_TAGS_DIR = path.join(process.cwd(), 'test-tags-tmp')

beforeEach(async () => {
  await resetDb()
  await runMigrations()
  fs.mkdirSync(TEST_TAGS_DIR, { recursive: true })
  process.env.TAGS_DIR = TEST_TAGS_DIR
})

afterEach(() => {
  fs.rmSync(TEST_TAGS_DIR, { recursive: true, force: true })
  delete process.env.TAGS_DIR
})

describe('GET /api/advertisers', () => {
  it('returns 200 with empty array when no advertisers', async () => {
    const res = await request(app).get('/api/advertisers')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns all advertisers', async () => {
    await request(app)
      .post('/api/advertisers')
      .send({ name: 'Acme', tag_name: 'Tag', tag_code: 'code' })
    const res = await request(app).get('/api/advertisers')
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Acme')
  })
})

describe('POST /api/advertisers', () => {
  it('returns 201 and creates advertiser', async () => {
    const res = await request(app)
      .post('/api/advertisers')
      .send({ name: 'Acme', tag_name: 'Homepage Pixel', tag_code: 'console.log(1)' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeTypeOf('number')
    expect(res.body.name).toBe('Acme')
  })

  it('writes a tag file to disk', async () => {
    await request(app)
      .post('/api/advertisers')
      .send({ name: 'Acme Corp', tag_name: 'Tag', tag_code: 'code' })
    expect(fs.existsSync(path.join(TEST_TAGS_DIR, 'acme-corp.js'))).toBe(true)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/advertisers')
      .send({ tag_name: 'Tag', tag_code: 'code' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when tag_name is missing', async () => {
    const res = await request(app).post('/api/advertisers').send({ name: 'Acme', tag_code: 'code' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when tag_code is missing', async () => {
    const res = await request(app).post('/api/advertisers').send({ name: 'Acme', tag_name: 'Tag' })
    expect(res.status).toBe(400)
  })

  it('returns 409 on duplicate advertiser name', async () => {
    await request(app)
      .post('/api/advertisers')
      .send({ name: 'Acme', tag_name: 'Tag', tag_code: 'code' })
    const res = await request(app)
      .post('/api/advertisers')
      .send({ name: 'Acme', tag_name: 'Tag2', tag_code: 'code2' })
    expect(res.status).toBe(409)
  })
})

describe('GET /api/advertisers/:id', () => {
  it('returns 200 with advertiser', async () => {
    const created = await request(app)
      .post('/api/advertisers')
      .send({ name: 'Acme', tag_name: 'Tag', tag_code: 'code' })
    const res = await request(app).get(`/api/advertisers/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Acme')
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/advertisers/999')
    expect(res.status).toBe(404)
  })
})
