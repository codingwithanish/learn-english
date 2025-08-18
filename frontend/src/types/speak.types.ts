import { BaseEntity, SpeakType, SessionStatus } from './common.types';

export interface SpeakSession extends BaseEntity {
  id: string;
  user_id: string;
  subject: string;
  type: SpeakType;
  status: SessionStatus;
  speak_time: number; // seconds
  max_duration: number; // seconds
  audio_url?: string;
  transcript: string;
  evaluation_result?: SpeakEvaluation;
  tts_url?: string;
  metadata: SpeakSessionMetadata;
}

export interface SpeakSessionMetadata {
  audio_format: string;
  audio_duration: number;
  file_size_bytes: number;
  processing_time_ms: number;
  confidence_scores: number[];
  technical_details: {
    sample_rate: number;
    channels: number;
    bitrate: number;
  };
}

export interface SpeakEvaluation {
  overall_score: number;
  grammar: GrammarEvaluation;
  vocabulary: VocabularyEvaluation;
  pronunciation: PronunciationEvaluation;
  fluency: FluencyEvaluation;
  content: ContentEvaluation;
  feedback: EvaluationFeedback;
}

export interface GrammarEvaluation {
  score: number;
  errors: GrammarError[];
  suggestions: string[];
  strength_areas: string[];
}

export interface GrammarError {
  type: 'tense' | 'agreement' | 'word_order' | 'article' | 'preposition' | 'other';
  original_text: string;
  suggested_correction: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
  position_start: number;
  position_end: number;
}

export interface VocabularyEvaluation {
  score: number;
  word_count: number;
  unique_words: number;
  advanced_words: string[];
  repeated_words: string[];
  suggestions: VocabularySuggestion[];
}

export interface VocabularySuggestion {
  category: 'synonyms' | 'more_specific' | 'academic' | 'formal' | 'informal';
  original_word: string;
  alternatives: string[];
  context: string;
}

export interface PronunciationEvaluation {
  score: number;
  phoneme_scores: PhonemeScore[];
  word_level_scores: WordScore[];
  overall_clarity: number;
  accent_feedback?: string;
}

export interface PhonemeScore {
  phoneme: string;
  score: number;
  examples: string[];
  improvement_tips: string[];
}

export interface WordScore {
  word: string;
  score: number;
  syllables: SyllableScore[];
  stress_pattern_correct: boolean;
}

export interface SyllableScore {
  syllable: string;
  score: number;
  is_stressed: boolean;
  duration_ms: number;
}

export interface FluencyEvaluation {
  score: number;
  speaking_rate: number; // words per minute
  pause_analysis: PauseAnalysis;
  rhythm_score: number;
  intonation_score: number;
}

export interface PauseAnalysis {
  total_pauses: number;
  average_pause_duration: number;
  filled_pauses: number; // um, uh, etc.
  silent_pauses: number;
  appropriate_pauses: number;
}

export interface ContentEvaluation {
  score: number;
  relevance_to_topic: number;
  coherence: number;
  completeness: number;
  key_points_covered: string[];
  missing_elements: string[];
}

export interface EvaluationFeedback {
  strengths: string[];
  areas_for_improvement: string[];
  specific_recommendations: Recommendation[];
  next_practice_suggestions: string[];
}

export interface Recommendation {
  category: 'grammar' | 'vocabulary' | 'pronunciation' | 'fluency' | 'content';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  practice_exercises?: string[];
  resources?: string[];
}

// WebSocket message types
export interface WSMessage {
  type: string;
  timestamp?: string;
}

export interface WSStartMessage extends WSMessage {
  type: 'start';
  config: {
    subject: string;
    speak_time: number;
    type: SpeakType;
  };
}

export interface WSAudioMessage extends WSMessage {
  type: 'audio';
  sequence: number;
  payload_b64: string;
  is_final?: boolean;
}

export interface WSStopMessage extends WSMessage {
  type: 'stop';
  session_id: string;
}

export interface WSAckMessage extends WSMessage {
  type: 'ack';
  session_id: string;
  max_duration: number;
}

export interface WSInterimMessage extends WSMessage {
  type: 'interim';
  session_id: string;
  transcript: string;
  confidence: number;
}

export interface WSProcessingMessage extends WSMessage {
  type: 'processing';
  session_id: string;
  stage: 'transcription' | 'evaluation' | 'tts_generation';
  progress: number;
}

export interface WSFinalMessage extends WSMessage {
  type: 'final';
  session_id: string;
  evaluation_result: SpeakEvaluation;
  tts_url?: string;
  transcript: string;
}

export interface WSErrorMessage extends WSMessage {
  type: 'error';
  code: number;
  message: string;
  details?: Record<string, unknown>;
}

export type WSIncomingMessage = 
  | WSAckMessage 
  | WSInterimMessage 
  | WSProcessingMessage 
  | WSFinalMessage 
  | WSErrorMessage;

export type WSOutgoingMessage = 
  | WSStartMessage 
  | WSAudioMessage 
  | WSStopMessage;

// Media Recorder types
export interface MediaRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  error: string | null;
  duration: number;
  audioLevel: number;
}

export interface AudioChunk {
  data: Blob;
  sequence: number;
  timestamp: number;
  size: number;
}

export interface RecordingConfig {
  mimeType?: string;
  audioBitsPerSecond?: number;
  sampleRate?: number;
  channels?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

// Speaking session creation/management
export interface CreateSpeakSessionRequest {
  subject: string;
  type: SpeakType;
  speak_time: number;
  config?: RecordingConfig;
}

export interface SpeakSessionListParams {
  status?: SessionStatus;
  type?: SpeakType;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}