import { Router } from 'express'
import { AdvertiserController } from '../controllers/AdvertiserController'
import { validateAdvertiser, validateAdvertiserUpdate } from '../middleware/validation'

const router = Router()

router.get('/', AdvertiserController.list)
router.get('/:id', AdvertiserController.findById)
router.post('/', validateAdvertiser, AdvertiserController.create)
router.put('/:id', validateAdvertiserUpdate, AdvertiserController.update)
router.delete('/:id', AdvertiserController.delete)

export default router
