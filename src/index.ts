import { createApp } from './app.js'
import config from './config/index.js'
import { connectToDatabase } from './lib/database.js'

const app = createApp()

export async function startServer() {
  await connectToDatabase()
  const port = config.app.port

  return app.listen(port, () => {
    console.log(`🚀 EasyForm backend running on http://localhost:${port}`)
    console.log(`📊 Health check at http://localhost:${port}/api/v1/health`)
    console.log(`📝 Form submission endpoint at http://localhost:${port}/api/v1/forms/submit`)
  })
}

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

export default app
