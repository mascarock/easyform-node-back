const DraftSubmission = require('../models/DraftSubmission');
const { BadRequestError, NotFoundError, HttpError } = require('../lib/errors');

async function saveDraft(saveDraftDto, metadata = {}) {
  const { sessionId, formId, answers, currentStep } = saveDraftDto || {};

  if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) {
    throw new BadRequestError('Invalid session ID format');
  }

  if (typeof currentStep !== 'number' || Number.isNaN(currentStep)) {
    throw new BadRequestError('Current step must be a number');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const now = new Date();

  try {
    const draftSubmission = await DraftSubmission.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        formId,
        answers: answers || {},
        currentStep,
        lastModified: now,
        expiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        metadata: {
          answerCount: Object.keys(answers || {}).length,
          lastQuestionAnswered: getLastAnsweredQuestion(answers || {}),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).exec();

    return {
      success: true,
      message: 'Draft saved successfully',
      draftId: draftSubmission._id.toString(),
      lastModified: draftSubmission.lastModified.toISOString(),
    };
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      throw new BadRequestError(error.message);
    }

    console.error('Failed to save draft:', error);
    throw new HttpError(500, 'Failed to save draft');
  }
}

async function getDraft(sessionId) {
  validateSessionId(sessionId);

  try {
    const draft = await DraftSubmission.findOne({
      sessionId,
      expiresAt: { $gt: new Date() },
    })
      .lean()
      .exec();

    if (!draft) {
      return null;
    }

    return {
      sessionId: draft.sessionId,
      formId: draft.formId,
      answers: draft.answers,
      currentStep: draft.currentStep,
      lastModified: draft.lastModified.toISOString(),
      expiresAt: draft.expiresAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    console.error('Failed to retrieve draft:', error);
    throw new HttpError(500, 'Failed to retrieve draft');
  }
}

async function deleteDraft(sessionId) {
  validateSessionId(sessionId);

  try {
    const result = await DraftSubmission.deleteOne({ sessionId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundError('Draft not found');
    }

    return {
      success: true,
      message: 'Draft deleted successfully',
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    console.error('Failed to delete draft:', error);
    throw new HttpError(500, 'Failed to delete draft');
  }
}

async function cleanupExpiredDrafts() {
  try {
    const result = await DraftSubmission.deleteMany({
      expiresAt: { $lt: new Date() },
    }).exec();

    return {
      deletedCount: result.deletedCount,
      message: `Successfully cleaned up ${result.deletedCount} expired drafts`,
    };
  } catch (error) {
    console.error('Failed to cleanup expired drafts:', error);
    throw new HttpError(500, 'Failed to cleanup expired drafts');
  }
}

async function getDraftStatistics(formId) {
  try {
    const matchStage = formId
      ? { formId, expiresAt: { $gt: new Date() } }
      : { expiresAt: { $gt: new Date() } };

    const stats = await DraftSubmission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDrafts: { $sum: 1 },
          averageStep: { $avg: '$currentStep' },
          averageAnswers: { $avg: { $size: { $objectToArray: '$answers' } } },
          oldestDraft: { $min: '$lastModified' },
          newestDraft: { $max: '$lastModified' },
        },
      },
    ]);

    return (
      stats[0] || {
        totalDrafts: 0,
        averageStep: 0,
        averageAnswers: 0,
        oldestDraft: null,
        newestDraft: null,
      }
    );
  } catch (error) {
    console.error('Failed to get draft statistics:', error);
    throw new HttpError(500, 'Failed to get draft statistics');
  }
}

function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) {
    throw new BadRequestError('Invalid session ID format');
  }
}

function getLastAnsweredQuestion(answers) {
  const keys = Object.keys(answers || {}).filter((key) => {
    const value = answers[key];
    return value !== undefined && value !== null && value !== '';
  });

  if (keys.length === 0) {
    return null;
  }

  return keys[keys.length - 1];
}

module.exports = {
  saveDraft,
  getDraft,
  deleteDraft,
  cleanupExpiredDrafts,
  getDraftStatistics,
};
