import axios from 'axios';
import type {
  Profile,
  Resume,
  JobDescription,
  InterviewConfig,
  InterviewSession,
  AptitudeQuestion,
  CodingQuestion,
  CodingRunResult,
  GDTopic,
  HRQuestion,
  ReportSummary,
  AISettings,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const profileApi = {
  list: () => api.get<Profile[]>('/profile'),
  get: (id: number) => api.get<Profile>(`/profile/${id}`),
  create: (data: Partial<Profile>) => api.post<Profile>('/profile', data),
  update: (id: number, data: Partial<Profile>) => api.put<Profile>(`/profile/${id}`, data),
  delete: (id: number) => api.delete(`/profile/${id}`),
};

export const resumeApi = {
  upload: (profileId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile_id', profileId.toString());
    return api.post<Resume>('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: (id: number) => api.get<Resume>(`/resume/${id}`),
  list: (profileId: number) => api.get<Resume[]>(`/resume/profile/${profileId}`),
  delete: (id: number) => api.delete(`/resume/${id}`),
};

export const jobDescriptionApi = {
  create: (data: { profile_id?: number; title?: string; company?: string; raw_text: string }) =>
    api.post<JobDescription>('/job-description', data),
  get: (id: number) => api.get<JobDescription>(`/job-description/${id}`),
  list: (profileId: number) => api.get<JobDescription[]>(`/job-description/profile/${profileId}`),
  delete: (id: number) => api.delete(`/job-description/${id}`),
  parse: (raw_text: string) => api.post('/job-description/parse', { raw_text }),
};

export const interviewApi = {
  start: (data: { profile_id: number; job_description_id?: number; configuration: InterviewConfig }) =>
    api.post<InterviewSession>('/interview/start', data),
  get: (id: number) => api.get<InterviewSession>(`/interview/${id}`),
  list: (profileId?: number) => api.get<InterviewSession[]>('/interview', { params: { profile_id: profileId } }),
  pause: (id: number) => api.post(`/interview/${id}/pause`),
  resume: (id: number) => api.post(`/interview/${id}/resume`),
  delete: (id: number) => api.delete(`/interview/${id}`),
};

export const aptitudeApi = {
  getQuestions: (sessionId: number) => api.get<AptitudeQuestion[]>(`/aptitude/session/${sessionId}/questions`),
  submitAnswer: (data: { question_id: number; selected_option: string; notes?: string }) =>
    api.post('/aptitude/answer', data),
  getResults: (sessionId: number) => api.get(`/aptitude/session/${sessionId}/results`),
};

export const codingApi = {
  getQuestions: (sessionId: number) => api.get<CodingQuestion[]>(`/coding/session/${sessionId}/questions`),
  runCode: (data: { question_id: number; language: string; code: string }) =>
    api.post<CodingRunResult>('/coding/run', data),
  submitCode: (data: { question_id: number; language: string; code: string }) =>
    api.post<CodingRunResult>('/coding/submit', data),
  getResults: (sessionId: number) => api.get(`/coding/session/${sessionId}/results`),
};

export const communicationApi = {
  getGDTopic: (sessionId: number) => api.get<GDTopic>(`/communication/session/${sessionId}/topic`),
  saveTranscript: (data: { question_id: number; transcript: string; audio_file_path?: string; duration_seconds?: number; language?: string; confidence?: number; segments?: any[] }) =>
    api.post('/communication/transcript', data),
  getResults: (sessionId: number) => api.get(`/communication/session/${sessionId}/results`),
};

export const hrApi = {
  getQuestions: (sessionId: number) => api.get<HRQuestion[]>(`/hr/session/${sessionId}/questions`),
  start: (sessionId: number) => api.post(`/hr/session/${sessionId}/start`),
  submitAnswer: (data: { question_id: number; answer: string }) => api.post('/hr/answer', data),
  nextQuestion: (data: { session_id: number; previous_question_id?: number; previous_answer?: string }) =>
    api.post('/hr/next-question', data),
  getResults: (sessionId: number) => api.get(`/hr/session/${sessionId}/results`),
};

export const reportsApi = {
  generate: (sessionId: number) => api.post(`/reports/session/${sessionId}/generate`),
  get: (sessionId: number) => api.get(`/reports/session/${sessionId}`),
  summary: (sessionId: number) => api.get<ReportSummary>(`/reports/session/${sessionId}/summary`),
};

export const settingsApi = {
  getAI: () => api.get<AISettings>('/settings/ai'),
  testAI: (provider?: string) => api.post('/settings/ai/test', null, { params: { provider } }),
  listOllamaModels: () => api.get('/settings/ollama/models'),
  pullOllamaModel: (modelName: string) => api.post('/settings/ollama/pull', null, { params: { model_name: modelName } }),
  getSystemInfo: () => api.get('/settings/system/info'),
  listOpenRouterModels: () => api.get('/settings/openrouter/models'),
  listFreeModels: () => api.get('/settings/openrouter/free'),
  testOllamaGeneration: (model: string, prompt?: string) => api.post('/settings/ollama/test-generation', { model, prompt }),
};

export default api;