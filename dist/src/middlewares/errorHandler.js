import { isHttpError } from '../utils/httpError.js';
export const errorHandler = (err, req, res, next) => {
    if (isHttpError(err)) {
        const status = err.status ?? 500;
        const payload = {
            success: false,
            message: err.message,
        };
        if (err.details) {
            payload.details = err.details;
        }
        res.status(status).json(payload);
        return;
    }
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
