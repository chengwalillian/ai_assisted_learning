import React, { useState } from 'react';
import { api } from '../api/client';
import { Send, Loader2, Lightbulb, RefreshCw, Sparkles, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

const TOPICS = [
  'Python Programming',
  'Machine Learning',
  'Web Development',
  'Data Science',
  'Artificial Intelligence',
  'Cloud Computing'
];

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

function QuizInterface({ studentId, onAnswerSubmit }) {
  const [topic, setTopic] = useState('Python Programming');
  const [difficulty, setDifficulty] = useState('medium');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [openAccordion, setOpenAccordion] = useState(null);

  const generateNewQuestion = async () => {
    setLoading(true);
    setResult(null);
    setFeedback(null);
    setStudentAnswer('');
    setOpenAccordion(null);

    try {
      const response = await api.generateQuestion(topic, difficulty, previousQuestions);
      const newQuestion = response.data;
      setPreviousQuestions(prev => [...prev.slice(-4), newQuestion.question]);
      setCurrentQuestion(newQuestion);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to generate question:', err);
      alert('Failed to generate question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim()) {
      alert('Please enter your answer');
      return;
    }

    setLoading(true);
    const timeTaken = (Date.now() - startTime) / 1000;

    try {
      const submission = {
        student_id: studentId,
        topic: topic,
        difficulty: difficulty,
        question: currentQuestion.question,
        student_answer: studentAnswer,
        correct_answer: currentQuestion.correct_answer,
        time_taken_seconds: timeTaken
      };

      const response = await api.submitAnswer(submission);
      setResult(response.data);
      setFeedback(response.data.ai_feedback);
      onAnswerSubmit();
    } catch (err) {
      console.error('Failed to submit answer:', err);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (panel) => {
    setOpenAccordion(openAccordion === panel ? null : panel);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-white"
              disabled={loading}
            >
              {TOPICS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-white"
              disabled={loading}
            >
              {DIFFICULTY_LEVELS.map(d => (
                <option key={d} value={d}>{d.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateNewQuestion}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {topic} • {difficulty.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-800 text-sm mb-4">{currentQuestion.question}</p>

          {currentQuestion.options && (
            <div className="space-y-2 mb-4">
              {currentQuestion.options.map((option, idx) => {
                const optionLetter = String.fromCharCode(65 + idx);
                const isSelected = studentAnswer === option;
                return (
                  <div
                    key={idx}
                    className={`p-3 border rounded-lg cursor-pointer text-sm ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setStudentAnswer(option)}
                  >
                    <span className="font-medium mr-2">{optionLetter}.</span>
                    {option}
                  </div>
                );
              })}
            </div>
          )}

          {!currentQuestion.options && (
            <textarea
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              className="w-full p-3 text-sm border border-gray-200 rounded-lg mb-4"
              rows="3"
              placeholder="Type your answer..."
              disabled={loading}
            />
          )}

          <button
            onClick={handleSubmitAnswer}
            disabled={loading || !studentAnswer}
            className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </button>
        </div>
      )}

      {/* Result with Accordions */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Result Header - Always Visible */}
          <div className={`p-3 flex items-center gap-2 ${
            result.is_correct ? 'bg-green-50' : 'bg-orange-50'
          }`}>
            {result.is_correct ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-orange-600" />
            )}
            <span className={`font-medium ${
              result.is_correct ? 'text-green-700' : 'text-orange-700'
            }`}>
              {result.is_correct ? 'Correct!' : 'Incorrect'}
            </span>
          </div>

          {/* Your Answer Accordion */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => toggleAccordion('your')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-700">Your Answer</span>
              {openAccordion === 'your' ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {openAccordion === 'your' && (
              <div className="px-3 pb-3">
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {studentAnswer}
                </p>
              </div>
            )}
          </div>

          {/* Correct Answer Accordion */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => toggleAccordion('correct')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-green-700">Correct Answer</span>
              {openAccordion === 'correct' ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {openAccordion === 'correct' && (
              <div className="px-3 pb-3">
                <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  {currentQuestion?.correct_answer || result.correct_answer}
                </p>
              </div>
            )}
          </div>

          {/* AI Explanation Accordion */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => toggleAccordion('ai')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                AI Explanation
              </span>
              {openAccordion === 'ai' ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {openAccordion === 'ai' && (
              <div className="px-3 pb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback}</p>
                {result.follow_up_question && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    <strong>Practice:</strong> {result.follow_up_question}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Next Question Button */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={generateNewQuestion}
              className="w-full py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center justify-center"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Next Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizInterface;