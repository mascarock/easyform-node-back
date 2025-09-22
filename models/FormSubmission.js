const { Schema, models, model } = require('mongoose');

const formSubmissionSchema = new Schema(
  {
    formId: { type: String, index: true },
    questions: {
      type: [
        {
          id: { type: String, required: true },
          type: {
            type: String,
            enum: ['text', 'email', 'multiple-choice'],
            required: true,
          },
          title: { type: String, required: true },
          placeholder: { type: String },
          required: { type: Boolean, default: false },
          options: { type: [String] },
          helperText: { type: String },
        },
      ],
      required: true,
    },
    answers: {
      type: Schema.Types.Mixed,
      required: true,
    },
    userEmail: { type: String, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    submittedAt: { type: Date, default: Date.now },
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
);

formSubmissionSchema.index({ formId: 1, submittedAt: -1 });
formSubmissionSchema.index({ userEmail: 1, submittedAt: -1 });
formSubmissionSchema.index({ submittedAt: -1 });
formSubmissionSchema.index({ sessionId: 1 });
formSubmissionSchema.index({ lastSubmissionAttempt: -1 });

module.exports = models.FormSubmission || model('FormSubmission', formSubmissionSchema);
