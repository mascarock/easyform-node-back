import { Router } from 'express';
import { getConnectionState } from '../lib/database.js';
import { HttpError } from '../utils/httpError.js';
const router = Router();
function isConnected() {
    return getConnectionState() === 1;
}
router.get('/', (req, res) => {
    const connected = isConnected();
    res.json({
        status: connected ? 'ok' : 'error',
        database: connected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
});
router.get('/ready', (req, res) => {
    if (!isConnected()) {
        throw new HttpError(503, 'Database not connected');
    }
    res.json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
    });
});
router.get('/live', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});
export default router;
