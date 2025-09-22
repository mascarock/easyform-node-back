import config from '../config/index.js';
import { QuestionType } from '../dto/formSubmission.js';
export class FormValidationService {
    maxQuestionnaireLength = config.app.maxQuestionnaireLength;
    maxAnswerLength = config.app.maxAnswerLength;
    emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validateFormSubmission(submission) {
        this.validateQuestions(submission.questions);
        this.validateAnswers(submission.answers, submission.questions);
        this.validateEmailIfPresent(submission.userEmail);
    }
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input.trim().replace(/[<>]/g, '');
        }
        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeInput(item));
        }
        if (input && typeof input === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        return input;
    }
    validateQuestions(questions) {
        if (!Array.isArray(questions)) {
            throw new Error('Questions must be an array');
        }
        if (questions.length === 0) {
            throw new Error('At least one question is required');
        }
        if (questions.length > this.maxQuestionnaireLength) {
            throw new Error(`Maximum ${this.maxQuestionnaireLength} questions allowed`);
        }
        const ids = new Set();
        for (const question of questions) {
            if (!question.id || typeof question.id !== 'string') {
                throw new Error('Each question must have a valid id');
            }
            if (ids.has(question.id)) {
                throw new Error(`Duplicate question id: ${question.id}`);
            }
            ids.add(question.id);
            if (!Object.values(QuestionType).includes(question.type)) {
                throw new Error(`Invalid question type: ${question.type}`);
            }
            if (!question.title || typeof question.title !== 'string') {
                throw new Error('Each question must have a title');
            }
            if (question.type === QuestionType.MULTIPLE_CHOICE) {
                if (!Array.isArray(question.options) || question.options.length === 0) {
                    throw new Error('Multiple choice questions must have options');
                }
            }
        }
    }
    validateAnswers(answers, questions) {
        if (!answers || typeof answers !== 'object') {
            throw new Error('Answers must be an object');
        }
        const questionMap = new Map(questions.map(question => [question.id, question]));
        for (const [questionId, answer] of Object.entries(answers)) {
            const question = questionMap.get(questionId);
            if (!question) {
                throw new Error(`Answer provided for unknown question: ${questionId}`);
            }
            if (question.required && (answer === undefined || answer === null || answer === '')) {
                throw new Error(`Required question '${question.title}' must be answered`);
            }
            if (answer === undefined || answer === null || answer === '') {
                continue;
            }
            this.validateAnswerByType(question, answer);
        }
        for (const question of questions) {
            if (question.required && !(question.id in answers)) {
                throw new Error(`Required question '${question.title}' is missing`);
            }
        }
    }
    validateAnswerByType(question, answer) {
        switch (question.type) {
            case QuestionType.TEXT:
                if (typeof answer !== 'string') {
                    throw new Error(`Answer for '${question.title}' must be a string`);
                }
                if (answer.length > this.maxAnswerLength) {
                    throw new Error(`Answer for '${question.title}' is too long`);
                }
                break;
            case QuestionType.EMAIL:
                if (typeof answer !== 'string') {
                    throw new Error(`Answer for '${question.title}' must be a string`);
                }
                if (!this.emailRegex.test(answer)) {
                    throw new Error(`Answer for '${question.title}' must be a valid email`);
                }
                break;
            case QuestionType.MULTIPLE_CHOICE:
                if (typeof answer !== 'string') {
                    throw new Error(`Answer for '${question.title}' must be a string`);
                }
                if (!question.options?.includes(answer)) {
                    throw new Error(`Answer for '${question.title}' must be one of the provided options`);
                }
                break;
            default:
                throw new Error(`Unknown question type: ${question.type}`);
        }
    }
    validateEmailIfPresent(email) {
        if (email && !this.emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }
}
