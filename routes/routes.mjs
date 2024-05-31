// routes.mjs

import express from 'express'
import WebhookController from '../src/webhook.mjs'

const router = express.Router()
const webhookController = new WebhookController()

router.get('/webapp', webhookController.home)
router.post('/webapp', webhookController.validatePost, webhookController.post)

export { router }
