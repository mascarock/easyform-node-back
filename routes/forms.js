const express = require('express');
const asyncHandler = require('../middlewares/async-handler');
const formService = require('../services/formService');

const router = express.Router();

const extractRequestMetadata = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress;

  return {
    userAgent: req.get('user-agent'),
    ipAddress,
    referer: req.get('referer'),
    origin: req.get('origin'),
  };
};

router.post(
  '/submit',
  asyncHandler(async (req, res) => {
    const metadata = extractRequestMetadata(req);
    const response = await formService.submitForm(req.body, metadata);
    res.json(response);
  })
);

router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const { formId, userEmail, limit, offset } = req.query;
    const data = await formService.getFormSubmissions(formId, userEmail, limit, offset);
    res.json({ success: true, ...data });
  })
);

router.get(
  '/submissions/:id',
  asyncHandler(async (req, res) => {
    const submission = await formService.getFormSubmissionById(req.params.id);
    res.json(submission);
  })
);

router.get(
  '/statistics',
  asyncHandler(async (req, res) => {
    const { formId } = req.query;
    const stats = await formService.getFormStatistics(formId);
    res.json(stats);
  })
);

module.exports = router;
