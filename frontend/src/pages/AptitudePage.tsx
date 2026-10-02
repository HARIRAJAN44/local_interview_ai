import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aptitudeApi } from '../services/api';
import type { AptitudeQuestion } from '../types';
import { ChevronLeft, ChevronRight, Check, X, Clock } from 'lucide-react';

export function AptitudePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [sessionId]);

  const loadQuestions = async () => {
    if (!sessionId) return;
    try {
      const response = await aptitudeApi.getQuestions(parseInt(sessionId));
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async (option: string) => {
    if (!currentQuestion || submitted[currentQuestion.id]) return;
    setSubmitting(true);
    try {
      await aptitudeApi.submitAnswer({
        question_id: currentQuestion.id,
        selected_option: option,
        notes: notes[currentQuestion.id],
      });
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
      setSubmitted(prev => ({ ...prev, [currentQuestion.id]: true }));
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishRound();
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const finishRound = async () => {
    try {
      const response = await aptitudeApi.getResults(parseInt(sessionId!));
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to get results:', error);
    }
  };

  const goToCoding = () => {
    navigate(`/interview/coding/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Aptitude Round Complete!</h2>
          </div>
          <div className="card-body">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                results.score >= 80 ? 'bg-green-100' : results.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <span className={`text-4xl font-bold ${results.score >= 80 ? 'text-green-600' : results.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {results.score}%
                </span>
              </div>
              <p className="text-gray-600">{results.correct} out of {results.total_questions} correct</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Correct</p>
                <p className="text-2xl font-bold text-green-600">{results.correct}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Wrong</p>
                <p className="text-2xl font-bold text-red-600">{results.wrong}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-primary-600">{results.score}%</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Category Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(results.category_breakdown).map(([category, score]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full bg-primary-600 rounded" style={{ width: `${score}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">{(score as number).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={goToCoding} className="btn-primary w-full">
              Continue to Coding Round
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center py-12">No questions available</div>;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Aptitude Round</h2>
              <p className="text-sm text-gray-600">Question {currentIndex + 1} of {questions.length}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{currentQuestion.time_limit}s</span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="mb-4 h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">{currentQuestion.category}</span>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">{currentQuestion.difficulty}</span>
                </div>
                <p className="text-lg text-gray-900 mb-4">{currentQuestion.question}</p>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = answers[currentQuestion.id] === letter;
                    const isSubmitted = submitted[currentQuestion.id];
                    const isCorrect = isSubmitted && currentQuestion.correct_answer === letter;
                    const showCorrect = isSubmitted && isCorrect;
                    const showWrong = isSubmitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={letter}
                        onClick={() => handleAnswer(letter)}
                        disabled={isSubmitted || submitting}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                          isSubmitted
                            ? showCorrect
                              ? 'bg-green-50 border-green-300'
                              : showWrong
                              ? 'bg-red-50 border-red-300'
                              : 'bg-gray-50 border-gray-200'
                            : isSelected
                            ? 'bg-primary-50 border-primary-300'
                            : 'bg-white border-gray-200 hover:border-primary-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                            isSubmitted
                              ? showCorrect
                                ? 'border-green-500 bg-green-500 text-white'
                                : showWrong
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-gray-300 text-gray-400'
                              : isSelected
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-gray-300 text-gray-400'
                          }`}>
                            {showCorrect ? <Check className="h-4 w-4" /> : showWrong ? <X className="h-4 w-4" /> : letter}
                          </div>
                          <span className="text-gray-900">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="label">Your Notes</label>
                <textarea
                  className="input min-h-[100px]"
                  value={notes[currentQuestion.id] || ''}
                  onChange={(e) => setNotes(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                  placeholder="Write your reasoning, formulas, or notes here..."
                  disabled={submitted[currentQuestion.id]}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-4 rounded-xl border border-gray-200 sticky top-24">
                <h3 className="font-medium text-gray-900 mb-3">Question Navigator</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {questions.map((q, idx) => {
                    const isAnswered = submitted[q.id];
                    const isCurrent = idx === currentIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          isCurrent
                            ? 'bg-primary-600 text-white'
                            : isAnswered
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <button onClick={goPrevious} disabled={currentIndex === 0} className="btn-secondary w-full">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </button>
                  <button onClick={goNext} className="btn-primary w-full">
                    {currentIndex === questions.length - 1 ? 'Finish Round' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}