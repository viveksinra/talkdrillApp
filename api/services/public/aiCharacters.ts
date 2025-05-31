import { get, post, put } from '@/api/config/axiosConfig';
import { Socket } from 'socket.io-client';

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

interface ProcessTextViaSocketCallbacks {
  onTextResponse: (aiResponse: string, conversationId: string) => void;
  onStatusUpdate: (status: string, message: string) => void;
  onAudioComplete: (audioUrl: string, conversationId: string, aiResponse: string) => void;
  onError: (error: { message: string; details?: any }) => void;
}

interface ProcessTextViaSocketData {
  userId: string;
  characterId: string;
  conversationId: string;
  userText: string;
  language?: string;
}

export const processTextViaSocket = (
  socket: Socket | null,
  data: ProcessTextViaSocketData,
  callbacks: ProcessTextViaSocketCallbacks
): (() => void) => {
  if (!socket || !socket.connected) {
    callbacks.onError({ message: 'Socket not connected or available.' });
    return () => {};
  }

  console.log('[SOCKET_CLIENT_SEND:process_text_for_audio_socket]', data);
  socket.emit('process_text_for_audio_socket', data);

  const textResponseHandler = ({ aiResponse, conversationId }: { aiResponse: string, conversationId: string }) => {
    console.log('[SOCKET_CLIENT_RECV:ai_text_response_socket]', { aiResponse, conversationId });
    callbacks.onTextResponse(aiResponse, conversationId);
  };
  const statusHandler = ({ status, message }: { status: string, message: string }) => {
    console.log('[SOCKET_CLIENT_RECV:audio_processing_status_socket]', { status, message });
    callbacks.onStatusUpdate(status, message);
  };
  const completionHandler = ({ audioUrl, conversationId, aiResponse }: { audioUrl: string, conversationId: string, aiResponse: string }) => {
    console.log('[SOCKET_CLIENT_RECV:audio_complete_socket]', { audioUrl, conversationId });
    callbacks.onAudioComplete(audioUrl, conversationId, aiResponse);
  };
  const errorHandler = (error: { message: string; details?: any }) => {
    console.error('[SOCKET_CLIENT_RECV:audio_error_socket]', error);
    callbacks.onError(error);
  };

  socket.on('ai_text_response_socket', textResponseHandler);
  socket.on('audio_processing_status_socket', statusHandler);
  socket.on('audio_complete_socket', completionHandler);
  socket.on('audio_error_socket', errorHandler);

  return () => {
    console.log('[SOCKET_CLIENT] Cleaning up listeners for audio processing.');
    socket.off('ai_text_response_socket', textResponseHandler);
    socket.off('audio_processing_status_socket', statusHandler);
    socket.off('audio_complete_socket', completionHandler);
    socket.off('audio_error_socket', errorHandler);
  };
};

// NEW: Interface for streaming callbacks
interface ProcessTextViaSocketStreamCallbacks {
  onTextChunk: (chunkIndex: number, chunkText: string, conversationId: string) => void;
  onAudioChunk: (chunkIndex: number, audioUrl: string, chunkText: string, conversationId: string) => void;
  onResponseComplete: (fullResponse: string, conversationId: string, totalChunks: number) => void;
  onGreetingText: (greetingText: string, conversationId: string) => void;
  onGreetingAudio: (audioUrl: string, greetingText: string, conversationId: string) => void;
  onStatusUpdate: (status: string, message: string) => void;
  onError: (error: { message: string; details?: any }) => void;
}

