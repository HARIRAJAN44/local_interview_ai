import { useState, useEffect } from 'react';
import { resumeApi, profileApi } from '../services/api';
import type { Profile, Resume } from '../types';
import { Upload, FileText, Trash2, Eye, Download } from 'lucide-react';

export function ResumePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

  const loadResumes = async (profileId: number) => {
    try {
      const response = await resumeApi.list(profileId);
      setResumes(response.data);
    } catch (error) {
      console.error('Failed to load resumes:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!selectedProfileId) return;
    
    const file = e.dataTransfer.files[0];
    if (file && ['.pdf', '.docx', '.txt'].includes('.' + file.name.split('.').pop()?.toLowerCase())) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProfileId) return;
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
    e.target.value = '';
  };

  const uploadFile = async (file: File) => {
    if (!selectedProfileId) return;
    setUploading(true);
    try {
      await resumeApi.upload(selectedProfileId, file);
      loadResumes(selectedProfileId);
    } catch (error) {
      console.error('Failed to upload resume:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeApi.delete(id);
      if (selectedProfileId) loadResumes(selectedProfileId);
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = parseInt(e.target.value);
    setSelectedProfileId(profileId);
    loadResumes(profileId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
          <p className="text-gray-600 mt-1">Upload and manage your resume</p>
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
              <option key={p.id} value={p.id}>{p.name} - {p.target_role}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedProfileId && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Upload Resume</h2>
          </div>
          <div className="card-body">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
              }`}
            >
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">
                  {dragActive ? 'Drop your resume here' : 'Drag & drop your resume, or click to browse'}
                </p>
                <p className="text-sm text-gray-500 mt-1">PDF, DOCX, or TXT (max 10MB)</p>
              </label>
              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
                  <span className="text-primary-600">Uploading and parsing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProfileId && resumes.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Uploaded Resumes</h2>
          </div>
          <div className="card-body p-0">
            <div className="divide-y divide-gray-200">
              {resumes.map((resume) => (
                <div key={resume.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{resume.filename}</p>
                      <p className="text-sm text-gray-600">
                        {resume.file_type.toUpperCase()} • {resume.extracted_skills.length} skills • {resume.extracted_projects.length} projects
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost p-2" aria-label="View details">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost p-2" aria-label="Download">
                      <Download className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(resume.id)} className="btn-ghost p-2 text-red-600 hover:bg-red-50" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedProfileId && resumes.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No resumes uploaded</h3>
            <p className="text-gray-600 mt-1">Upload your resume to enable AI-powered interview questions</p>
          </div>
        </div>
      )}
    </div>
  );
}