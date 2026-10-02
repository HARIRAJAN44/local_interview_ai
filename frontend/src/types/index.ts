export interface Profile {
  id: number;
  name: string;
  college?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  programming_languages: string[];
  frameworks: string[];
  databases: string[];
  projects: any[];
  skills: string[];
  experience?: string;
  achievements?: string;
  target_role?: string;
  target_company?: string;
  experience_level?: string;
}

export interface Resume {
  id: number;
  filename: string;
  file_type: string;
  parsed_sections: Record<string, string>;
  extracted_skills: string[];
  extracted_projects: any[];
  extracted_experience: any[];
  extracted_education: any[];
  extracted_achievements: any[];
  extracted_certifications: any[];
}

export interface JobDescription {
  id: number;
  title?: string;
  company?: string;
  raw_text?: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  experience_required?: string;
  technical_topics: string[];
}

export interface InterviewConfig {
  target_role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rounds: string[];
  aptitude_questions: number;
  coding_problems: number;
  gd_duration_minutes: number;
  hr_duration_minutes: number;
}

export interface InterviewSession {
  id: number;
  profile_id: number;
  profile?: Profile;
  job_description_id?: number;
  status: 'idle' | 'profile_ready' | 'aptitude' | 'coding' | 'communication' | 'hr' | 'evaluation' | 'report' | 'completed';
  current_round?: string;
  current_question_index: number;
  total_questions: number;
  configuration: InterviewConfig;
  started_at?: string;
  completed_at?: string;
  overall_score?: number;
  created_at: string;
}

export interface Question {
  id: number;
  session_id: number;
  round_id: number;
  question_type: 'aptitude' | 'coding' | 'gd_topic' | 'hr' | 'behavioral' | 'technical';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  content: Record<string, any>;
  correct_answer?: Record<string, any>;
  explanation?: string;
  category?: string;
  topics: string[];
  time_limit_seconds: number;
  order_index: number;
}

export interface AptitudeQuestion {
  id: number;
  question: string;
  options: string[];
  category: string;
  difficulty: string;
  time_limit: number;
  order_index: number;
}

export interface CodingQuestion {
  id: number;
  title: string;
  description: string;
  constraints: string[];
  examples: any[];
  starter_code: string;
  visible_test_cases: any[];
  difficulty: string;
  topics: string[];
  order_index: number;
}

export interface CodingRunResult {
  submission_id: number;
  status: string;
  stdout?: string;
  stderr?: string;
  compile_error?: string;
  execution_time_ms?: number;
  memory_used_kb?: number;
  test_results: any[];
  passed_tests: number;
  total_tests: number;
}

export interface GDTopic {
  question_id: number;
  topic: string;
  description: string;
  key_points: string[];
  time_limit_seconds: number;
}

export interface HRQuestion {
  id: number;
  question: string;
  category: string;
  expected_concepts: string[];
  order_index: number;
}

export interface ReportSummary {
  session_id: number;
  candidate_name: string;
  target_role: string;
  overall_score?: number;
  round_scores: Record<string, number>;
  mistakes_count: number;
  recommendations_count: number;
}

export interface ModelInfo {
  name: string;
  size?: string;
  parameters?: string;
  quantization?: string;
  context_length?: number;
  capabilities: string[];
}

export interface AISettings {
  provider: string;
  available_providers: string[];
  models: ModelInfo[];
  current_model?: string;
  temperature: number;
  context_length: number;
}