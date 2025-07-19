// User types
export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string | null;
  streak: number;
  level: 'basic' | 'pro' | 'advanced';
  totalSessions: number;
  reportsGenerated: number;
  coinsSpent: number;
  coinBalance: number;
  profileImage?: string;
}

// Session types
export type SessionType = 'ai-chat' | 'ai-call' | 'peer-chat' | 'peer-call' | 'professional_session';

export interface Session {
  id: string;
  user: string; // User ID
  sessionType: SessionType;
  partner?: string; // For AI sessions
  peerUser?: string; // For peer sessions
  professional?: string; // For professional sessions
  booking?: string; // For professional sessions
  topic?: string;
  duration: number; // Duration in seconds
  messages?: Array<{
    sender: string;
    content: string;
    timestamp: Date;
  }>;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// AI Character types
export interface AICharacter {
  id: string;
  name: string;
  description: string;
  avatar: string;
  personality: string[];
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
}

// Professional types
export interface Professional {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  specializations: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  isAvailable: boolean;
  languages: string[];
  experience: number; // years
}

// Booking types
export interface Booking {
  id: string;
  userId: string;
  professionalId: string;
  sessionType: 'video-call' | 'voice-call' | 'chat';
  scheduledTime: Date;
  duration: number; // minutes
  topic?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  totalCost: number;
  createdAt: Date;
}

// Report types
export interface Report {
  id: string;
  sessionId: string;
  userId: string;
  type: 'ai-session' | 'professional-session' | 'peer-session';
  overallScore: number;
  sections: {
    grammar: {
      score: number;
      feedback: string;
      mistakes: Array<{
        original: string;
        corrected: string;
        explanation: string;
      }>;
    };
    vocabulary: {
      score: number;
      feedback: string;
      wordsUsed: string[];
      suggestedWords: string[];
    };
    pronunciation: {
      score: number;
      feedback: string;
      difficultWords: string[];
    };
    fluency: {
      score: number;
      feedback: string;
      pauseAnalysis: string;
    };
  };
  actionPlan: string[];
  createdAt: Date;
}

// Participant interface for conversation overview
interface Participant {
  name: string;
  role: "user" | "ai" | "student" | "professional";
}

// Session data interface (optional)
interface SessionData {
  id: string;
  type: string;
  partner: string;
  peerUser?: {
    id: string;
    name: string;
    profileImage?: string;
  } | null;
  topic: string;
  startTime: string;
  endTime: string;
  duration: number;
}

// Conversation overview interface
interface ConversationOverview {
  conversationId?: string;
  bookingId?: string;
  participants: Participant[];
  date: string;
  duration: number;
  scenario: string;
  excerpt: string;
  goal: string;
  sessionType?: string;
  specialization?: string;
}

// Fluency analysis interface
interface FluencyAnalysis {
  score: number;
  wordsPerMinute: number;
  pausesPerMinute: number;
  discourseMarkersUsed: number;
  turnTakingQuality?: number;
  analysis: string;
}

// Grammar accuracy interface
interface GrammarAccuracy {
  score: number;
  errorTypes: string[];
  errorsPerHundredWords: number;
  transcriptExamples: Array<{
    original: string;
    corrected: string;
    errorType?: string;
  }>;
  errorsByType?: Record<string, number>;
  consistencyScore?: number;
  improvement?: string;
}

// Business terms interface
interface BusinessTerms {
  used: string[];
  missing: string[];
}

// Vocabulary range interface
interface VocabularyRange {
  score: number;
  lexicalDiversity: number;
  businessTerms: BusinessTerms;
  vocabularyComplexity?: number;
  keyPhrases?: string[];
  totalWords?: number;
  uniqueWords?: number;
  contextAwareVocab?: string[];
}

// Pronunciation intelligibility interface
interface PronunciationIntelligibility {
  score: number;
  phonemeLevelErrors: number;
  intelligibilityRating: number;
  commonChallenges: string;
  problematicWords: Array<{
    word: string;
    issue: string;
  }>;
  recommendations?: string[];
  estimatedLevel?: "Developing" | "Intermediate" | "Advanced";
}

// Pragmatics register interface
interface PragmaticsRegister {
  politenessStrategies: "Needs Improvement" | "Appropriate" | "Excellent";
  formalityMatch: number;
  turnTaking: string;
  topicManagement?: string;
  conversationalCompetence?: string;
  sentimentAppropriateness?: string;
  analysis: string;
}

// Metrics interface
interface ReportMetrics {
  fluencyCoherence: FluencyAnalysis;
  grammarAccuracy: GrammarAccuracy;
  vocabularyRange: VocabularyRange;
  pronunciationIntelligibility: PronunciationIntelligibility;
  pragmaticsRegister: PragmaticsRegister;
}

// Strengths and improvements interface
interface StrengthImprovement {
  title: string;
  description: string;
  action?: string;
}

// Action plan task interface
interface ActionTask {
  task: string;
  timeframe: string;
}

// Action plan resources interface
interface ActionResources {
  apps: string[];
  podcasts: string[];
  worksheets: string[];
}

// Action plan interface
interface ActionPlan {
  shortTerm: ActionTask[];
  midTerm: ActionTask[];
  resources: ActionResources;
}

// Error rate data point interface
interface ErrorRateDataPoint {
  time: string;
  errorRate: number;
}

// Skill profile data point interface
interface SkillProfileDataPoint {
  skill: string;
  current: number;
  target: number;
}

// Vocabulary comparison data point interface
interface VocabularyComparisonDataPoint {
  level: string;
  current: number;
  target: number;
}

// Visuals data interface
interface VisualsData {
  errorRateOverTime: ErrorRateDataPoint[];
  skillProfile: SkillProfileDataPoint[];
  vocabularyComparison: VocabularyComparisonDataPoint[];
}

// Main DetailedReport interface
export interface DetailedReport {
  id: string;
  session: SessionData | null;
  conversationOverview: ConversationOverview;
  overallScore: number;
  metrics: ReportMetrics;
  strengths: StrengthImprovement[];
  improvements: StrengthImprovement[];
  actionPlan: ActionPlan;
  visualsData: VisualsData;
  transcript: string;
  annotations: any[]; // Can be more specific based on your annotation structure
  suggestions: string[];
  isSaved: boolean;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'session' | 'booking' | 'report' | 'achievement' | 'reminder' | 'system';
  isRead: boolean;
  createdAt: Date;
  data?: any; // Additional data for the notification
}

// Coin and Transaction types
export interface CoinTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'purchased';
  amount: number;
  description: string;
  relatedTo?: {
    type: 'session' | 'booking' | 'daily-bonus' | 'referral' | 'purchase';
    id: string;
  };
  createdAt: Date;
}

