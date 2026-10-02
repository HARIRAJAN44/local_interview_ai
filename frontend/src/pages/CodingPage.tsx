import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { codingApi } from '../services/api';
import type { CodingQuestion, CodingRunResult } from '../types';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, ChevronLeft, ChevronRight, Terminal, ArrowRight } from 'lucide-react';

const LANGUAGE_MAP: Record<string, string> = {
  python: 'python',
  cpp: 'cpp',
  c: 'c',
  java: 'java',
};

export function CodingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CodingRunResult | null>(null);
  const [submissions, setSubmissions] = useState<Record<number, CodingRunResult>>({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [finalResults, setFinalResults] = useState<any>(null);

  useEffect(() => {
    loadQuestions();
  }, [sessionId]);

  const loadQuestions = async () => {
    if (!sessionId) return;
    try {
      const response = await codingApi.getQuestions(parseInt(sessionId));
      setQuestions(response.data);
      if (response.data.length > 0) {
        setCode(response.data[0].starter_code || '');
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleRun = async () => {
    if (!currentQuestion || running) return;
    setRunning(true);
    setResults(null);
    try {
      const response = await codingApi.runCode({
        question_id: currentQuestion.id,
        language,
        code,
      });
      setResults(response.data);
      setSubmissions(prev => ({ ...prev, [currentQuestion.id]: response.data }));
    } catch (error) {
      console.error('Failed to run code:', error);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || running) return;
    await handleRun();
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCode(questions[currentIndex + 1].starter_code || '');
      setResults(null);
    } else {
      finishRound();
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCode(questions[currentIndex - 1].starter_code || '');
      setResults(null);
    }
  };

  const finishRound = async () => {
    try {
      const response = await codingApi.getResults(parseInt(sessionId!));
      setFinalResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to get results:', error);
    }
  };

  const goToCommunication = () => {
    navigate(`/interview/communication/${sessionId}`);
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
            <h2 className="text-lg font-semibold text-gray-900">Coding Round Complete!</h2>
          </div>
          <div className="card-body">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                finalResults.passed_problems === finalResults.total_problems ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <span className="text-4xl font-bold text-primary-600">
                  {finalResults.passed_problems}/{finalResults.total_problems}
                </span>
              </div>
              <p className="text-gray-600">Average Score: {finalResults.average_score}%</p>
            </div>

            <div className="space-y-4 mb-6">
              {finalResults.submissions.map((sub: any) => (
                <div key={sub.question_id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Problem {sub.question_id}</p>
                      <p className="text-sm text-gray-600">{sub.language} \u2022 {sub.passed_tests}/{sub.total_tests} tests passed</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      sub.passed_tests === sub.total_tests ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sub.passed_tests === sub.total_tests ? 'Passed' : 'Partial'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={goToCommunication} className="btn-primary w-full">
              Continue to Communication Round
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center py-12">No coding problems available</div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="card flex-1 flex flex-col min-h-0">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Coding Round</h2>
              <p className="text-sm text-gray-600">Problem {currentIndex + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input w-auto py-1.5 text-sm"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-body flex-1 flex flex-col min-h-0 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 flex-1 min-h-0">
            <div className="lg:col-span-2 border-r border-gray-200 flex flex-col min-h-0">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{currentQuestion.title}</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: currentQuestion.description }} />
                </div>
                
                {currentQuestion.constraints.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Constraints</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {currentQuestion.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {currentQuestion.examples.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Examples</h4>
                    <div className="space-y-2">
                      {currentQuestion.examples.map((ex, i) => (
                        <div key={i} className="bg-gray-100 p-3 rounded-lg text-sm font-mono">
                          <p><strong>Input:</strong> {JSON.stringify(ex.input)}</p>
                          <p><strong>Output:</strong> {JSON.stringify(ex.output)}</p>
                          {ex.explanation && <p><strong>Explanation:</strong> {ex.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.visible_test_cases.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Visible Test Cases</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {currentQuestion.visible_test_cases.map((tc, i) => (
                        <div key={i} className="bg-gray-100 p-2 rounded text-sm font-mono">
                          Input: {JSON.stringify(tc.input)} \u2192 Expected: {JSON.stringify(tc.expected)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Editor</h3>
                <div className="flex items-center gap-2">
                  <button onClick={handleRun} disabled={running} className="btn-primary">
                    <Play className="h-4 w-4 mr-2" />
                    {running ? 'Running...' : 'Run'}
                  </button>
                  <button onClick={handleSubmit} disabled={running} className="btn-secondary">
                    <Terminal className="h-4 w-4 mr-2" />
                    Submit
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={LANGUAGE_MAP[language] || 'python'}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    tabSize: 2,
                    automaticLayout: true,
                  }}
                />
              </div>

              {results && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 max-h-60 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Test Results</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      results.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {results.passed_tests}/{results.total_tests} passed
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.test_results.map((tr: any, i: number) => (
                      <div key={i} className={`p-2 rounded text-sm font-mono ${tr.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {tr.passed ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <XCircle className="h-4 w-4 inline mr-1" />}
                        Test {i + 1}: {tr.passed ? 'Passed' : `Failed - Expected: ${tr.expected}, Got: ${tr.actual}`}
                        {tr.error && <span className="text-red-600"> - {tr.error}</span>}
                      </div>
                    ))}
                  </div>
                  {results.compile_error && (
                    <div className="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm font-mono">
                      Compile Error: {results.compile_error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button onClick={goPrevious} disabled={currentIndex === 0} className="btn-secondary">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </button>
        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setCode(questions[idx].starter_code || ''); setResults(null); }}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                idx === currentIndex ? 'bg-primary-600 text-white' :
                submissions[idx] ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <button onClick={goNext} className="btn-primary">
          {currentIndex === questions.length - 1 ? 'Finish Round' : 'Next'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
}