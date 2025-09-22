import { Router } from 'express';
import { draftsService } from '../services/draftService.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
const router = Router();
router.post('/save', asyncHandler(async (req, res) => {
    const metadata = {
        userAgent: req.get('User-Agent') ?? undefined,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? undefined,
    };
    const response = await draftsService.saveDraft(req.body, metadata);
    res.status(response.success ? 200 : 400).json(response);
}));
router.get('/', asyncHandler(async (req, res) => {
    const stats = await draftsService.getDraftStatistics(typeof req.query.formId === 'string' ? req.query.formId : undefined);
    res.json(stats);
}));
router.get('/admin/cleanup', asyncHandler(async (req, res) => {
    const result = await draftsService.cleanupExpiredDrafts();
    res.json(result);
}));
router.get('/:sessionId', asyncHandler(async (req, res) => {
    const draft = await draftsService.getDraft(req.params.sessionId);
    if (!draft) {
        res.json({
            success: true,
            message: 'No draft found for this session',
            draft: null,
        });
        return;
    }
    res.json({
        success: true,
        message: 'Draft retrieved successfully',
        draft,
    });
}));
router.delete('/:sessionId', asyncHandler(async (req, res) => {
    const response = await draftsService.deleteDraft(req.params.sessionId);
    res.json(response);
}));
export default router;
