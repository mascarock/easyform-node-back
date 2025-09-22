import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const DraftSubmissionSchema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    formId: { type: String, index: true },
    answers: { type: Schema.Types.Mixed, required: true },
    currentStep: { type: Number, required: true, min: 0 },
    lastModified: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
});
DraftSubmissionSchema.index({ sessionId: 1, formId: 1 });
DraftSubmissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const DraftSubmissionModel = models.DraftSubmission ||
    model('DraftSubmission', DraftSubmissionSchema);
