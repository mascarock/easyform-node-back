export interface SaveDraftDto {
  sessionId: string
  formId?: string
  answers: Record<string, unknown>
  currentStep: number
  questions?: unknown[]
}

export interface DraftSubmissionResponseDto {
  success: boolean
  message: string
  draftId?: string
  lastModified?: string
  errors?: string[]
}

export interface GetDraftResponseDto {
  sessionId: string
  formId?: string
  answers: Record<string, unknown>
  currentStep: number
  lastModified: string
  expiresAt: string
}

export interface GetDraftUnionResponseDto {
  success: boolean
  message: string
  draft: GetDraftResponseDto | null
}

export interface DeleteDraftResponseDto {
  success: boolean
  message: string
}

export interface CleanupDraftsResponseDto {
  deletedCount: number
  message: string
}
