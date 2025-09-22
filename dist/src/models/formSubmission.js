import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
import { QuestionType } from '../dto/formSubmission.js';
const QuestionSchema = new Schema({
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
}, { _id: false });
const FormSubmissionSchema = new Schema({
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
}, {
    timestamps: true,
});
FormSubmissionSchema.index({ formId: 1, submittedAt: -1 });
FormSubmissionSchema.index({ userEmail: 1, submittedAt: -1 });
FormSubmissionSchema.index({ submittedAt: -1 });
FormSubmissionSchema.index({ sessionId: 1 });
FormSubmissionSchema.index({ lastSubmissionAttempt: -1 });
export const FormSubmissionModel = models.FormSubmission ||
    model('FormSubmission', FormSubmissionSchema);