// NEW: Enhanced streaming function
export const processTextViaSocketStream = (
  socket: Socket | null,
  data: ProcessTextViaSocketData & { useStreaming?: boolean },
  callbacks: ProcessTextViaSocketStreamCallbacks
): (() => void) => {
  if (!socket || !socket.connected) {
    callbacks.onError({ message: 'Socket not connected or available.' });
    return () => {};
  }

  const eventName = data.useStreaming !== false ? 'process_text_for_audio_socket_stream' : 'process_text_for_audio_socket';
  console.log(`[SOCKET_CLIENT_SEND:${eventName}]`, data);
  socket.emit(eventName, data);

  // Text chunk handler
  const textChunkHandler = ({ chunkIndex, chunkText, conversationId }: { 
    chunkIndex: number, chunkText: string, conversationId: string 
  }) => {
    console.log(`[SOCKET_CLIENT_RECV:ai_chunk_text_socket] Chunk ${chunkIndex}:`, chunkText);
    callbacks.onTextChunk(chunkIndex, chunkText, conversationId);
  };

  // Audio chunk handler
  const audioChunkHandler = ({ chunkIndex, audioUrl, chunkText, conversationId }: { 
    chunkIndex: number, audioUrl: string, chunkText: string, conversationId: string 
  }) => {
    console.log(`[SOCKET_CLIENT_RECV:ai_chunk_audio_socket] Chunk ${chunkIndex} audio ready`);
    callbacks.onAudioChunk(chunkIndex, audioUrl, chunkText, conversationId);
  };

  // Response complete handler
  const completeHandler = ({ fullResponse, conversationId, totalChunks }: { 
    fullResponse: string, conversationId: string, totalChunks: number 
  }) => {
    console.log(`[SOCKET_CLIENT_RECV:ai_response_complete_socket] Complete with ${totalChunks} chunks`);
    callbacks.onResponseComplete(fullResponse, conversationId, totalChunks);
  };

  // Greeting handlers
  const greetingTextHandler = ({ greetingText, conversationId }: { 
    greetingText: string, conversationId: string 
  }) => {
    console.log(`[SOCKET_CLIENT_RECV:ai_greeting_text_socket]`, greetingText);
    callbacks.onGreetingText(greetingText, conversationId);
  };

  const greetingAudioHandler = ({ audioUrl, greetingText, conversationId }: { 
    audioUrl: string, greetingText: string, conversationId: string 
  }) => {
    console.log(`[SOCKET_CLIENT_RECV:ai_greeting_audio_socket] Greeting audio ready`);
    callbacks.onGreetingAudio(audioUrl, greetingText, conversationId);
  };

  // Status and error handlers
  const statusHandler = ({ status, message }: { status: string, message: string }) => {
    console.log(`[SOCKET_CLIENT_RECV:audio_processing_status_socket]`, { status, message });
    callbacks.onStatusUpdate(status, message);
  };

  const errorHandler = (error: { message: string; details?: any }) => {
    console.error(`[SOCKET_CLIENT_RECV:audio_error_socket]`, error);
    callbacks.onError(error);
  };

  const streamErrorHandler = (error: { message: string; details?: any }) => {
    console.error(`[SOCKET_CLIENT_RECV:ai_stream_error_socket]`, error);
    callbacks.onError(error);
  };

  // Register all event listeners
  socket.on('ai_chunk_text_socket', textChunkHandler);
  socket.on('ai_chunk_audio_socket', audioChunkHandler);
  socket.on('ai_response_complete_socket', completeHandler);
  socket.on('ai_greeting_text_socket', greetingTextHandler);
  socket.on('ai_greeting_audio_socket', greetingAudioHandler);
  socket.on('audio_processing_status_socket', statusHandler);
  socket.on('audio_error_socket', errorHandler);
  socket.on('ai_stream_error_socket', streamErrorHandler);

  // Cleanup function
  return () => {
    console.log('[SOCKET_CLIENT] Cleaning up streaming listeners');
    socket.off('ai_chunk_text_socket', textChunkHandler);
    socket.off('ai_chunk_audio_socket', audioChunkHandler);
    socket.off('ai_response_complete_socket', completeHandler);
    socket.off('ai_greeting_text_socket', greetingTextHandler);
    socket.off('ai_greeting_audio_socket', greetingAudioHandler);
    socket.off('audio_processing_status_socket', statusHandler);
    socket.off('audio_error_socket', errorHandler);
    socket.off('ai_stream_error_socket', streamErrorHandler);
  };
};

// NEW: Function to start AI conversation
export const startAIConversation = (
  socket: Socket | null,
  data: { userId: string; characterId: string; conversationId?: string },
  callbacks: Pick<ProcessTextViaSocketStreamCallbacks, 'onGreetingText' | 'onGreetingAudio' | 'onError'>
): (() => void) => {
  if (!socket || !socket.connected) {
    callbacks.onError({ message: 'Socket not connected or available.' });
    return () => {};
  }

  console.log('[SOCKET_CLIENT_SEND:ai_conversation_start]', data);
  socket.emit('ai_conversation_start', data);

  const greetingTextHandler = ({ greetingText, conversationId }: { 
    greetingText: string, conversationId: string 
  }) => {
    callbacks.onGreetingText(greetingText, conversationId);
  };

  const greetingAudioHandler = ({ audioUrl, greetingText, conversationId }: { 
    audioUrl: string, greetingText: string, conversationId: string 
  }) => {
    callbacks.onGreetingAudio(audioUrl, greetingText, conversationId);
  };

  const errorHandler = (error: { message: string; details?: any }) => {
    callbacks.onError(error);
  };

  socket.on('ai_greeting_text_socket', greetingTextHandler);
  socket.on('ai_greeting_audio_socket', greetingAudioHandler);
  socket.on('ai_greeting_error_socket', errorHandler);

  return () => {
    socket.off('ai_greeting_text_socket', greetingTextHandler);
    socket.off('ai_greeting_audio_socket', greetingAudioHandler);
    socket.off('ai_greeting_error_socket', errorHandler);
  };
}; 