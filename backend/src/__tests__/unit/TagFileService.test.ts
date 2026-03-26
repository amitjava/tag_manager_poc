import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { TagFileService } from '../../domains/advertisers/TagFileService'

const TEST_DIR = path.join(process.cwd(), 'test-tags-tmp')

beforeEach(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true })
})

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('TagFileService.slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(TagFileService.slugify('Acme Corp')).toBe('acme-corp')
  })

  it('strips special characters', () => {
    expect(TagFileService.slugify('Acme & Co. (Ltd)')).toBe('acme-co-ltd')
  })

  it('collapses multiple hyphens', () => {
    expect(TagFileService.slugify('Acme  --  Corp')).toBe('acme-corp')
  })
})

describe('TagFileService.write', () => {
  it('creates a JS file at the correct path', () => {
    TagFileService.write(
      { name: 'Acme Corp', tag_name: 'Homepage Pixel', tag_code: 'console.log(1)' },
      TEST_DIR
    )
    const filePath = path.join(TEST_DIR, 'acme-corp.js')
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('wraps tag code in an IIFE with comment header', () => {
    TagFileService.write(
      { name: 'Acme Corp', tag_name: 'Homepage Pixel', tag_code: 'console.log(1)' },
      TEST_DIR
    )
    const content = fs.readFileSync(path.join(TEST_DIR, 'acme-corp.js'), 'utf-8')
    expect(content).toContain('// Advertiser: Acme Corp')
    expect(content).toContain('// Tag: Homepage Pixel')
    expect(content).toContain('(function()')
    expect(content).toContain('console.log(1)')
    expect(content).toContain('})();')
  })

  it('overwrites an existing file', () => {
    const opts = { name: 'Acme Corp', tag_name: 'Old Tag', tag_code: 'old code' }
    TagFileService.write(opts, TEST_DIR)
    TagFileService.write({ ...opts, tag_name: 'New Tag', tag_code: 'new code' }, TEST_DIR)
    const content = fs.readFileSync(path.join(TEST_DIR, 'acme-corp.js'), 'utf-8')
    expect(content).toContain('// Tag: New Tag')
    expect(content).toContain('new code')
    expect(content).not.toContain('old code')
  })
})

describe('TagFileService.delete', () => {
  it('deletes the tag file', () => {
    TagFileService.write({ name: 'Acme Corp', tag_name: 'Tag', tag_code: 'code' }, TEST_DIR)
    TagFileService.delete('Acme Corp', TEST_DIR)
    expect(fs.existsSync(path.join(TEST_DIR, 'acme-corp.js'))).toBe(false)
  })

  it('does not throw if file does not exist', () => {
    expect(() => TagFileService.delete('Ghost Advertiser', TEST_DIR)).not.toThrow()
  })
})
