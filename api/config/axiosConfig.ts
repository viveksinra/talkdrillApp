import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// We need different URLs for iOS simulator vs Android emulator
// export const API_BASE_URL =  Platform.OS === 'ios' 
//   ? 'https://api.talkdrill.com' // For iOS simulator
//   : 'https://api.talkdrill.com';  // For Android emulator

// export const SOCKET_BASE_URL = Platform.OS === 'ios' 
//   ? 'https://api.talkdrill.com' // For iOS simulator
//   : 'https://api.talkdrill.com';  // For Android emulator

export const API_BASE_URL = 'https://64c0-103-215-226-189.ngrok-free.app';
export const SOCKET_BASE_URL = 'https://64c0-103-215-226-189.ngrok-free.app';

// Types to maintain compatibility
type AxiosResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
};

type AxiosError = Error & {
  response?: { status: number; data: any };
  config?: RequestConfig;
};

type RequestConfig = {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, any>;
  baseURL?: string;
};

// Request interceptor function
let requestInterceptor = async (config: RequestConfig): Promise<RequestConfig> => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `${token}`;
  }
  return config;
};

// Response interceptor function
let responseInterceptor = (response: Response, responseData: any): any => {
  return responseData;
};

let errorInterceptor = (error: AxiosError): Promise<never> => {
  if (error.response) {
    if (error.response.status === 401) {
      console.error('Unauthorized request');
    }
  }
  return Promise.reject(error);
};

// Custom fetch implementation to mimic axios
const makeFetchRequest = async <T>(
  url: string, 
  method: string, 
  data?: any, 
  params?: Record<string, any>,
  customConfig?: RequestConfig
): Promise<AxiosResponse<T>> => {
  try {
    // Apply request interceptor
    const config: RequestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      ...customConfig,
    };
    
    const interceptedConfig = await requestInterceptor(config);
    
    // Build URL with params
    let fullUrl = `${API_BASE_URL}${url}`;
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), interceptedConfig.timeout || 10000);
    
    // Make fetch request
    const fetchOptions: RequestInit = {
      method,
      headers: interceptedConfig.headers as HeadersInit,
      signal: controller.signal,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }
    
    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Apply response interceptor
    responseData = responseInterceptor(response, responseData);
    
    if (!response.ok) {
      const error = new Error(response.statusText) as AxiosError;
      error.response = { status: response.status, data: responseData };
      error.config = config;
      throw errorInterceptor(error);
    }
    
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout') as AxiosError;
      timeoutError.config = customConfig;
      throw timeoutError;
    }
    
    if (error.response) {
      throw error;
    }
    
    const networkError = new Error(error.message) as AxiosError;
    networkError.config = customConfig;
    throw networkError;
  }
};

// API object to mimic axios instance
const api = {
  get: <T>(url: string, config?: RequestConfig) => 
    makeFetchRequest<T>(url, 'GET', undefined, config?.params, config),
  
  post: <T>(url: string, data?: any, config?: RequestConfig) => 
    makeFetchRequest<T>(url, 'POST', data, undefined, config),
  
  put: <T>(url: string, data?: any, config?: RequestConfig) => 
    makeFetchRequest<T>(url, 'PUT', data, undefined, config),
  
  delete: <T>(url: string, config?: RequestConfig) => 
    makeFetchRequest<T>(url, 'DELETE', undefined, config?.params, config),
  
  interceptors: {
    request: {
      use: (onFulfilled: any, onRejected: any) => {
        requestInterceptor = onFulfilled;
        return { onFulfilled, onRejected };
      }
    },
    response: {
      use: (onFulfilled: any, onRejected: any) => {
        responseInterceptor = onFulfilled;
        errorInterceptor = onRejected;
        return { onFulfilled, onRejected };
      }
    }
  }
};

// Keep the same helper methods
export const get = async <T = any>(url: string, params = {}): Promise<AxiosResponse<T>> => {
  return api.get<T>(url, { params });
};

export const post = async <T = any>(url: string, data = {}, config = {}): Promise<AxiosResponse<T>> => {
  return api.post<T>(url, data, config);
};

export const put = async <T = any>(url: string, data?: any, config?: RequestConfig) => 
  makeFetchRequest<T>(url, 'PUT', data, undefined, config);

export const del = async <T = any>(url: string, config?: RequestConfig) => 
  makeFetchRequest<T>(url, 'DELETE', undefined, config?.params, config);

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    // Apply the same auth interceptor logic
    const token = await SecureStore.getItemAsync('token');
    
    // Create headers with auth token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    
    if (token) {
      headers.Authorization = `${token}`;
    }
    
    // Create full URL
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // Create AbortController for timeout if not provided
    const providedSignal = options.signal;
    const controller = new AbortController();
    const signal = providedSignal || controller.signal;
    
    // Set timeout if not using a provided signal
    let timeoutId: NodeJS.Timeout | undefined;
    if (!providedSignal) {
      timeoutId = setTimeout(() => controller.abort(), 60000); // Default 60s timeout
    }
    
    // Make the fetch request
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal
    });
    
    // Clear timeout if we set one
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // No automatic JSON parsing or error handling here
    // because we need the raw response for streaming
    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
};

export default api;
