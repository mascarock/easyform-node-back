const { Schema, models, model } = require('mongoose');

const draftSubmissionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    formId: { type: String, index: true },
    answers: { type: Schema.Types.Mixed, required: true },
    currentStep: { type: Number, required: true, min: 0 },
    lastModified: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

draftSubmissionSchema.index({ sessionId: 1, formId: 1 });
draftSubmissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = models.DraftSubmission || model('DraftSubmission', draftSubmissionSchema);
