const config = require('../config');
const { BadRequestError } = require('../lib/errors');

const QuestionType = {
  TEXT: 'text',
  EMAIL: 'email',
  MULTIPLE_CHOICE: 'multiple-choice',
};

function validateFormSubmission(submission) {
  if (!submission || typeof submission !== 'object') {
    throw new BadRequestError('Submission payload is required');
  }

  validateQuestions(submission.questions || []);
  validateAnswers(submission.answers, submission.questions || []);
  validateEmailIfPresent(submission.userEmail);
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new BadRequestError('Questions must be an array');
  }

  if (questions.length === 0) {
    throw new BadRequestError('At least one question is required');
  }

  if (questions.length > config.app.maxQuestionnaireLength) {
    throw new BadRequestError(`Maximum ${config.app.maxQuestionnaireLength} questions allowed`);
  }

  const questionIds = new Set();

  for (const question of questions) {
    if (!question || typeof question !== 'object') {
      throw new BadRequestError('Each question must be an object');
    }

    if (!question.id || typeof question.id !== 'string') {
      throw new BadRequestError('Each question must have a valid id');
    }

    if (questionIds.has(question.id)) {
      throw new BadRequestError(`Duplicate question id: ${question.id}`);
    }
    questionIds.add(question.id);

    if (!Object.values(QuestionType).includes(question.type)) {
      throw new BadRequestError(`Invalid question type: ${question.type}`);
    }

    if (!question.title || typeof question.title !== 'string') {
      throw new BadRequestError('Each question must have a title');
    }

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        throw new BadRequestError('Multiple choice questions must have options');
      }
    }
  }
}

function validateAnswers(answers, questions) {
  if (!answers || typeof answers !== 'object') {
    throw new BadRequestError('Answers must be an object');
  }

  const questionMap = new Map((questions || []).map((question) => [question.id, question]));

  for (const [questionId, answer] of Object.entries(answers)) {
    const question = questionMap.get(questionId);

    if (!question) {
      throw new BadRequestError(`Answer provided for unknown question: ${questionId}`);
    }

    if (question.required && (answer === undefined || answer === null || answer === '')) {
      throw new BadRequestError(`Required question '${question.title}' must be answered`);
    }

    if (answer === undefined || answer === null || answer === '') {
      continue;
    }

    validateAnswerByType(question, answer);
  }

  for (const question of questions) {
    if (question.required && !(question.id in answers)) {
      throw new BadRequestError(`Required question '${question.title}' is missing`);
    }
  }
}

function validateAnswerByType(question, answer) {
  const maxAnswerLength = config.app.maxAnswerLength;

  switch (question.type) {
    case QuestionType.TEXT:
      if (typeof answer !== 'string') {
        throw new BadRequestError(`Answer for '${question.title}' must be a string`);
      }
      if (answer.length > maxAnswerLength) {
        throw new BadRequestError(`Answer for '${question.title}' is too long`);
      }
      break;
    case QuestionType.EMAIL:
      if (typeof answer !== 'string' || !/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(answer)) {
        throw new BadRequestError(`Answer for '${question.title}' must be a valid email`);
      }
      break;
    case QuestionType.MULTIPLE_CHOICE:
      if (typeof answer !== 'string') {
        throw new BadRequestError(`Answer for '${question.title}' must be a string`);
      }
      if (!question.options.includes(answer)) {
        throw new BadRequestError(`Answer for '${question.title}' must be one of the provided options`);
      }
      break;
    default:
      throw new BadRequestError(`Unknown question type: ${question.type}`);
  }
}

function validateEmailIfPresent(email) {
  if (email && !/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email)) {
    throw new BadRequestError('Invalid email format');
  }
}

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === 'object') {
    return Object.entries(input).reduce((accumulator, [key, value]) => {
      accumulator[key] = sanitizeInput(value);
      return accumulator;
    }, {});
  }
  return input;
}

module.exports = {
  QuestionType,
  validateFormSubmission,
  sanitizeInput,
};
