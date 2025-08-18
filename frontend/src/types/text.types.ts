import { BaseEntity, ResourceType, PaginationParams } from './common.types';

export interface TextResource extends BaseEntity {
  id: string;
  content: string;
  type: ResourceType;
  difficulty_level: number;
  rating: number;
  usage_count: number;
  tags: string[];
  metadata: TextResourceMetadata;
  examples?: TextExample[];
  is_favorite: boolean;
}

export interface TextResourceMetadata {
  word_count: number;
  readability_score: number;
  topic: string;
  source?: string;
  language_features: {
    grammar_points: string[];
    vocabulary_level: 'beginner' | 'intermediate' | 'advanced';
    sentence_complexity: 'simple' | 'compound' | 'complex';
  };
}

export interface TextExample {
  id: string;
  sentence: string;
  translation?: string;
  audio_url?: string;
  context?: string;
}

export interface ProcessTextRequest {
  text: string;
  context?: string;
  user_level?: 'beginner' | 'intermediate' | 'advanced';
  focus_areas?: string[];
}

export interface ProcessTextResponse {
  resource: TextResource;
  analysis: TextAnalysis;
  suggestions: string[];
  related_resources: TextResource[];
}

export interface TextAnalysis {
  type: ResourceType;
  explanation: string;
  key_points: string[];
  difficulty_assessment: {
    level: number;
    reasoning: string;
    areas_for_improvement: string[];
  };
  grammar_analysis?: GrammarAnalysis;
  vocabulary_analysis?: VocabularyAnalysis;
}

export interface GrammarAnalysis {
  structures: {
    pattern: string;
    explanation: string;
    examples: string[];
  }[];
  common_mistakes: string[];
  practice_suggestions: string[];
}

export interface VocabularyAnalysis {
  key_words: {
    word: string;
    definition: string;
    part_of_speech: string;
    frequency: 'common' | 'uncommon' | 'rare';
    synonyms: string[];
    antonyms: string[];
  }[];
  phrases: {
    phrase: string;
    meaning: string;
    usage_context: string;
  }[];
  collocations: string[];
}

export interface SearchTextParams extends PaginationParams {
  query: string;
  type?: ResourceType;
  difficulty_range?: [number, number];
  tags?: string[];
  include_favorites?: boolean;
  sort_by?: 'relevance' | 'rating' | 'created_at' | 'usage_count';
  sort_order?: 'asc' | 'desc';
}

export interface TextHistory extends BaseEntity {
  resource_id: string;
  resource: TextResource;
  interaction_type: 'search' | 'view' | 'favorite' | 'practice';
  duration_seconds?: number;
  completion_score?: number;
  notes?: string;
}

export interface FavoriteResource {
  id: string;
  resource_id: string;
  resource: TextResource;
  added_at: string;
  notes?: string;
  practice_count: number;
  last_practiced?: string;
}