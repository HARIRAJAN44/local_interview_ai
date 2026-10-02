import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hrApi } from '../services/api';
import type { HRQuestion } from '../types';
import { Send, ArrowRight } from 'lucide-react';

export function HRPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<HRQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<HRQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [finalResults, setFinalResults] = useState<any>(null);
  const [questionHistory, setQuestionHistory] = useState<Array<{ question: string; answer: string; evaluation: any }>>([]);

  useEffect(() => {
    startInterview();
  }, [sessionId]);

  const startInterview = async () => {
    if (!sessionId) return;
    try {
      await hrApi.start(parseInt(sessionId));
      const questionsResponse = await hrApi.getQuestions(parseInt(sessionId));
      setQuestions(questionsResponse.data);
      if (questionsResponse.data.length > 0) {
        setCurrentQuestion(questionsResponse.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to start HR interview:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const response = await hrApi.submitAnswer({
        question_id: currentQuestion.id,
        answer,
      });
      setEvaluation(response.data);
      setQuestionHistory(prev => [...prev, { question: currentQuestion.question, answer, evaluation: response.data }]);
      
      const nextResponse = await hrApi.nextQuestion({
        session_id: parseInt(sessionId!),
        previous_question_id: currentQuestion.id,
        previous_answer: answer,
      });
      
      if (nextResponse.data.question_id) {
        const nextQ = questions.find(q => q.id === nextResponse.data.question_id);
        if (nextQ) {
          setCurrentQuestion(nextQ);
        } else {
          setCurrentQuestion({
            id: nextResponse.data.question_id,
            question: nextResponse.data.question,
            category: nextResponse.data.category,
            expected_concepts: [],
            order_index: questions.length,
          });
        }
      } else {
        finishInterview();
      }
      setAnswer('');
      setEvaluation(null);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const finishInterview = async () => {
    try {
      const response = await hrApi.getResults(parseInt(sessionId!));
      setFinalResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to get results:', error);
    }
  };

  const goToReport = () => {
    navigate(`/report/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (showResults && finalResults) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">HR Interview Complete!</h2>
          </div>
          <div className="card-body">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 bg-primary-100">
                <span className="text-4xl font-bold text-primary-600">
                  {finalResults.overall_score}%
                </span>
              </div>
              <p className="text-gray-600">{finalResults.answered} out of {finalResults.total_questions} questions answered</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Relevance', value: finalResults.average_relevance },
                { label: 'Technical Depth', value: finalResults.average_technical_depth },
                { label: 'Completeness', value: finalResults.average_completeness },
                { label: 'Structure', value: finalResults.average_structure },
              ].map((item) => (
                <div key={item.label} className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-primary-600">{item.value}%</p>
                </div>
              ))}
            </div>

            <div className="mb-6 p-4 bg-green-50 rounded-xl">
              <h4 className="font-medium text-green-800 mb-2">STAR Compliance</h4>
              <p className="text-sm text-green-700">{finalResults.star_compliance}% of answers followed STAR format</p>
            </div>

            <button onClick={goToReport} className="btn-primary w-full">
              View Full Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center py-12">No questions available</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">HR / Technical Interview</h2>
              <p className="text-sm text-gray-600">Question {questionHistory.length + 1}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${currentQuestion.category === 'technical' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              {currentQuestion.category}
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            <div className="bg-primary-50 p-6 rounded-xl">
              <p className="text-lg text-gray-900">{currentQuestion.question}</p>
            </div>

            {evaluation && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-2">Quick Feedback</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Relevance</p>
                    <p className="font-bold text-primary-600">{evaluation.relevance_score?.toFixed(1) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Technical Depth</p>
                    <p className="font-bold text-primary-600">{evaluation.technical_depth_score?.toFixed(1) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completeness</p>
                    <p className="font-bold text-primary-600">{evaluation.completeness_score?.toFixed(1) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Structure</p>
                    <p className="font-bold text-primary-600">{evaluation.structure_score?.toFixed(1) || 0}%</p>
                  </div>
                </div>
                {evaluation.feedback && (
                  <p className="text-sm text-gray-600 mt-3">{evaluation.feedback}</p>
                )}
              </div>
            )}

            <div>
              <label className="label">Your Answer</label>
              <textarea
                className="input min-h-[120px]"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your response here..."
                disabled={submitting}
              />
            </div>

            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={submitting || !answer.trim()}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
              >
                <Send className="h-5 w-5" />
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {questionHistory.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Interview History</h2>
          </div>
          <div className="card-body p-0">
            <div className="divide-y divide-gray-200">
              {questionHistory.slice().reverse().map((item, idx) => (
                <div key={idx} className="p-4">
                  <p className="font-medium text-gray-900 mb-2">Q: {item.question}</p>
                  <p className="text-gray-700 mb-2">A: {item.answer}</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Relevance: {item.evaluation.relevance_score?.toFixed(1)}%</span>
                    <span>Technical: {item.evaluation.technical_depth_score?.toFixed(1)}%</span>
                    <span>Complete: {item.evaluation.completeness_score?.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}