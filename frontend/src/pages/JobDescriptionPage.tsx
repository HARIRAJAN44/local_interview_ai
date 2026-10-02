import { useState, useEffect } from 'react';
import { jobDescriptionApi, profileApi } from '../services/api';
import type { Profile, JobDescription } from '../types';
import { Plus, Trash2, Edit2, ClipboardCopy } from 'lucide-react';

export function JobDescriptionPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJd, setEditingJd] = useState<JobDescription | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    raw_text: '',
  });
  const [loading, setLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileApi.list();
      setProfiles(response.data);
      if (response.data.length > 0 && !selectedProfileId) {
        setSelectedProfileId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const loadJds = async (profileId: number) => {
    try {
      const response = await jobDescriptionApi.list(profileId);
      setJds(response.data);
    } catch (error) {
      console.error('Failed to load job descriptions:', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = parseInt(e.target.value) || null;
    setSelectedProfileId(profileId);
    if (profileId) loadJds(profileId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;
    setLoading(true);
    try {
      await jobDescriptionApi.create({ ...formData, profile_id: selectedProfileId });
      resetForm();
      loadJds(selectedProfileId);
    } catch (error) {
      console.error('Failed to save JD:', error);
      alert('Failed to save job description');
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    if (!formData.raw_text.trim()) return;
    try {
      const response = await jobDescriptionApi.parse(formData.raw_text);
      setParsedPreview(response.data);
    } catch (error) {
      console.error('Failed to parse JD:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingJd(null);
    setFormData({ title: '', company: '', raw_text: '' });
    setParsedPreview(null);
  };

  const startEdit = (jd: JobDescription) => {
    setEditingJd(jd);
    setFormData({ title: jd.title || '', company: jd.company || '', raw_text: jd.raw_text || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job description?')) return;
    try {
      await jobDescriptionApi.delete(id);
      if (selectedProfileId) loadJds(selectedProfileId);
    } catch (error) {
      console.error('Failed to delete JD:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Description</h1>
          <p className="text-gray-600 mt-1">Add job descriptions for targeted interview preparation</p>
        </div>
        <button onClick={() => { setEditingJd(null); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Job Description
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Select Profile</h2>
        </div>
        <div className="card-body">
          <select value={selectedProfileId || ''} onChange={handleProfileChange} className="input w-auto">
            <option value="">Select a profile</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.target_role}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingJd ? 'Edit Job Description' : 'Add Job Description'}
            </h2>
            <button onClick={resetForm} className="btn-ghost">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="label">Job Title</label>
                <input id="title" type="text" className="input" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Senior Backend Engineer" />
              </div>
              <div>
                <label htmlFor="company" className="label">Company</label>
                <input id="company" type="text" className="input" value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} placeholder="e.g., Google" />
              </div>
            </div>

            <div>
              <label htmlFor="raw_text" className="label">Job Description Text *</label>
              <textarea
                id="raw_text"
                className="input min-h-[200px]"
                value={formData.raw_text}
                onChange={(e) => setFormData(prev => ({ ...prev, raw_text: e.target.value }))}
                placeholder="Paste the full job description here..."
              />
            </div>

            {parsedPreview && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Parsed Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Required Skills</p>
                    <p className="text-gray-600">{parsedPreview.required_skills?.join(', ') || 'None detected'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Preferred Skills</p>
                    <p className="text-gray-600">{parsedPreview.preferred_skills?.join(', ') || 'None detected'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Experience Required</p>
                    <p className="text-gray-600">{parsedPreview.experience_required || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Technical Topics</p>
                    <p className="text-gray-600">{parsedPreview.technical_topics?.join(', ') || 'None detected'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={handleParse} className="btn-secondary" disabled={!formData.raw_text.trim()}>
                Parse & Preview
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading || !formData.raw_text.trim()}>
                {loading ? 'Saving...' : (editingJd ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedProfileId && jds.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Job Descriptions</h2>
          </div>
          <div className="card-body p-0">
            <div className="divide-y divide-gray-200">
              {jds.map((jd) => (
                <div key={jd.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{jd.title || 'Untitled Position'}</h3>
                        {jd.company && <span className="text-sm text-gray-500">at {jd.company}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {jd.required_skills.slice(0, 5).map((skill) => (
                          <span key={skill} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Required: {skill}</span>
                        ))}
                        {jd.preferred_skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Preferred: {skill}</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        {jd.experience_required} • {jd.technical_topics.length} technical topics
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(jd)} className="btn-ghost p-2" aria-label="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleCopy(jd.raw_text || '')} className="btn-ghost p-2" aria-label="Copy">
                        <ClipboardCopy className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(jd.id)} className="btn-ghost p-2 text-red-600 hover:bg-red-50" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedProfileId && jds.length === 0 && !showForm && (
        <div className="card">
          <div className="card-body text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No job descriptions added</h3>
            <p className="text-gray-600 mt-1">Add a job description to tailor interview questions to specific roles</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Job Description
            </button>
          </div>
        </div>
      )}
    </div>
  );
}