const express = require('express');
const asyncHandler = require('../middlewares/async-handler');
const draftService = require('../services/draftService');

const router = express.Router();

const extractRequestMetadata = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress;

  return {
    userAgent: req.get('user-agent'),
    ipAddress,
  };
};

router.post(
  '/save',
  asyncHandler(async (req, res) => {
    const metadata = extractRequestMetadata(req);
    const response = await draftService.saveDraft(req.body, metadata);
    res.json(response);
  })
);

router.get(
  '/admin/cleanup',
  asyncHandler(async (req, res) => {
    const result = await draftService.cleanupExpiredDrafts();
    res.json(result);
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { formId } = req.query;
    const stats = await draftService.getDraftStatistics(formId);
    res.json(stats);
  })
);

router.get(
  '/:sessionId',
  asyncHandler(async (req, res) => {
    const draft = await draftService.getDraft(req.params.sessionId);

    if (!draft) {
      return res.json({
        success: true,
        message: 'No draft found for this session',
        draft: null,
      });
    }

    return res.json({
      success: true,
      message: 'Draft retrieved successfully',
      draft,
    });
  })
);

router.delete(
  '/:sessionId',
  asyncHandler(async (req, res) => {
    const response = await draftService.deleteDraft(req.params.sessionId);
    res.json(response);
  })
);

module.exports = router;
