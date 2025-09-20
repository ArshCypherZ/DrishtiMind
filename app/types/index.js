/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} [email]
 * @property {string} [currentMood]
 * @property {UserResponse[]} responses
 */

/**
 * @typedef {Object} UserResponse
 * @property {string} questionId
 * @property {string|number} answer
 * @property {Date} timestamp
 */

/**
 * @typedef {Object} MoodEntry
 * @property {string} emoji
 * @property {Date} timestamp
 * @property {string} [context]
 */

/**
 * @typedef {Object} PerspectiveCard
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {'growth'|'kindness'|'action'} category
 * @property {string[]} relatedQuestions
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} text
 * @property {'text'|'emoji'|'scale'|'multiple-choice'} type
 * @property {string[]} [options]
 * @property {boolean} required
 */

/**
 * @typedef {Object} Screen
 * @property {string} id
 * @property {string} title
 * @property {string} [subtitle]
 * @property {React.ReactNode} content
 */

/**
 * @typedef {'home'|'perspective'|'understand'|'newways'|'profile'|'journal'} ViewType
 */

/**
 * @typedef {Object} AppState
 * @property {ViewType} currentView
 * @property {string} userInput
 * @property {string} selectedMood
 * @property {Record<string, string|number>} responses
 * @property {boolean} isLoading
 * @property {'input'|'understanding'|'solution'} perspectiveStage
 * @property {Question[]} aiQuestions
 * @property {number} currentQuestionIndex
 */

// Export empty object to maintain module structure
const types = {};
export default types; 