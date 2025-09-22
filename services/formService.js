const FormSubmission = require('../models/FormSubmission');
const DraftSubmission = require('../models/DraftSubmission');
const {
  validateFormSubmission,
  sanitizeInput,
} = require('../validation/formValidation');
const {
  BadRequestError,
  NotFoundError,
  TooManyRequestsError,
  HttpError,
} = require('../lib/errors');

async function submitForm(submissionData, metadata = {}) {
  try {
    validateFormSubmission(submissionData);

    if (submissionData.sessionId) {
      await checkSubmissionProtection(submissionData.sessionId, metadata.ipAddress);
    }

    const sanitizedData = {
      ...submissionData,
      questions: (submissionData.questions || []).map((question) => sanitizeInput(question)),
      answers: sanitizeInput(submissionData.answers || {}),
    };

    const now = new Date();

    const formSubmission = await FormSubmission.create({
      ...sanitizedData,
      submittedAt: now,
      isDraft: false,
      draftSessionId: submissionData.convertFromDraft ? submissionData.sessionId : undefined,
      submissionAttempts: 1,
      lastSubmissionAttempt: now,
      metadata: {
        ...metadata,
        version: '1.0.0',
        source: 'easyform-frontend',
        convertedFromDraft: Boolean(submissionData.convertFromDraft),
      },
    });

    if (submissionData.convertFromDraft && submissionData.sessionId) {
      await cleanupConvertedDraft(submissionData.sessionId);
    }

    return {
      success: true,
      message: 'Form submitted successfully',
      submissionId: formSubmission._id.toString(),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
      throw new BadRequestError(error.message);
    }

    console.error('Error submitting form:', error);

    throw new HttpError(500, 'Form submission failed');
  }
}

async function checkSubmissionProtection(sessionId, ipAddress) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const recentSubmissions = await FormSubmission.find({
    sessionId,
    lastSubmissionAttempt: { $gte: fiveMinutesAgo },
  }).sort({ lastSubmissionAttempt: -1 });

  if (recentSubmissions.length > 0) {
    const lastSubmission = recentSubmissions[0];
    const timeSinceLastAttempt = now.getTime() - new Date(lastSubmission.lastSubmissionAttempt || lastSubmission.createdAt).getTime();

    if (timeSinceLastAttempt < 30000) {
      throw new TooManyRequestsError('Please wait before submitting again');
    }

    if (recentSubmissions.length >= 3) {
      throw new TooManyRequestsError('Too many submission attempts. Please wait 5 minutes before trying again');
    }

    await FormSubmission.updateOne(
      { _id: lastSubmission._id },
      {
        $inc: { submissionAttempts: 1 },
        $set: { lastSubmissionAttempt: now },
      }
    );
  }

  if (ipAddress) {
    const recentIpSubmissions = await FormSubmission.countDocuments({
      'metadata.ipAddress': ipAddress,
      lastSubmissionAttempt: { $gte: fiveMinutesAgo },
    });

    if (recentIpSubmissions >= 10) {
      throw new TooManyRequestsError('Too many submissions from this IP address');
    }
  }
}

async function cleanupConvertedDraft(sessionId) {
  try {
    await DraftSubmission.deleteOne({ sessionId });
  } catch (error) {
    console.error(`Failed to cleanup draft for session ${sessionId}:`, error);
  }
}

async function getFormSubmissions(formId, userEmail, limit = 10, offset = 0) {
  const limitNum = Number(limit);
  const offsetNum = Number(offset);

  if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new BadRequestError('Limit must be between 1 and 100');
  }

  if (Number.isNaN(offsetNum) || offsetNum < 0) {
    throw new BadRequestError('Offset must be non-negative');
  }

  const filter = {};

  if (formId) {
    filter.formId = formId;
  }

  if (userEmail) {
    filter.userEmail = userEmail;
  }

  try {
    const [submissions, total] = await Promise.all([
      FormSubmission.find(filter)
        .sort({ submittedAt: -1 })
        .limit(limitNum)
        .skip(offsetNum)
        .lean()
        .exec(),
      FormSubmission.countDocuments(filter).exec(),
    ]);

    return { submissions, total };
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    throw new HttpError(500, 'Failed to fetch form submissions');
  }
}

async function getFormSubmissionById(id) {
  try {
    const submission = await FormSubmission.findById(id).lean().exec();

    if (!submission) {
      throw new NotFoundError('Form submission not found');
    }

    return submission;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error && error.name === 'CastError') {
      throw new NotFoundError('Form submission not found');
    }

    console.error(`Error fetching form submission ${id}:`, error);
    throw new HttpError(500, 'Failed to fetch form submission');
  }
}

async function getFormStatistics(formId) {
  const filter = formId ? { formId } : {};

  try {
    const [totalSubmissions, submissionsByDate, avgQuestionsResult] = await Promise.all([
      FormSubmission.countDocuments(filter),
      FormSubmission.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]),
      FormSubmission.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avgQuestions: { $avg: { $size: '$questions' } },
          },
        },
      ]),
    ]);

    const averageQuestionsPerSubmission = avgQuestionsResult[0]?.avgQuestions || 0;

    return {
      totalSubmissions,
      submissionsByDate,
      averageQuestionsPerSubmission: Math.round(averageQuestionsPerSubmission * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching form statistics:', error);
    throw new HttpError(500, 'Failed to fetch form statistics');
  }
}

module.exports = {
  submitForm,
  getFormSubmissions,
  getFormSubmissionById,
  getFormStatistics,
};
