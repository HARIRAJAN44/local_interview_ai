import { useEffect, useState } from 'react';
import { profileApi } from '../services/api';
import type { Profile } from '../types';
import { Plus, Save, Trash2, Edit2 } from 'lucide-react';

export function ProfilePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    college: '',
    degree: '',
    branch: '',
    graduation_year: new Date().getFullYear(),
    programming_languages: [],
    frameworks: [],
    databases: [],
    projects: [],
    skills: [],
    experience: '',
    achievements: '',
    target_role: '',
    target_company: '',
    experience_level: 'fresher',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileApi.list();
      setProfiles(response.data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, value: string) => {
    const arr = formData[field as keyof typeof formData] as string[] || [];
    const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    setFormData(prev => ({ ...prev, [field]: newArr }));
  };

  const startEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setFormData(profile);
  };

  const startNewProfile = () => {
    setEditingId(0); // 0 means "new profile" mode
    setFormData({
      name: '',
      college: '',
      degree: '',
      branch: '',
      graduation_year: new Date().getFullYear(),
      programming_languages: [],
      frameworks: [],
      databases: [],
      projects: [],
      skills: [],
      experience: '',
      achievements: '',
      target_role: '',
      target_company: '',
      experience_level: 'fresher',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      college: '',
      degree: '',
      branch: '',
      graduation_year: new Date().getFullYear(),
      programming_languages: [],
      frameworks: [],
      databases: [],
      projects: [],
      skills: [],
      experience: '',
      achievements: '',
      target_role: '',
      target_company: '',
      experience_level: 'fresher',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId && editingId > 0) {
        await profileApi.update(editingId, formData);
      } else {
        await profileApi.create(formData);
      }
      cancelEdit();
      loadProfiles();
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      await profileApi.delete(id);
      loadProfiles();
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const techFields = [
    { label: 'Programming Languages', field: 'programming_languages', suggestions: ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'SQL'] },
    { label: 'Frameworks', field: 'frameworks', suggestions: ['React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot'] },
    { label: 'Databases', field: 'databases', suggestions: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Elasticsearch'] },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
          <p className="text-gray-600 mt-1">Manage your candidate profiles</p>
        </div>
        <button
          onClick={startNewProfile}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Profile
        </button>
      </div>

      {editingId !== null && editingId !== undefined && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Profile' : 'Create Profile'}
            </h2>
            <button onClick={cancelEdit} className="btn-ghost">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="label">Full Name *</label>
                <input id="name" type="text" required className="input" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
              </div>
              <div>
                <label htmlFor="target_role" className="label">Target Role *</label>
                <input id="target_role" type="text" required className="input" value={formData.target_role} onChange={(e) => handleInputChange('target_role', e.target.value)} placeholder="e.g., Backend Developer" />
              </div>
              <div>
                <label htmlFor="college" className="label">College</label>
                <input id="college" type="text" className="input" value={formData.college} onChange={(e) => handleInputChange('college', e.target.value)} />
              </div>
              <div>
                <label htmlFor="degree" className="label">Degree</label>
                <input id="degree" type="text" className="input" value={formData.degree} onChange={(e) => handleInputChange('degree', e.target.value)} />
              </div>
              <div>
                <label htmlFor="branch" className="label">Branch</label>
                <input id="branch" type="text" className="input" value={formData.branch} onChange={(e) => handleInputChange('branch', e.target.value)} />
              </div>
              <div>
                <label htmlFor="graduation_year" className="label">Graduation Year</label>
                <input id="graduation_year" type="number" className="input" value={formData.graduation_year} onChange={(e) => handleInputChange('graduation_year', parseInt(e.target.value))} min={1990} max={2030} />
              </div>
              <div>
                <label htmlFor="target_company" className="label">Target Company</label>
                <input id="target_company" type="text" className="input" value={formData.target_company} onChange={(e) => handleInputChange('target_company', e.target.value)} />
              </div>
              <div>
                <label htmlFor="experience_level" className="label">Experience Level</label>
                <select id="experience_level" className="input" value={formData.experience_level} onChange={(e) => handleInputChange('experience_level', e.target.value)}>
                  <option value="fresher">Fresher (0 years)</option>
                  <option value="junior">Junior (1-2 years)</option>
                  <option value="mid">Mid-level (3-5 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                </select>
              </div>
            </div>

            {techFields.map(({ label, field, suggestions }) => (
              <div key={field} className="space-y-2">
                <label className="label">{label}</label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleArrayChange(field, suggestion)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        (formData[field as keyof typeof formData] as string[] || []).includes(suggestion)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <label className="label">Experience</label>
              <textarea className="input min-h-[100px]" value={formData.experience} onChange={(e) => handleInputChange('experience', e.target.value)} placeholder="Describe your work experience..." />
            </div>

            <div className="space-y-2">
              <label className="label">Achievements</label>
              <textarea className="input min-h-[80px]" value={formData.achievements} onChange={(e) => handleInputChange('achievements', e.target.value)} placeholder="List your achievements, awards, certifications..." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={cancelEdit} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Your Profiles</h2>
        </div>
        <div className="card-body p-0">
          {profiles.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No profiles created yet. Click "Add Profile" to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {profiles.map((profile) => (
                <div key={profile.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                      <p className="text-sm text-gray-600">{profile.target_role} • {profile.experience_level}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.programming_languages.slice(0, 5).map((lang) => (
                          <span key={lang} className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">{lang}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(profile)} className="btn-ghost p-2" aria-label="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(profile.id)} className="btn-ghost p-2 text-red-600 hover:bg-red-50" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}