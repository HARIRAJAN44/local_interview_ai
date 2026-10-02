import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi, interviewApi } from '../services/api';
import type { Profile, InterviewConfig } from '../types';
import { Play, ArrowLeft } from 'lucide-react';

const defaultConfig: InterviewConfig = {
  target_role: '',
  difficulty: 'medium',
  rounds: ['aptitude', 'coding', 'communication', 'hr'],
  aptitude_questions: 20,
  coding_problems: 2,
  gd_duration_minutes: 10,
  hr_duration_minutes: 15,
};

const roundOptions = [
  { id: 'aptitude', name: 'Aptitude', icon: '🧠', description: 'Quantitative, Logical, Verbal questions' },
  { id: 'coding', name: 'Coding', icon: '💻', description: 'Algorithm & data structure problems' },
  { id: 'communication', name: 'Group Discussion', icon: '💬', description: 'Communication skills evaluation' },
  { id: 'hr', name: 'HR / Technical Interview', icon: '👥', description: 'Behavioral & technical deep-dive' },
];

export function InterviewConfigPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [config, setConfig] = useState<InterviewConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileApi.list();
      setProfiles(response.data);
      if (response.data.length > 0) {
        setSelectedProfileId(response.data[0].id);
        setConfig(prev => ({ ...prev, target_role: response.data[0].target_role || '' }));
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleConfigChange = (field: keyof InterviewConfig, value: any) => {
    if (typeof value === 'string' && value === '') return;
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleRound = (roundId: string) => {
    setConfig(prev => ({
      ...prev,
      rounds: prev.rounds.includes(roundId)
        ? prev.rounds.filter(r => r !== roundId)
        : [...prev.rounds, roundId],
    }));
  };

  const handleStart = async () => {
    console.log('handleStart called', { selectedProfileId, config, rounds: config.rounds });
    if (!selectedProfileId) {
      console.log('No profile selected');
      return;
    }
    if (config.rounds.length === 0) {
      console.log('No rounds selected');
      return;
    }
    if (!config.target_role) {
      console.log('No target role');
      return;
    }
    setLoading(true);
    try {
      console.log('Calling interviewApi.start...');
      const response = await interviewApi.start({
        profile_id: selectedProfileId,
        configuration: config,
      });
      console.log('Interview started, response:', response.data);
      navigate(`/interview/aptitude/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = parseInt(e.target.value);
    setSelectedProfileId(profileId);
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setConfig(prev => ({ ...prev, target_role: profile.target_role || '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Configuration</h1>
          <p className="text-gray-600 mt-1">Configure your mock interview rounds and difficulty</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Select Profile</h2>
        </div>
        <div className="card-body">
          <select value={selectedProfileId || ''} onChange={handleProfileChange} className="input w-auto">
            <option value="">Select a profile</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.target_role || 'No target role'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Interview Settings</h2>
        </div>
        <div className="card-body space-y-6">
          <div>
            <label htmlFor="target_role" className="label">Target Role *</label>
            <input
              id="target_role"
              type="text"
              className="input"
              value={config.target_role}
              onChange={(e) => handleConfigChange('target_role', e.target.value)}
              placeholder="e.g., Backend Developer, Full Stack Engineer"
              required
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="label">Difficulty Level</label>
            <select
              id="difficulty"
              className="input w-auto"
              value={config.difficulty}
              onChange={(e) => handleConfigChange('difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="label">Interview Rounds</label>
            <div className="space-y-3">
              {roundOptions.map((round) => {
                const isSelected = config.rounds.includes(round.id);
                return (
                  <label
                    key={round.id}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRound(round.id)}
                      className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{round.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{round.name}</p>
                          <p className="text-sm text-gray-600">{round.description}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.rounds.includes('aptitude') && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-medium text-blue-900 mb-3">Aptitude Round Settings</h3>
                <div>
                  <label htmlFor="aptitude_questions" className="label">Number of Questions</label>
<input
                      id="aptitude_questions"
                      type="number"
                      className="input w-auto"
                      value={config.aptitude_questions}
                      onChange={(e) => { const v = e.target.value; handleConfigChange('aptitude_questions', v ? parseInt(v) : 0); }}
                      min={5}
                      max={50}
                    />
                </div>
              </div>
            )}

            {config.rounds.includes('coding') && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <h3 className="font-medium text-green-900 mb-3">Coding Round Settings</h3>
                <div>
                  <label htmlFor="coding_problems" className="label">Number of Problems</label>
                  <input
                    id="coding_problems"
                    type="number"
                    className="input w-auto"
                    value={config.coding_problems}
                    onChange={(e) => { const v = e.target.value; handleConfigChange('coding_problems', v ? parseInt(v) : 0); }}
                    min={1}
                    max={5}
                  />
                </div>
              </div>
            )}

            {config.rounds.includes('communication') && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <h3 className="font-medium text-purple-900 mb-3">Communication Round Settings</h3>
                <div>
                  <label htmlFor="gd_duration_minutes" className="label">Duration (minutes)</label>
                  <input
                    id="gd_duration_minutes"
                    type="number"
                    className="input w-auto"
                    value={config.gd_duration_minutes}
                    onChange={(e) => { const v = e.target.value; handleConfigChange('gd_duration_minutes', v ? parseInt(v) : 0); }}
                    min={5}
                    max={30}
                  />
                </div>
              </div>
            )}

            {config.rounds.includes('hr') && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h3 className="font-medium text-orange-900 mb-3">HR Round Settings</h3>
                <div>
                  <label htmlFor="hr_duration_minutes" className="label">Duration (minutes)</label>
                  <input
                    id="hr_duration_minutes"
                    type="number"
                    className="input w-auto"
                    value={config.hr_duration_minutes}
                    onChange={(e) => { const v = e.target.value; handleConfigChange('hr_duration_minutes', v ? parseInt(v) : 0); }}
                    min={10}
                    max={60}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="btn-secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        <button onClick={handleStart} disabled={loading || !selectedProfileId || config.rounds.length === 0 || !config.target_role} className="btn-primary">
          <Play className="h-4 w-4 mr-2" />
          {loading ? 'Starting...' : 'Start Mock Interview'}
        </button>
      </div>
    </div>
  );
}