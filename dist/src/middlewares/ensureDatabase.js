import { connectToDatabase } from '../lib/database.js';
export async function ensureDatabase(req, res, next) {
    try {
        await connectToDatabase();
        next();
    }
    catch (error) {
        next(error);
    }
}
