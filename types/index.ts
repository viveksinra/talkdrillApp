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

// Report types
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
  | 'report-ready' 
  | 'coin-bonus' 
  | 'system-announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionLink?: string;
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