import { FormSubmissionModel, type FormSubmissionDocument } from '../models/formSubmission.js'
import { DraftSubmissionModel } from '../models/draftSubmission.js'
import { FormValidationService } from '../validation/formValidation.js'
import type { FormSubmissionDto, FormSubmissionResponseDto } from '../dto/formSubmission.js'
import { HttpError } from '../utils/httpError.js'

const validationService = new FormValidationService()

export class FormsService {
  async submitForm(submissionData: FormSubmissionDto, metadata?: Record<string, unknown>): Promise<FormSubmissionResponseDto> {
    try {
      validationService.validateFormSubmission(submissionData)

      if (submissionData.sessionId) {
        await this.checkSubmissionProtection(submissionData.sessionId, metadata?.ipAddress as string | undefined)
      }

      const sanitizedQuestions = submissionData.questions.map(question => validationService.sanitizeInput(question))
      const sanitizedAnswers = validationService.sanitizeInput(submissionData.answers)

      const now = new Date()

      const formSubmission = new FormSubmissionModel({
        ...submissionData,
        questions: sanitizedQuestions,
        answers: sanitizedAnswers,
        submittedAt: now,
        sessionId: submissionData.sessionId,
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
      })

      const savedSubmission = await formSubmission.save()

      if (submissionData.convertFromDraft && submissionData.sessionId) {
        await this.cleanupConvertedDraft(submissionData.sessionId)
      }

      return {
        success: true,
        message: 'Form submitted successfully',
        submissionId: savedSubmission._id.toString(),
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }

      if (error instanceof Error) {
        return {
          success: false,
          message: 'Form submission failed',
          errors: [error.message],
        }
      }

      return {
        success: false,
        message: 'Form submission failed',
        errors: ['An unexpected error occurred'],
      }
    }
  }

  async getFormSubmissions(
    formId?: string,
    userEmail?: string,
    limit = 10,
    offset = 0,
  ): Promise<{ submissions: FormSubmissionDocument[]; total: number }> {
    try {
      const filter: Record<string, unknown> = {}

      if (formId) filter.formId = formId
      if (userEmail) filter.userEmail = userEmail

      const [submissions, total] = await Promise.all([
        FormSubmissionModel.find(filter)
          .sort({ submittedAt: -1 })
          .limit(limit)
          .skip(offset)
          .exec(),
        FormSubmissionModel.countDocuments(filter).exec(),
      ])

      return { submissions, total }
    } catch (error) {
      throw new Error('Failed to fetch form submissions')
    }
  }

  async getFormSubmissionById(id: string): Promise<FormSubmissionDocument | null> {
    try {
      return await FormSubmissionModel.findById(id).exec()
    } catch (error) {
      throw new Error('Failed to fetch form submission')
    }
  }

  async getFormStatistics(formId?: string): Promise<{
    totalSubmissions: number
    submissionsByDate: Array<{ date: string; count: number }>
    averageQuestionsPerSubmission: number
  }> {
    try {
      const matchStage = formId ? { formId } : {}

      const totalSubmissions = await FormSubmissionModel.countDocuments(matchStage)

      const submissionsByDate = await FormSubmissionModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ])

      const avgQuestionsResult = await FormSubmissionModel.aggregate([
        { $match: matchStage },
        { $group: { _id: null, avgQuestions: { $avg: { $size: '$questions' } } } },
      ])

      const averageQuestionsPerSubmission = avgQuestionsResult[0]?.avgQuestions ?? 0

      return {
        totalSubmissions,
        submissionsByDate,
        averageQuestionsPerSubmission: Math.round(averageQuestionsPerSubmission * 100) / 100,
      }
    } catch (error) {
      throw new Error('Failed to fetch form statistics')
    }
  }

  private async checkSubmissionProtection(sessionId: string, ipAddress?: string): Promise<void> {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    const recentSubmissions = await FormSubmissionModel.find({
      sessionId,
      lastSubmissionAttempt: { $gte: fiveMinutesAgo },
    })
      .sort({ lastSubmissionAttempt: -1 })
      .exec()

    if (recentSubmissions.length > 0) {
      const lastSubmission = recentSubmissions[0]
      const timeSinceLastAttempt = now.getTime() - (lastSubmission.lastSubmissionAttempt?.getTime() ?? now.getTime())

      if (timeSinceLastAttempt < 30000) {
        throw new HttpError(429, 'Please wait before submitting again')
      }

      if (recentSubmissions.length >= 3) {
        throw new HttpError(429, 'Too many submission attempts. Please wait 5 minutes before trying again')
      }

      await FormSubmissionModel.updateOne(
        { _id: lastSubmission._id },
        {
          $inc: { submissionAttempts: 1 },
          $set: { lastSubmissionAttempt: now },
        },
      )
    }

    if (ipAddress) {
      const recentIpSubmissions = await FormSubmissionModel.countDocuments({
        'metadata.ipAddress': ipAddress,
        lastSubmissionAttempt: { $gte: fiveMinutesAgo },
      })

      if (recentIpSubmissions >= 10) {
        throw new HttpError(429, 'Too many submissions from this IP address')
      }
    }
  }

  private async cleanupConvertedDraft(sessionId: string): Promise<void> {
    try {
      await DraftSubmissionModel.deleteOne({ sessionId })
    } catch (error) {
      console.error(`Failed to cleanup draft for session ${sessionId}`, error)
    }
  }
}

export const formsService = new FormsService()
