import { get, post, put } from '@/api/config/axiosConfig';

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  gender: string;
  age: number;
  languages: string[];
  expertiseLevel: string;
  background: string;
  teachingStyle: string;
  personality: string;
  profileImage: string;
  tags: string[];
}

interface AIConversation {
  _id: string;
  characterId: string;
  messages: {
    sender: 'user' | 'ai';
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    timestamp: string;
  }[];
  callType: 'chat' | 'audio' | 'video';
  startTime: string;
  endTime?: string;
  languageMetrics?: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
  };
  feedback?: string;
}

// Endpoints
const AI_CHARACTERS_ENDPOINT = '/api/v1/ai-characters';
const AI_CONVERSATIONS_ENDPOINT = '/api/v1/ai-conversations';

// Get all AI characters
export const fetchAICharacters = async (): Promise<AICharacter[]> => {
  try {
    const response = await get(AI_CHARACTERS_ENDPOINT);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching AI characters:', error);
    throw error;
  }
};

// Get AI character details
export const fetchAICharacterDetails = async (id: string): Promise<AICharacter> => {
  try {
    const response = await get(`${AI_CHARACTERS_ENDPOINT}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching AI character details:', error);
    throw error;
  }
};

// Start a new conversation with an AI character
export const startConversation = async (characterId: string, callType: 'chat' | 'audio' | 'video'): Promise<AIConversation> => {
  try {
    const response = await post(AI_CONVERSATIONS_ENDPOINT, {
      characterId,
      callType,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error starting conversation:', error);
    throw error;
  }
};

// Send a text message to AI character
export const sendTextMessage = async (characterId: string, message: string, conversationId?: string): Promise<{
  conversationId: string;
  aiResponse: string;
}> => {
  try {
    const response = await post(`${AI_CHARACTERS_ENDPOINT}/response`, {
      characterId,
      message,
      conversationId,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
};

// End a conversation
export const endConversation = async (conversationId: string): Promise<AIConversation> => {
  try {
    const response = await put(`${AI_CONVERSATIONS_ENDPOINT}/${conversationId}/end`);
    return response.data.data;
  } catch (error) {
    console.error('Error ending conversation:', error);
    throw error;
  }
};

// Get conversation history
export const getConversationHistory = async (conversationId: string): Promise<AIConversation> => {
  try {
    const response = await get(`${AI_CONVERSATIONS_ENDPOINT}/${conversationId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    throw error;
  }
};

// Get language learning assessment
export const getLanguageAssessment = async (conversationId: string): Promise<{
  metrics: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
  };
  feedback: string;
}> => {
  try {
    const response = await get(`${AI_CHARACTERS_ENDPOINT}/assessment/${conversationId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting language assessment:', error);
    throw error;
  }
};

// Send text to get video response
export const sendTextForVideo = async (
  userText: string,
  characterId: string,
  conversationId: string,
  language: string = 'en-US'
): Promise<{
  conversationId: string;
  userText: string;
  aiResponse: string;
  videoUrl: string;
}> => {
  try {
    const response = await post(`${AI_CHARACTERS_ENDPOINT}/process-text`, {
      userText,
      characterId,
      conversationId,
      language,
    });
    return response.data.myData;
  } catch (error) {
    console.error('Error processing text to video:', error);
    throw error;
  }
}; 