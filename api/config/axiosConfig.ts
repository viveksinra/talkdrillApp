import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// We need different URLs for iOS simulator vs Android emulator
export const API_BASE_URL = Platform.OS === 'ios' 
  ? 'http://localhost:2040' // For iOS simulator
  : 'http://10.0.2.2:2040';  // For Android emulator

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<never> => {
    if (error.response) {
      // Handle specific error status codes if needed
      if (error.response.status === 401) {
        // Handle unauthorized - could redirect to login or refresh token
        console.error('Unauthorized request');
      }
    }
    return Promise.reject(error);
  }
);

// Helper methods
export const get = async <T = any>(url: string, params = {}): Promise<AxiosResponse<T>> => {
  return api.get<T>(url, { params });
};

export const post = async <T = any>(url: string, data = {}): Promise<AxiosResponse<T>> => {
  return api.post<T>(url, data);
};

export const put = async <T = any>(url: string, data = {}): Promise<AxiosResponse<T>> => {
  return api.put<T>(url, data);
};

export const del = async <T = any>(url: string): Promise<AxiosResponse<T>> => {
  return api.delete<T>(url);
};

export default api; 