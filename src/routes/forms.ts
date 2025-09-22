import { Router } from 'express'
import { formsService } from '../services/formService.js'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

const router = Router()

router.post(
  '/submit',
  asyncHandler(async (req, res) => {
    const metadata = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip ?? req.socket.remoteAddress,
      referer: req.get('Referer'),
      origin: req.get('Origin'),
    }

    const response = await formsService.submitForm(req.body, metadata)

    res.status(response.success ? 200 : 400).json(response)
  })
)

router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const offset = req.query.offset ? Number(req.query.offset) : 0

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      throw new HttpError(400, 'Limit must be between 1 and 100')
    }

    if (Number.isNaN(offset) || offset < 0) {
      throw new HttpError(400, 'Offset must be non-negative')
    }

    const data = await formsService.getFormSubmissions(
      typeof req.query.formId === 'string' ? req.query.formId : undefined,
      typeof req.query.userEmail === 'string' ? req.query.userEmail : undefined,
      limit,
      offset,
    )

    res.json(data)
  })
)

router.get(
  '/submissions/:id',
  asyncHandler(async (req, res) => {
    const submission = await formsService.getFormSubmissionById(req.params.id)

    if (!submission) {
      throw new HttpError(404, 'Form submission not found')
    }

    res.json(submission)
  })
)

router.get(
  '/statistics',
  asyncHandler(async (req, res) => {
    const stats = await formsService.getFormStatistics(
      typeof req.query.formId === 'string' ? req.query.formId : undefined,
    )

    res.json(stats)
  })
)

export default router
