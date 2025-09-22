import type { Request, Response, NextFunction } from 'express'
import { connectToDatabase } from '../lib/database.js'

export async function ensureDatabase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectToDatabase()
    next()
  } catch (error) {
    next(error)
  }
}
