import { Request, Response } from 'express'
import { AdvertiserRepository } from '../repositories/AdvertiserRepository'
import { TagFileService } from '../services/TagFileService'

export const AdvertiserController = {
  async list(req: Request, res: Response): Promise<void> {
    const advertisers = await AdvertiserRepository.list()
    res.json(advertisers)
  },

  async findById(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id)
    const advertiser = await AdvertiserRepository.findById(id)
    if (!advertiser) {
      res.status(404).json({ error: 'Advertiser not found' })
      return
    }
    res.json(advertiser)
  },

  async create(req: Request, res: Response): Promise<void> {
    const { name, tag_name, tag_code } = req.body
    try {
      const advertiser = await AdvertiserRepository.create({ name, tag_name, tag_code })
      TagFileService.write({ name, tag_name, tag_code })
      res.status(201).json(advertiser)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('constraint')) {
        res.status(409).json({ error: 'Advertiser name already exists' })
        return
      }
      throw err
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id)
    const { tag_name, tag_code } = req.body
    const advertiser = await AdvertiserRepository.update(id, { tag_name, tag_code })
    if (!advertiser) {
      res.status(404).json({ error: 'Advertiser not found' })
      return
    }
    TagFileService.write({
      name: advertiser.name,
      tag_name: advertiser.tag_name,
      tag_code: advertiser.tag_code,
    })
    res.json(advertiser)
  },

  async delete(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id)
    const advertiser = await AdvertiserRepository.findById(id)
    if (!advertiser) {
      res.status(404).json({ error: 'Advertiser not found' })
      return
    }
    await AdvertiserRepository.delete(id)
    TagFileService.delete(advertiser.name)
    res.json({ success: true })
  },
}
