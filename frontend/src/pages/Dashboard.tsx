import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, Code, MessageSquare, Users, TrendingUp, 
  Award, Target, Plus, ArrowRight
} from 'lucide-react';
import { interviewApi } from '../services/api';
import type { InterviewSession } from '../types';

export function Dashboard() {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    avgScore: 0,
    bestScore: 0,
  });

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const response = await interviewApi.list();
      const data = response.data;
      setInterviews(data);
      
      const completed = data.filter(i => i.status === 'completed');
      const scores = completed.map(i => i.overall_score || 0).filter(s => s > 0);
      setStats({
        total: data.length,
        completed: completed.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      });
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Interviews', value: stats.total, icon: Brain, color: 'bg-blue-500' },
    { label: 'Completed', value: stats.completed, icon: Award, color: 'bg-green-500' },
    { label: 'Avg Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Best Score', value: `${stats.bestScore}%`, icon: Target, color: 'bg-orange-500' },
  ];

  const roundCards = [
    { name: 'Aptitude', icon: Brain, color: 'bg-blue-100 text-blue-600', href: '/interview/config' },
    { name: 'Coding', icon: Code, color: 'bg-green-100 text-green-600', href: '/interview/config' },
    { name: 'Communication', icon: MessageSquare, color: 'bg-purple-100 text-purple-600', href: '/interview/config' },
    { name: 'HR Interview', icon: Users, color: 'bg-orange-100 text-orange-600', href: '/interview/config' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your interview preparation progress</p>
        </div>
        <Link to="/interview/config" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Mock Interview
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Interview Rounds</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roundCards.map((round) => (
              <Link key={round.name} to={round.href} className="group">
                <div className={`p-6 rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-colors ${round.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <round.icon className="h-8 w-8" />
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{round.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Practice this round</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Interviews</h2>
          <Link to="/report" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        <div className="card-body p-0">
          {interviews.length === 0 ? (
            <div className="p-12 text-center">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No interviews yet</h3>
              <p className="text-gray-600 mt-1">Start your first mock interview to see results here</p>
              <Link to="/interview/config" className="btn-primary mt-4 inline-flex">
                <Plus className="h-4 w-4 mr-2" />
                Start Interview
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {interviews.slice(0, 5).map((interview) => (
                <Link key={interview.id} to={`/report/${interview.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-100 rounded-xl">
                      <Brain className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {interview.profile?.name || 'Unknown'} - {interview.configuration?.target_role || 'Unknown Role'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(interview.created_at).toLocaleDateString()} · {interview.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {interview.overall_score !== null && interview.overall_score !== undefined ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        interview.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                        interview.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {interview.overall_score}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                        In Progress
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}