import { DraftSubmissionModel, type DraftSubmissionDocument } from '../models/draftSubmission.js'
import type {
  SaveDraftDto,
  DraftSubmissionResponseDto,
  GetDraftResponseDto,
  DeleteDraftResponseDto,
  CleanupDraftsResponseDto,
} from '../dto/draftSubmission.js'
import { HttpError } from '../utils/httpError.js'

export class DraftsService {
  async saveDraft(
    saveDraftDto: SaveDraftDto,
    metadata: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<DraftSubmissionResponseDto> {
    const { sessionId, formId, answers, currentStep } = saveDraftDto

    if (!sessionId || sessionId.length < 10) {
      throw new HttpError(400, 'Invalid session ID format')
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const now = new Date()

    try {
      const draftSubmission = await DraftSubmissionModel.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          formId,
          answers,
          currentStep,
          lastModified: now,
          expiresAt,
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
          metadata: {
            answerCount: Object.keys(answers ?? {}).length,
            lastQuestionAnswered: this.getLastAnsweredQuestion(answers ?? {}),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      )

      return {
        success: true,
        message: 'Draft saved successfully',
        draftId: draftSubmission._id.toString(),
        lastModified: draftSubmission.lastModified.toISOString(),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save draft'
      return {
        success: false,
        message: 'Failed to save draft',
        errors: [message],
      }
    }
  }

  async getDraft(sessionId: string): Promise<GetDraftResponseDto | null> {
    if (!sessionId || sessionId.length < 10) {
      throw new HttpError(400, 'Invalid session ID format')
    }

    try {
      const draft = await DraftSubmissionModel.findOne({
        sessionId,
        expiresAt: { $gt: new Date() },
      })

      if (!draft) {
        return null
      }

      return {
        sessionId: draft.sessionId,
        formId: draft.formId,
        answers: draft.answers as Record<string, unknown>,
        currentStep: draft.currentStep,
        lastModified: draft.lastModified.toISOString(),
        expiresAt: draft.expiresAt.toISOString(),
      }
    } catch (error) {
      throw new HttpError(404, 'Draft not found')
    }
  }

  async deleteDraft(sessionId: string): Promise<DeleteDraftResponseDto> {
    if (!sessionId || sessionId.length < 10) {
      throw new HttpError(400, 'Invalid session ID format')
    }

    const result = await DraftSubmissionModel.deleteOne({ sessionId })

    if (result.deletedCount === 0) {
      throw new HttpError(404, 'Draft not found')
    }

    return {
      success: true,
      message: 'Draft deleted successfully',
    }
  }

  async cleanupExpiredDrafts(): Promise<CleanupDraftsResponseDto> {
    try {
      const result = await DraftSubmissionModel.deleteMany({ expiresAt: { $lt: new Date() } })

      return {
        deletedCount: result.deletedCount ?? 0,
        message: `Successfully cleaned up ${result.deletedCount ?? 0} expired drafts`,
      }
    } catch (error) {
      return {
        deletedCount: 0,
        message: 'Failed to cleanup expired drafts',
      }
    }
  }

  async getDraftStatistics(formId?: string) {
    const matchStage = formId
      ? { formId, expiresAt: { $gt: new Date() } }
      : { expiresAt: { $gt: new Date() } }

    try {
      const stats = await DraftSubmissionModel.aggregate([
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
      ])

      return stats[0] ?? {
        totalDrafts: 0,
        averageStep: 0,
        averageAnswers: 0,
        oldestDraft: null,
        newestDraft: null,
      }
    } catch (error) {
      throw new Error('Failed to get draft statistics')
    }
  }

  private getLastAnsweredQuestion(answers: Record<string, unknown>): string | null {
    const answeredQuestions = Object.keys(answers).filter((key) => {
      const value = answers[key]
      return value !== undefined && value !== '' && value !== null
    })

    return answeredQuestions.length > 0 ? answeredQuestions[answeredQuestions.length - 1] : null
  }
}

export const draftsService = new DraftsService()
