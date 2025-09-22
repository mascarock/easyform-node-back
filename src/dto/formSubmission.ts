export enum QuestionType {
  TEXT = 'text',
  EMAIL = 'email',
  MULTIPLE_CHOICE = 'multiple-choice',
}

export interface QuestionDto {
  id: string
  type: QuestionType
  title: string
  placeholder?: string
  required?: boolean
  options?: string[]
  helperText?: string
}

export interface FormSubmissionDto {
  formId?: string
  questions: QuestionDto[]
  answers: Record<string, unknown>
  userEmail?: string
  userAgent?: string
  ipAddress?: string
  submittedAt?: string
  sessionId?: string
  convertFromDraft?: boolean
}

export interface FormSubmissionResponseDto {
  success: boolean
  message: string
  submissionId?: string
  errors?: string[]
}
