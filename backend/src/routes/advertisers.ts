import { Router } from 'express'
import { AdvertiserController } from '../controllers/AdvertiserController'

const router = Router()

router.get('/', AdvertiserController.list)
router.get('/:id', AdvertiserController.findById)
router.post('/', AdvertiserController.create)
router.put('/:id', AdvertiserController.update)
router.delete('/:id', AdvertiserController.delete)

export default router
