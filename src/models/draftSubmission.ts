import mongoose, { type Document, type Model } from 'mongoose'
const { Schema, model, models } = mongoose

export interface DraftSubmission {
  sessionId: string
  formId?: string
  answers: Record<string, unknown>
  currentStep: number
  lastModified: Date
  expiresAt: Date
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
}

export type DraftSubmissionDocument = Document & DraftSubmission

const DraftSubmissionSchema = new Schema<DraftSubmission>(
  {
    sessionId: { type: String, required: true, unique: true },
    formId: { type: String, index: true },
    answers: { type: Schema.Types.Mixed, required: true },
    currentStep: { type: Number, required: true, min: 0 },
    lastModified: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
)

DraftSubmissionSchema.index({ sessionId: 1, formId: 1 })
DraftSubmissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const DraftSubmissionModel: Model<DraftSubmissionDocument> =
  (models.DraftSubmission as Model<DraftSubmissionDocument>) ||
  model<DraftSubmissionDocument>('DraftSubmission', DraftSubmissionSchema)