// Common utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Filter and search types
export interface FilterOptions {
  sessionType?: SessionType[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  topics?: string[];
  languages?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: 'now' | 'today' | 'this-week';
}

export interface SearchOptions {
  query: string;
  filters?: FilterOptions;
  sortBy?: 'rating' | 'price' | 'experience' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

// Audio and Video types
export interface MediaSettings {
  audioEnabled: boolean;
  videoEnabled: boolean;
  quality: 'low' | 'medium' | 'high';
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'session' | 'streak' | 'skill' | 'social';
  requirement: {
    count: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  };
  reward: {
    coins?: number;
    badge?: string;
  };
  isUnlocked: boolean;
  unlockedAt?: Date;
}

// Settings types
export interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sessionReminders: boolean;
    dailyMotivation: boolean;
    weeklyProgress: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    allowMessages: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    autoJoinSessions: boolean;
    recordSessions: boolean;
  };
}

// Referral types
export interface ReferralData {
  code: string;
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
  referredUsers: Array<{
    name: string;
    joinedAt: Date;
    status: 'pending' | 'completed';
    reward: number;
  }>;
}

// Socket event types
export type SocketEvent = 
  | 'user-connected'
  | 'user-disconnected'
  | 'call-request'
  | 'call-accepted'
  | 'call-rejected'
  | 'call-ended'
  | 'message-sent'
  | 'message-received'
  | 'typing-start'
  | 'typing-stop'
  | 'session-started'
  | 'session-ended';

