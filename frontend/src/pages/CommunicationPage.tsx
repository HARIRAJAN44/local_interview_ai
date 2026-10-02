import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communicationApi } from '../services/api';
import type { GDTopic } from '../types';
import { Mic, MicOff, Send, Clock, ArrowRight } from 'lucide-react';

export function CommunicationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<GDTopic | null>(null);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    loadTopic();
  }, [sessionId]);

  const loadTopic = async () => {
    if (!sessionId) return;
    try {
      const response = await communicationApi.getGDTopic(parseInt(sessionId));
      setTopic(response.data);
      setTimer(response.data.time_limit_seconds);
      startTimer();
      setLoading(false);
    } catch (error) {
      console.error('Failed to load GD topic:', error);
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          stopRecording();
          finishRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('language', 'en');

        if (topic) {
          await communicationApi.transcribe(formData);
          // transcript will be saved via handleTranscriptSubmit when user clicks Submit Text
        }
      };

      recorder.start(1000);
      setRecording(true);
      setAudioChunks([]);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleTranscriptSubmit = async () => {
    if (!topic || !transcript.trim()) return;
    try {
      const response = await communicationApi.saveTranscript({
        question_id: topic.question_id,
        transcript,
        duration_seconds: topic.time_limit_seconds - timer,
        language: 'en',
      });
      const evalResponse = await communicationApi.evaluate(topic.question_id, response.data.id);
      setEvaluation(evalResponse.data);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to submit transcript:', error);
    }
  };

  const finishRound = async () => {
    stopRecording();
    if (transcript.trim() && topic) {
      await handleTranscriptSubmit();
    } else {
      setShowResults(true);
    }
  };

  const goToHR = () => {
    navigate(`/interview/hr/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!topic) {
    return <div className="text-center py-12">No GD topic available</div>;
  }

  if (showResults) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Communication Round Complete!</h2>
          </div>
          <div className="card-body">
            {evaluation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Content', value: evaluation.content_score, icon: '📝' },
                    { label: 'Clarity', value: evaluation.clarity_score, icon: '🎯' },
                    { label: 'Fluency', value: evaluation.fluency_score, icon: '🌊' },
                    { label: 'Vocabulary', value: evaluation.vocabulary_score, icon: '📚' },
                    { label: 'Structure', value: evaluation.structure_score, icon: '🏗️' },
                    { label: 'Relevance', value: evaluation.relevance_score, icon: '🔗' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-gray-50 rounded-xl text-center">
                      <span className="text-2xl">{item.icon}</span>
                      <p className="text-sm text-gray-600 mt-1">{item.label}</p>
                      <p className="text-2xl font-bold text-primary-600">{item.value?.toFixed(1) || 0}</p>
                    </div>
                  ))}
                </div>

                {evaluation.filler_word_count > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <h4 className="font-medium text-yellow-800 mb-2">Filler Words Detected</h4>
                    <p className="text-sm text-yellow-700">Count: {evaluation.filler_word_count}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {evaluation.filler_words.map((fw: any) => (
                        <span key={fw.word} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          {fw.word} ({fw.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={goToHR} className="btn-primary w-full mt-4">
                  Continue to HR Interview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No evaluation data available</p>
                <button onClick={goToHR} className="btn-primary mt-4">
                  Continue to HR Interview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Group Discussion</h2>
              <p className="text-sm text-gray-600">{topic.topic}</p>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className={`text-xl font-mono font-bold ${timer < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timer)}
              </span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="prose prose-sm max-w-none mb-6">
            <div dangerouslySetInnerHTML={{ __html: topic.description }} />
          </div>

          {topic.key_points.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Key Discussion Points</h3>
              <ul className="space-y-2">
                {topic.key_points.map((point, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">{i + 1}</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Your Response</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="label mb-2">Live Transcript</label>
                <textarea
                  className="input min-h-[120px]"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={recording ? 'Listening...' : 'Speak or type your response...'}
                  readOnly={recording}
                />
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={timer <= 0}
                  className={`btn-primary flex items-center gap-2 px-8 py-3 text-lg ${recording ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  {recording ? (
                    <>
                      <MicOff className="h-5 w-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 animate-pulse" />
                      Start Recording
                    </>
                  )}
                </button>

                <button
                  onClick={handleTranscriptSubmit}
                  disabled={!transcript.trim() || timer <= 0}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  Submit Text
                </button>
              </div>

              <p className="text-center text-sm text-gray-500">
                {recording ? 'Recording in progress... Speak clearly into your microphone.' : 'Click "Start Recording" to begin, or type your response and click "Submit Text".'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}