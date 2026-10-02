import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { reportsApi } from '../services/api';
import type { } from '../types';
import { 
  Brain, Code, MessageSquare, Users, 
  Download, FileText, AlertCircle, Lightbulb, Calendar
} from 'lucide-react';

export function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    if (!sessionId) return;
    try {
      const [reportRes] = await Promise.all([
        reportsApi.get(parseInt(sessionId)),
      ]);
      setReport(reportRes.data.report_data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load report:', error);
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await reportsApi.exportPdf(parseInt(sessionId!));
      alert('PDF exported successfully!');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      await reportsApi.exportJson(parseInt(sessionId!));
      alert('JSON exported successfully!');
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert('Failed to export JSON');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-12">Report not found</div>;
  }

  const candidate = report.candidate || {};
  const rounds = report.rounds || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Report</h1>
          <p className="text-gray-600 mt-1">{candidate.name} - {candidate.target_role}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportJson} disabled={exporting} className="btn-secondary">
            <FileText className="h-4 w-4 mr-2" />
            Export JSON
          </button>
          <button onClick={handleExportPdf} disabled={exporting} className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Overall Performance</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <div className="text-3xl font-bold text-primary-600">{report.overall_score || 'N/A'}</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            {[
              { key: 'aptitude', label: 'Aptitude', icon: Brain, color: 'bg-blue-500' },
              { key: 'coding', label: 'Coding', icon: Code, color: 'bg-green-500' },
              { key: 'communication', label: 'Communication', icon: MessageSquare, color: 'bg-purple-500' },
              { key: 'hr', label: 'HR Interview', icon: Users, color: 'bg-orange-500' },
            ].map((round) => (
              <div key={round.key} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${round.color}`}>
                  <round.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{rounds[round.key]?.score || 'N/A'}</div>
                <div className="text-sm text-gray-600">{round.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-2">Candidate Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-600">Name</dt><dd className="font-medium">{candidate.name}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-600">Target Role</dt><dd className="font-medium">{candidate.target_role}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-600">Target Company</dt><dd className="font-medium">{candidate.target_company}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-600">Experience</dt><dd className="font-medium">{candidate.experience_level}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(rounds).map(([roundKey, roundData]: [string, any]) => (
          <div key={roundKey} className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{roundKey} Round</h3>
            </div>
            <div className="card-body">
              {roundKey === 'aptitude' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-green-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Correct</p>
                      <p className="text-2xl font-bold text-green-600">{roundData.correct}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Wrong</p>
                      <p className="text-2xl font-bold text-red-600">{roundData.wrong}</p>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Accuracy</p>
                      <p className="text-2xl font-bold text-primary-600">{roundData.accuracy}%</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Category Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(roundData.category_breakdown || {}).map(([cat, score]) => (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{cat}</span>
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
                </div>
              )}

              {roundKey === 'coding' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-green-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Passed</p>
                      <p className="text-2xl font-bold text-green-600">{roundData.passed}/{roundData.total_problems}</p>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Avg Score</p>
                      <p className="text-2xl font-bold text-primary-600">{roundData.average_score || 0}%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {roundData.problem_details?.map((prob: any) => (
                      <div key={prob.title} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{prob.title}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${prob.passed_tests === prob.total_tests ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {prob.passed_tests}/{prob.total_tests} tests
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roundKey === 'communication' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Content', value: roundData.content },
                    { label: 'Clarity', value: roundData.clarity },
                    { label: 'Fluency', value: roundData.fluency },
                    { label: 'Vocabulary', value: roundData.vocabulary },
                    { label: 'Structure', value: roundData.structure },
                    { label: 'Relevance', value: roundData.relevance },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">{item.label}</p>
                      <p className="text-2xl font-bold text-primary-600">{item.value || 0}</p>
                    </div>
                  ))}
                </div>
              )}

              {roundKey === 'hr' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Technical', value: roundData.technical_score },
                      { label: 'Communication', value: roundData.communication_score },
                      { label: 'Completeness', value: roundData.completeness_score },
                      { label: 'Structure', value: roundData.structure_score },
                    ].map((item) => (
                      <div key={item.label} className="p-3 bg-gray-50 rounded-xl text-center">
                        <p className="text-sm text-gray-600">{item.label}</p>
                        <p className="text-2xl font-bold text-primary-600">{item.value || 0}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-800">STAR Compliance: {roundData.star_compliance || 0}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {report.mistakes && report.mistakes.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Key Mistakes
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {report.mistakes.slice(0, 10).map((mistake: any, idx: number) => (
                <div key={idx} className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{mistake.problem}</p>
                      <p className="text-sm text-gray-600 mt-1">{mistake.category} \u2022 {mistake.round} \u2022 Severity: {mistake.severity}</p>
                      {mistake.improvement && <p className="text-sm text-gray-700 mt-2"><strong>Improvement:</strong> {mistake.improvement}</p>}
                      {mistake.example_better_answer && <p className="text-sm text-gray-700 mt-2"><strong>Better Answer:</strong> {mistake.example_better_answer}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {report.recommendations && report.recommendations.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Recommendations
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {report.recommendations.slice(0, 10).map((rec: any, idx: number) => (
                <div key={idx} className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">{rec.category}</span>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">Priority: {rec.priority}</span>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">{rec.estimated_days} days</span>
                      </div>
                      {rec.resources && rec.resources.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          Resources: {rec.resources.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {report.improvement_plan && Object.keys(report.improvement_plan).length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Improvement Plan
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {Object.entries(report.improvement_plan).map(([day, plan]: [string, any]) => (
                <div key={day} className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <h4 className="font-medium text-gray-900 mb-2">{day}: {plan.focus}</h4>
                  <p className="text-sm text-gray-600 mb-2">Current Score: {plan.current_score?.toFixed(1) || 'N/A'}%</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {plan.activities?.map((act: string, i: number) => <li key={i}>{act}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}