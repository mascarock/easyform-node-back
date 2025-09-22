import mongoose, { type Document, type Model } from 'mongoose'
const { Schema, model, models } = mongoose
import { QuestionType, type QuestionDto } from '../dto/formSubmission.js'

export interface FormSubmission {
  formId?: string
  questions: QuestionDto[]
  answers: Record<string, unknown>
  userEmail?: string
  userAgent?: string
  ipAddress?: string
  submittedAt?: Date
  isProcessed?: boolean
  processedAt?: Date
  metadata?: Record<string, unknown>
  sessionId?: string
  isDraft?: boolean
  draftSessionId?: string
  submissionAttempts?: number
  lastSubmissionAttempt?: Date
}

export type FormSubmissionDocument = Document & FormSubmission

const QuestionSchema = new Schema<QuestionDto>(
  {
    id: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(QuestionType),
    },
    title: { type: String, required: true },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    options: { type: [String] },
    helperText: { type: String },
  },
  { _id: false }
)

const FormSubmissionSchema = new Schema<FormSubmission>(
  {
    formId: { type: String, index: true },
    questions: { type: [QuestionSchema], required: true },
    answers: { type: Schema.Types.Mixed, required: true },
    userEmail: { type: String, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    submittedAt: { type: Date },
    isProcessed: { type: Boolean, default: false },
    processedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
    sessionId: { type: String, index: true },
    isDraft: { type: Boolean, default: false },
    draftSessionId: { type: String },
    submissionAttempts: { type: Number, default: 1 },
    lastSubmissionAttempt: { type: Date },
  },
  {
    timestamps: true,
  }
)

FormSubmissionSchema.index({ formId: 1, submittedAt: -1 })
FormSubmissionSchema.index({ userEmail: 1, submittedAt: -1 })
FormSubmissionSchema.index({ submittedAt: -1 })
FormSubmissionSchema.index({ sessionId: 1 })
FormSubmissionSchema.index({ lastSubmissionAttempt: -1 })

export const FormSubmissionModel: Model<FormSubmissionDocument> =
  (models.FormSubmission as Model<FormSubmissionDocument>) ||
  model<FormSubmissionDocument>('FormSubmission', FormSubmissionSchema)
