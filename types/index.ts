// User types
export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string | null;
  streak: number;
  totalSessions: number;
  reportsGenerated: number;
  coinsSpent: number;
  coinBalance: number;
}

// Session types
export type SessionType = 'ai-chat' | 'ai-call' | 'peer-chat' | 'peer-call';

export interface Session {
  id: string;
  type: SessionType;
  partnerId?: string;
  partnerName?: string;
  partnerAvatar?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  hasReport: boolean;
  reportId?: string;
}

// Enhanced Report types matching backend model and UI screenshots
export interface ConversationOverview {
  participants: Array<{
    name: string;
    role: 'user' | 'ai' | 'peer';
  }>;
  date: Date;
  duration: number; // in minutes
  scenario: string;
  excerpt: string;
  goal: 'Business' | 'Casual' | 'Academic';
}

export interface DetailedMetrics {
  fluencyCoherence: {
    score: number; // 0-10
    wordsPerMinute: number;
    pausesPerMinute: number;
    discourseMarkersUsed: number;
    analysis: string;
  };
  grammarAccuracy: {
    score: number; // 0-10
    errorTypes: string[];
    errorsPerHundredWords: number;
    transcriptExamples: Array<{
      original: string;
      corrected: string;
    }>;
  };
  vocabularyRange: {
    score: number; // 0-10
    lexicalDiversity: number;
    businessTerms: {
      used: string[];
      missing: string[];
    };
  };
  pronunciationIntelligibility: {
    score: number; // 0-10
    phonemeLevelErrors: number;
    intelligibilityRating: number; // 0-100
    commonChallenges: string;
    problematicWords: Array<{
      word: string;
      issue: string;
    }>;
  };
  pragmaticsRegister: {
    politenessStrategies: 'Appropriate' | 'Needs Improvement' | 'Excellent';
    formalityMatch: number; // 0-100
    turnTaking: 'Good' | 'Needs Improvement' | 'Excellent';
    analysis: string;
  };
}

export interface Strength {
  title: string;
  description: string;
}

export interface Improvement {
  title: string;
  description: string;
  action: string;
}

export interface ActionPlan {
  shortTerm: Array<{
    task: string;
    timeframe: string;
  }>;
  midTerm: Array<{
    task: string;
    timeframe: string;
  }>;
  resources: {
    apps: string[];
    podcasts: string[];
    worksheets: string[];
  };
}

export interface VisualsData {
  errorRateOverTime: Array<{
    time: string;
    errorRate: number;
  }>;
  skillProfile: Array<{
    skill: string;
    current: number;
    target: number;
  }>;
  vocabularyComparison: Array<{
    level: string;
    current: number;
    target: number;
  }>;
}

export interface ExportRecord {
  format: 'PDF' | 'CSV';
  generatedAt: Date;
  downloadUrl: string;
}

// Main Report interface
export interface DetailedReport {
  id: string;
  sessionId: string;
  sessionType: SessionType;
  conversationOverview: ConversationOverview;
  overallScore: number; // 0-10
  metrics: DetailedMetrics;
  strengths: Strength[];
  improvements: Improvement[];
  actionPlan: ActionPlan;
  visualsData: VisualsData;
  transcript?: string;
  annotations?: Array<{
    startIndex: number;
    endIndex: number;
    errorType: 'grammar' | 'vocabulary' | 'pronunciation' | 'fluency';
    suggestion: string;
    explanation: string;
  }>;
  suggestions: string[];
  isSaved: boolean;
  exports: ExportRecord[];
  createdAt: Date;
}

// Legacy Report interface for backward compatibility
export interface Report {
  id: string;
  sessionId: string;
  sessionType: SessionType;
  generatedDate: Date;
  proficiencyScore: number;
  metrics: {
    fluency: number;
    grammar: number;
    vocabulary: number;
    pronunciation: number;
  };
  transcript: TranscriptItem[];
  suggestions: string[];
}

export interface ReportItem {
  id: string;
  conversationOverview: {
    participants: Array<{
      name: string;
      role: string;
    }>;
    date: string;
    duration: number;
    scenario: string;
    goal: string;
  };
  overallScore: number;
  metrics: {
    fluencyCoherence: { score: number };
    grammarAccuracy: { score: number };
    vocabularyRange: { score: number };
    pronunciationIntelligibility: { score: number };
  };
  isSaved: boolean;
  createdAt: string;
}

export interface TranscriptItem {
  id: string;
  speaker: 'user' | 'ai' | 'peer';
  text: string;
  timestamp: Date;
  errors?: {
    start: number;
    end: number;
    type: 'grammar' | 'vocabulary' | 'pronunciation';
    suggestion: string;
  }[];
}

// Coin transaction types
export type TransactionType = 
  | 'purchase' 
  | 'check-in' 
  | 'ai-session' 
  | 'premium-filter' 
  | 'teacher-session'
  | 'refund';

export interface CoinTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive for earned, negative for spent
  timestamp: Date;
  description: string;
}

// Notification types
export type NotificationType = 
  | 'report_ready' 
  | 'coin_bonus'
  | 'coin_purchase'
  | 'coin_low_balance'
  | 'system'
  | 'peer_request'
  | 'peer_matched'
  | 'session_started'
  | 'session_ended'
  | 'session_reminder'
  | 'call_incoming'
  | 'call_ended'
  | 'call_extended'
  | 'chat_message'
  | 'ai_response_ready'
  | 'maintenance'
  | 'feature_announcement'
  | 'daily_streak'
  | 'achievement_unlocked';

export type NotificationCategory = 'transaction' | 'session' | 'system' | 'social' | 'achievement';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  data: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  categories: {
    transaction: boolean;
    session: boolean;
    system: boolean;
    social: boolean;
    achievement: boolean;
  };
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

// AI model types
export interface AIModel {
  id: string;
  name: string;
  role: string; // Engineer, Counselor, Teacher, etc.
  avatar: string;
  description: string;
}

// Topics for conversation
export interface Topic {
  id: string;
  title: string;
  description: string;
  suitableFor: ('beginner' | 'intermediate' | 'advanced')[];
}

// Peer matching filters
export interface PeerFilters {
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced';
  gender?: 'male' | 'female' | 'any';
  isCertifiedTeacher?: boolean;
  randomMatch: boolean;
} 