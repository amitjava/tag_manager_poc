import { Request, Response, NextFunction } from 'express'

export function validateAdvertiser(req: Request, res: Response, next: NextFunction): void {
  const { name, tag_name, tag_code } = req.body
  const missing: string[] = []
  if (!name || String(name).trim() === '') missing.push('name')
  if (!tag_name || String(tag_name).trim() === '') missing.push('tag_name')
  if (!tag_code || String(tag_code).trim() === '') missing.push('tag_code')
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
    return
  }
  next()
}

export function validateAdvertiserUpdate(req: Request, res: Response, next: NextFunction): void {
  const { tag_name, tag_code } = req.body
  const missing: string[] = []
  if (!tag_name || String(tag_name).trim() === '') missing.push('tag_name')
  if (!tag_code || String(tag_code).trim() === '') missing.push('tag_code')
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
    return
  }
  next()
}
