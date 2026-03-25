import { Request, Response } from 'express'
import { AdvertiserRepository } from '../repositories/AdvertiserRepository'

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
    const advertiser = await AdvertiserRepository.create({ name, tag_name, tag_code })
    res.status(201).json(advertiser)
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id)
    const { tag_name, tag_code } = req.body
    const advertiser = await AdvertiserRepository.update(id, { tag_name, tag_code })
    if (!advertiser) {
      res.status(404).json({ error: 'Advertiser not found' })
      return
    }
    res.json(advertiser)
  },

  async delete(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id)
    const deleted = await AdvertiserRepository.delete(id)
    if (!deleted) {
      res.status(404).json({ error: 'Advertiser not found' })
      return
    }
    res.json({ success: true })
  },
}
