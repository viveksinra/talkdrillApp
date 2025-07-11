import * as SecureStore from 'expo-secure-store';

// TODO: Change to api.talkdrill.com when ready
const baseUrl = "https://b47b-103-215-226-35.ngrok-free.app" //"https://api.talkdrill.com";

// Use ngrok URL for development, but be sure to update when URL changes
export const API_BASE_URL = baseUrl;
export const SOCKET_BASE_URL = baseUrl;

// Log the API and Socket URLs for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('Socket Base URL:', SOCKET_BASE_URL);

// Check if URLs are valid
if (!API_BASE_URL || !API_BASE_URL.startsWith('http')) {
  console.error('Invalid API Base URL:', API_BASE_URL);
}

if (!SOCKET_BASE_URL || !SOCKET_BASE_URL.startsWith('http')) {
  console.error('Invalid Socket Base URL:', SOCKET_BASE_URL);
}

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

// Helper function to check if response has standard API format
const hasStandardApiFormat = (data: any): boolean => {
  return data && 
         typeof data === 'object' && 
         'message' in data && 
         'variant' in data &&
         ['success', 'error', 'info'].includes(data.variant);
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
    console.log(`API Request: ${method} ${url}`, {
      data: data || 'none',
      params: params || 'none',
      timeout: customConfig?.timeout || 10000
    });
    
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
    const timeoutValue = interceptedConfig.timeout || 10000;
    console.log(`Request timeout set to ${timeoutValue}ms for ${method} ${url}`);
    const timeoutId = setTimeout(() => {
      console.log(`Request timeout triggered after ${timeoutValue}ms for ${method} ${url}`);
      controller.abort();
    }, timeoutValue);
    
    // Make fetch request
    const fetchOptions: RequestInit = {
      method,
      headers: interceptedConfig.headers as HeadersInit,
      signal: controller.signal,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      if (data instanceof FormData) {
        fetchOptions.body = data;
        // When sending FormData, let the browser set the Content-Type header
        // so it can include the boundary.
        if (fetchOptions.headers && (fetchOptions.headers as Record<string, string>)['Content-Type']) {
          delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
        }
      } else {
        fetchOptions.body = JSON.stringify(data);
      }
    }
    
    console.log(`Sending fetch request to ${fullUrl}`, {
      method,
      headers: Object.fromEntries(Object.entries(fetchOptions.headers || {})),
      bodyLength: fetchOptions.body ? String(fetchOptions.body).length : 0
    });
    
    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    console.log(`Response received for ${method} ${url}:`, {
      status: response.status, 
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Apply response interceptor
    responseData = responseInterceptor(response, responseData);
    
    // MODIFIED ERROR HANDLING: Don't throw errors for 4xx responses with standard API format
    if (!response.ok) {
      console.log(`Non-2xx response for ${method} ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      
      // Check if this is a 4xx response with our standard API format
      if (response.status >= 400 && response.status < 500 && hasStandardApiFormat(responseData)) {
        console.log(`Treating 4xx response as valid API response for ${method} ${url}`);
        // Return as successful response - let the service layer handle the variant
        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          config,
        };
      }
      
      // For 5xx errors or non-standard responses, still throw errors
      console.error(`Error response for ${method} ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      
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
    console.error(`Request error for ${method} ${url}:`, error);
    
    if (error.name === 'AbortError') {
      console.error(`Request timeout for ${method} ${url} after ${customConfig?.timeout || 10000}ms`);
      const timeoutError = new Error('Request timeout') as AxiosError;
      timeoutError.config = customConfig;
      throw timeoutError;
    }
    
    if (error.response) {
      console.error(`Error with response for ${method} ${url}:`, error.response);
      throw error;
    }
    
    const networkError = new Error(error.message) as AxiosError;
    networkError.config = customConfig;
    console.error(`Network error for ${method} ${url}:`, networkError);
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

export const DEFAULT_CALL_LIMIT = 15;
export const MAX_CALL_LIMIT = 30;

export default api;