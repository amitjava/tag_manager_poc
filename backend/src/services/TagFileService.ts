import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_TAGS_DIR = path.join(process.cwd(), 'tags')

interface TagFileInput {
  name: string
  tag_name: string
  tag_code: string
}

export const TagFileService = {
  slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-')
  },

  getTagsDir(): string {
    if (process.env.TAGS_DIR) return process.env.TAGS_DIR
    if (process.env.VERCEL) return '/tmp/tags'
    return DEFAULT_TAGS_DIR
  },

  write(input: TagFileInput, tagsDir?: string): void {
    const dir = tagsDir ?? this.getTagsDir()
    fs.mkdirSync(dir, { recursive: true })
    const slug = this.slugify(input.name)
    const filePath = path.join(dir, `${slug}.js`)
    const content = [
      `// Advertiser: ${input.name}`,
      `// Tag: ${input.tag_name}`,
      `(function() {`,
      input.tag_code
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n'),
      `})();`,
      '',
    ].join('\n')
    fs.writeFileSync(filePath, content, 'utf-8')
  },

  delete(name: string, tagsDir?: string): void {
    const dir = tagsDir ?? this.getTagsDir()
    const slug = this.slugify(name)
    const filePath = path.join(dir, `${slug}.js`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  },
}
