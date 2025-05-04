import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://localhost:2040'; // Update this with your server URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper methods
export const get = async (url: string, params = {}) => {
  return api.get(url, { params });
};

export const post = async (url: string, data = {}) => {
  return api.post(url, data);
};

export const put = async (url: string, data = {}) => {
  return api.put(url, data);
};

export const del = async (url: string) => {
  return api.delete(url);
};

export default api; 