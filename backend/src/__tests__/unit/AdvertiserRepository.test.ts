import { describe, it, expect, beforeEach } from 'vitest'
import { AdvertiserRepository } from '../../domains/advertisers/AdvertiserRepository'
import { resetDb, runMigrations } from '../../db/database'

beforeEach(async () => {
  await resetDb()
  await runMigrations()
})

describe('AdvertiserRepository.list', () => {
  it('returns empty array when no advertisers exist', async () => {
    const result = await AdvertiserRepository.list()
    expect(result).toEqual([])
  })

  it('returns all advertisers', async () => {
    await AdvertiserRepository.create({
      name: 'Acme',
      tag_name: 'Homepage Pixel',
      tag_code: 'console.log(1)',
    })
    await AdvertiserRepository.create({
      name: 'Beta Co',
      tag_name: 'Checkout Tag',
      tag_code: 'console.log(2)',
    })
    const result = await AdvertiserRepository.list()
    expect(result).toHaveLength(2)
    expect(result.map((a) => a.name)).toContain('Acme')
    expect(result.map((a) => a.name)).toContain('Beta Co')
  })
})

describe('AdvertiserRepository.create', () => {
  it('inserts a record and returns it with an id', async () => {
    const advertiser = await AdvertiserRepository.create({
      name: 'Acme',
      tag_name: 'Homepage Pixel',
      tag_code: 'console.log("hello")',
    })
    expect(advertiser.id).toBeTypeOf('number')
    expect(advertiser.name).toBe('Acme')
    expect(advertiser.tag_name).toBe('Homepage Pixel')
    expect(advertiser.tag_code).toBe('console.log("hello")')
  })

  it('throws on duplicate advertiser name', async () => {
    await AdvertiserRepository.create({ name: 'Acme', tag_name: 'Tag', tag_code: 'code' })
    await expect(
      AdvertiserRepository.create({ name: 'Acme', tag_name: 'Other', tag_code: 'code' })
    ).rejects.toThrow()
  })
})

describe('AdvertiserRepository.findById', () => {
  it('returns the advertiser when found', async () => {
    const created = await AdvertiserRepository.create({
      name: 'Acme',
      tag_name: 'Tag',
      tag_code: 'code',
    })
    const found = await AdvertiserRepository.findById(created.id)
    expect(found?.name).toBe('Acme')
  })

  it('returns undefined for unknown id', async () => {
    const found = await AdvertiserRepository.findById(999)
    expect(found).toBeUndefined()
  })
})

describe('AdvertiserRepository.update', () => {
  it('updates tag_name and tag_code', async () => {
    const created = await AdvertiserRepository.create({
      name: 'Acme',
      tag_name: 'Old Tag',
      tag_code: 'old code',
    })
    const updated = await AdvertiserRepository.update(created.id, {
      tag_name: 'New Tag',
      tag_code: 'new code',
    })
    expect(updated?.tag_name).toBe('New Tag')
    expect(updated?.tag_code).toBe('new code')
    expect(updated?.name).toBe('Acme')
  })

  it('returns undefined for unknown id', async () => {
    const result = await AdvertiserRepository.update(999, { tag_name: 'X' })
    expect(result).toBeUndefined()
  })
})

describe('AdvertiserRepository.delete', () => {
  it('removes the record and returns true', async () => {
    const created = await AdvertiserRepository.create({
      name: 'Acme',
      tag_name: 'Tag',
      tag_code: 'code',
    })
    const deleted = await AdvertiserRepository.delete(created.id)
    expect(deleted).toBe(true)
    expect(await AdvertiserRepository.findById(created.id)).toBeUndefined()
  })

  it('returns false for unknown id', async () => {
    const result = await AdvertiserRepository.delete(999)
    expect(result).toBe(false)
  })
})
