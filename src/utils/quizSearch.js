// Quiz search utility using the scraped Yakle data
import quizData from '../../yakle-quizzes-full.json'

export function searchQuizzes(query) {
  if (!query || query.trim().length < 2) return []

  const queryLower = query.toLowerCase()
  const matches = []

  for (const quiz of quizData) {
    for (let i = 0; i < (quiz.questions || []).length; i++) {
      const q = quiz.questions[i]
      const questionText = q.question || ''
      const answers = q.answers || []
      const answersText = answers.join(', ')

      // Search in question
      if (questionText.toLowerCase().includes(queryLower)) {
        matches.push({
          quiz_name: quiz.name,
          url: quiz.url,
          question_number: i + 1,
          question: questionText,
          answers: answers,
          match_type: 'question',
          total_questions: quiz.questions.length
        })
      }
      // Search in answers
      else if (answersText.toLowerCase().includes(queryLower)) {
        matches.push({
          quiz_name: quiz.name,
          url: quiz.url,
          question_number: i + 1,
          question: questionText,
          answers: answers,
          match_type: 'answer',
          total_questions: quiz.questions.length
        })
      }
    }
  }

  return matches
}

export function getAllQuizzes() {
  return quizData.map(q => ({
    name: q.name,
    url: q.url,
    questionCount: q.numberOfQuestions
  }))
}
