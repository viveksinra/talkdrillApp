// talkdrillApp/types/types.d.ts

// General API Response Structure
export type ApiResponseVariant = 'success' | 'error' | 'info';

export interface BaseApiResponse<T = any> {
  message: string;
  variant: ApiResponseVariant;
  myData?: T;
  // For controllers that use 'success: boolean' and 'data' field
  success?: boolean;
  data?: T;
  error?: string; // For error responses
}

// Mongoose ObjectId as string
export type ObjectIdString = string;

// --- Model Types (derived from Mongoose Schemas) ---

export interface UserSettings {
  pushNotifications: boolean;
  language: string;
  theme: string;
}

export interface User {
  _id: ObjectIdString;
  name: string;
  email?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  googleId?: string;
  profileImage?: string;
  coins: number;
  dailyStreak: number;
  lastCheckIn?: string | Date; // Date will be stringified in JSON
  dateJoined: string | Date;
  settings: UserSettings;
  otp?: string | null;
  otpExpires?: string | Date | null;
  otpAttempts?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type AICharacterGender = 'male' | 'female' | 'non-binary';
export type AICharacterExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AICharacter {
  _id: ObjectIdString;
  name: string;
  profession: string;
  nationality: string;
  gender: AICharacterGender;
  age: number;
  languages: string[];
  expertiseLevel: AICharacterExpertiseLevel;
  background: string;
  teachingStyle: string;
  personality: string;
  profileImage?: string;
  voiceId?: string;
  avatarId?: string;
  systemPrompt: string;
  isActive: boolean;
  tags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// For responses that might only contain a subset of AICharacter fields
export interface PartialAICharacter {
  _id: ObjectIdString;
  name: string;
  profession?: string;
  nationality?: string;
  profileImage?: string;
  // Add other fields as needed for specific partial responses
}

export type MessageSender = 'user' | 'ai';

export interface SpeechSegment {
  type: 'speech' | 'silence';
  start: number; // milliseconds
  end: number; // milliseconds
  text?: string; // Optional text for the speech segment
}

export interface Message {
  _id?: ObjectIdString; // Messages might not have _id if not saved yet or sub-documents
  sender: MessageSender;
  content: string;
  audioUrl?: string | null;
  audioData?: string | null; // Base64 encoded
  videoUrl?: string | null;
  timestamp: string | Date;
  processed?: boolean;
  // Fields added from client-side or socket responses
  speechSegments?: SpeechSegment[];
  audioDuration?: number; // milliseconds
}

export type CallType = 'chat' | 'audio' | 'video';

export interface LanguageMetrics {
  fluency?: number | null;
  vocabulary?: number | null;
  grammar?: number | null;
  pronunciation?: number | null;
}

export interface AIConversation {
  _id: ObjectIdString;
  userId: ObjectIdString | User; // Can be populated
  characterId: ObjectIdString | AICharacter; // Can be populated
  messages: Message[];
  callType: CallType;
  startTime: string | Date;
  endTime?: string | Date | null;
  languageMetrics?: LanguageMetrics;
  feedback?: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type CallStatus = "initiated" | "ongoing" | "completed" | "missed" | "rejected";

export interface Call {
  _id: ObjectIdString;
  caller: ObjectIdString | User; // Can be populated
  receiver?: ObjectIdString | User; // Can be populated
  isAICall?: boolean;
  status: CallStatus;
  startTime?: string | Date;
  endTime?: string | Date;
  duration?: number;
  streamCallId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Session model
export interface Session {
  _id: ObjectIdString;
  userId: ObjectIdString;
  token: string;
  expiresAt: string | Date;
  ipAddress?: string;
  userAgent?: string;
  lastAccessedAt?: string | Date;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Transaction model
export interface Transaction {
  _id: ObjectIdString;
  userId: ObjectIdString;
  type: 'purchase' | 'usage' | 'reward' | 'refund';
  amount: number; // Number of coins
  description?: string;
  relatedItemId?: ObjectIdString; // e.g., call ID, feature ID
  relatedItemType?: string; // e.g., 'call', 'feature_unlock'
  status: 'pending' | 'completed' | 'failed';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Notification model
export interface Notification {
  _id: ObjectIdString;
  userId: ObjectIdString;
  type: 'reminder' | 'achievement' | 'message' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  link?: string; // e.g., to a conversation or feature
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Report model
export interface ReportCategory {
  main: string;
  sub?: string;
}
export interface Report {
  _id: ObjectIdString;
  reporterUserId: ObjectIdString; // User who is reporting
  reportedUserId?: ObjectIdString; // User being reported (optional)
  reportedItemId?: ObjectIdString; // e.g., conversation ID, message ID
  reportedItemType?: 'user' | 'conversation' | 'message' | 'character' | 'other';
  reason: string;
  category: ReportCategory[];
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}


// --- API Specific Response Types (derived from controllers and services) ---

// For AICharacterController.getAllCharacters
export type GetAllCharactersResponse = BaseApiResponse<Pick<AICharacter, '_id' | 'name' | 'profession' | 'nationality' | 'gender' | 'age' | 'languages' | 'expertiseLevel' | 'profileImage' | 'tags'>[]>;
// For AICharacterController.getCharacterById
export type GetCharacterByIdResponse = BaseApiResponse<AICharacter>;

// For AICharacterController.generateResponse (AIService.generateResponse)
export interface GenerateAIResponseData {
  conversationId: ObjectIdString;
  aiResponse: string;
  character: AICharacter; // Or PartialAICharacter depending on what's returned
}
export type GenerateAIResponse = BaseApiResponse<GenerateAIResponseData>;

// For AICharacterController.processTextToAudio (AIService.processTextToAudioResponse)
export interface ProcessTextToAudioData {
  conversationId: ObjectIdString;
  userText: string;
  aiResponse: string;
  audioAvailable: boolean;
  audioUrl: string;
  speechSegments?: SpeechSegment[];
  totalAudioDurationMs?: number;
  character: Pick<AICharacter, 'name' | 'profession' | 'profileImage' | '_id'>; // As seen in controller
}
export type ProcessTextToAudioResponse = BaseApiResponse<ProcessTextToAudioData>;


// For AIConversationController.getUserConversations
export interface UserConversationListItem {
  _id: ObjectIdString;
  characterId: PartialAICharacter; // Populated
  startTime: string | Date;
  endTime?: string | Date | null;
  callType: CallType;
  languageMetrics?: LanguageMetrics;
}
export type GetUserConversationsResponse = BaseApiResponse<UserConversationListItem[]>;

// For AIConversationController.getConversationById
export type GetConversationByIdResponse = BaseApiResponse<AIConversation>; // Typically returns the full conversation object

// For AIConversationController.createConversation
export type CreateConversationResponse = BaseApiResponse<AIConversation>;

// For AIConversationController.endConversation
export type EndConversationResponse = BaseApiResponse<AIConversation>;

// For AIConversationController.getUserProgress
export interface UserProgressDataPoint {
    date: string | Date;
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
}
export interface UserProgressReport {
    totalSessions: number;
    metrics: LanguageMetrics; // Average metrics
    progress: UserProgressDataPoint[];
}
export type GetUserProgressResponse = BaseApiResponse<UserProgressReport>;


// --- Socket Event Payload Types (derived from AIService) ---

export interface AudioProcessingStatusSocketPayload {
  status: 'started' | 'character_loaded' | 'generating_audio' | 'audio_generated' | 'uploading_audio' | 'audio_uploaded' | 'conversation_updated';
  message: string;
}

export interface AiTextResponseSocketPayload {
  aiResponse: string;
  conversationId: ObjectIdString;
}

export interface AudioCompleteSocketPayload {
  audioUrl: string;
  conversationId: ObjectIdString;
  aiResponse: string; // The text response associated with this audio
  speechSegments?: SpeechSegment[];
  totalAudioDurationMs?: number;
}

export interface AudioErrorSocketPayload {
  message: string;
  details?: string; // Optional error stack or details
}

// --- Types for Client-Side State (e.g., in Contexts or Screens) ---
// These might extend or compose the above types

// Example for a client-side conversation object that might include the full character object
export interface ClientConversation extends Omit<AIConversation, 'characterId' | 'userId'> {
  characterId: AICharacter; // Full character details
  userId: User; // Full user details (if needed client-side)
}

// Add other client-specific types as your app grows