export interface SocketEventData {
  event: SocketEvent;
  data: any;
  timestamp: Date;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Navigation types (for type-safe navigation)
export type RootStackParamList = {
  '(auth)': undefined;
  '(protected)': undefined;
  'ai-character': { id: string };
  'professional-profile': { id: string };
  'session-call': { bookingId: string };
  'session-review': { bookingId: string };
  'report-details': { reportId: string };
  'edit-profile': undefined;
  'settings': undefined;
  'notifications': undefined;
};

// Component prop types
export interface BaseComponentProps {
  style?: any;
  testID?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
}

export interface ProfileForm {
  name: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  interests: string[];
  goals: string[];
  nativeLanguage: string;
  targetLanguages: string[];
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

// Performance types
export interface PerformanceMetrics {
  sessionDuration: number;
  responseTime: number;
  errorRate: number;
  userEngagement: number;
}

// Auth types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginForm) => Promise<void>;
  signup: (userData: SignupForm) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Context types
export interface AppContextType {
  auth: AuthState & AuthActions;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

// Storage types
export type StorageKeys = 
  | 'auth_token'
  | 'refresh_token'
  | 'user_data'
  | 'app_settings'
  | 'cached_reports'
  | 'offline_messages';

// Network types
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

// App state types
export type AppStateStatus = 'active' | 'background' | 'inactive';

// Gesture types
export interface GestureState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  repeat?: number;
}

// Platform types
export type PlatformType = 'ios' | 'android' | 'web';

// Device types
export interface DeviceInfo {
  platform: PlatformType;
  version: string;
  model: string;
  isTablet: boolean;
  hasNotch: boolean;
}

// Location types
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

// File types
export interface FileInfo {
  uri: string;
  name: string;
  type: string;
  size: number;
}

// Camera types
export interface CameraOptions {
  mediaType: 'photo' | 'video';
  quality: number;
  allowsEditing: boolean;
  aspect: [number, number];
}

// Push notification types
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

// Deep link types
export interface DeepLinkData {
  screen: string;
  params?: Record<string, any>;
}

// Feature flag types
export interface FeatureFlags {
  aiVideoChat: boolean;
  premiumFeatures: boolean;
  analyticsTracking: boolean;
  crashReporting: boolean;
}

// A/B testing types
export interface ABTestVariant {
  name: string;
  weight: number;
  config: Record<string, any>;
}

// Metrics types
export interface UserMetrics {
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  streakDays: number;
  coinsEarned: number;
  coinsSpent: number;
  improvementScore: number;
}

// Feedback types
export interface UserFeedback {
  rating: number;
  comment: string;
  category: 'bug' | 'feature' | 'general';
  timestamp: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'session' | 'reminder' | 'review';
  participants?: string[];
}

// Chat types
export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'file';
  timestamp: Date;
  isRead: boolean;
  replyTo?: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
}

// Review types
export interface Review {
  id: string;
  userId: string;
  targetId: string; // Professional or AI character ID
  targetType: 'professional' | 'ai_character';
  rating: number;
  comment: string;
  helpful: number;
  createdAt: Date;
}

// Search history types
export interface SearchQuery {
  query: string;
  timestamp: Date;
  results: number;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

// Offline types
export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}

// Logger types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
}

// Accessibility types
export interface AccessibilityInfo {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
}

// Internationalization types
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'hi' | 'zh' | 'ja' | 'ko';

export interface TranslationKey {
  key: string;
  defaultValue: string;
  interpolation?: Record<string, string | number>;
}

// Testing types
export interface TestConfig {
  environment: 'development' | 'staging' | 'production';
  mockApi: boolean;
  debugMode: boolean;
}

// Build types
export interface BuildInfo {
  version: string;
  buildNumber: string;
  commitHash: string;
  buildDate: Date;
  environment: 'development' | 'staging' | 'production';
}