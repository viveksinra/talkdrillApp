// API URL based on environment
export const API_URL = __DEV__ 
  ? 'http://localhost:2040' 
  : 'https://api.talkdrill.com';

// API endpoints
export const ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  PROFILE: '/api/v1/user/profile',
  AI_CHARACTERS: '/api/v1/ai-characters',
  AI_CONVERSATIONS: '/api/v1/ai-conversations',
};

// App constants
export const APP_CONSTANTS = {
  APP_NAME: 'TalkDrill',
  VERSION: '1.0.0',
  PLATFORM: {
    IOS: 'ios',
    ANDROID: 'android',
  },
}; 