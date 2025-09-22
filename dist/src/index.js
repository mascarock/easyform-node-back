import { createApp } from './app.js';
import config from './config/index.js';
import { connectToDatabase } from './lib/database.js';
const app = createApp();
export async function startServer() {
    const port = config.app.port;
    // Try to connect to database, but don't fail if it's not available
    try {
        await connectToDatabase();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.warn('⚠️  Database connection failed:', error.message);
        console.warn('⚠️  Server will start without database connection');
        console.warn('⚠️  Some features may not work until database is available');
    }
    return app.listen(port, () => {
        console.log(`🚀 EasyForm backend running on http://localhost:${port}`);
        console.log(`📊 Health check at http://localhost:${port}/api/v1/health`);
        console.log(`📝 Form submission endpoint at http://localhost:${port}/api/v1/forms/submit`);
    });
}
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
export default app;
