/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  
  /**
   * Convert camelCase to snake_case
   */
  function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  
  /**
   * Recursively convert object keys from snake_case to camelCase
   */
  export function keysToCamel(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => keysToCamel(item));
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = toCamelCase(key);
        acc[camelKey] = keysToCamel(obj[key]);
        return acc;
      }, {} as any);
    }
    
    return obj;
  }
  
  /**
   * Recursively convert object keys from camelCase to snake_case
   */
  export function keysToSnake(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => keysToSnake(item));
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = toSnakeCase(key);
        acc[snakeKey] = keysToSnake(obj[key]);
        return acc;
      }, {} as any);
    }
    
    return obj;
  }
  
  /**
   * Enhanced API request function with automatic case conversion
   * USES YOUR EXISTING auth_token FROM localStorage
   */
  export async function apiRequest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<Response> {
    // Use YOUR existing token key: auth_token
    const token = localStorage.getItem('auth_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config: RequestInit = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      // Convert camelCase to snake_case before sending
      config.body = JSON.stringify(keysToSnake(data));
    }
    
    // Use your API_BASE_URL or fallback to localhost:3000
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      // Handle 401 - redirect to login in admin app
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.detail || response.statusText || 'Request failed';
      throw new Error(errorMessage);
    }
    
    return response;
  }
  
  /**
   * Enhanced fetch wrapper that converts response from snake_case to camelCase
   */
  export async function apiFetch<T = any>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const response = await apiRequest(method, endpoint, data);
    const json = await response.json();
    
    // Convert snake_case to camelCase
    return keysToCamel(json);
  }
  
  /**
   * Type-safe API methods - COMPATIBLE WITH YOUR EXISTING SETUP
   */
  export const api = {
    get: <T = any>(endpoint: string) => apiFetch<T>('GET', endpoint),
    post: <T = any>(endpoint: string, data?: any) => apiFetch<T>('POST', endpoint, data),
    put: <T = any>(endpoint: string, data?: any) => apiFetch<T>('PUT', endpoint, data),
    patch: <T = any>(endpoint: string, data?: any) => apiFetch<T>('PATCH', endpoint, data),
    delete: <T = any>(endpoint: string) => apiFetch<T>('DELETE', endpoint),
  };
  
  /**
   * Export queryClient for use in mutations
   */
  import { QueryClient } from '@tanstack/react-query';
  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30000,
      },
    },
  });