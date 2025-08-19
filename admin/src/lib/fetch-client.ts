import i18n from '@/i18n';

// Custom fetch client that automatically adds Authorization header
export interface RequestConfig<TData = unknown> {
  method?: string;
  url?: string;
  data?: TData;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface ResponseErrorConfig<T = unknown> {
  status: number;
  statusText: string;
  data: T;
}

class FetchClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    // Em desenvolvimento, usar proxy do Vite (/api)
    // Em produção, usar variável de ambiente ou URL completa
    this.baseURL = baseURL || 
      (import.meta.env.VITE_API_URL || 
       (import.meta.env.DEV ? '/api' : 'http://localhost:3000'));
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getLanguageHeaders(): Record<string, string> {
    const currentLanguage = i18n.language || 'pt';
    return { 'Accept-Language': currentLanguage };
  }

  private getPartnerHeaders(): Record<string, string> {
    const selectedPartnerId = localStorage.getItem('selectedPartnerId');
    return selectedPartnerId && selectedPartnerId !== 'null' 
      ? { 'x-parceiro-id': selectedPartnerId } 
      : {};
  }

  private normalizeHeaders(headers: Record<string, unknown>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key] = String(value);
    }
    return normalized;
  }

  private buildURL(url: string, params?: Record<string, unknown>): string {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    if (!params) return fullURL;
    
    // Para URLs relativas, manter como relativas para funcionar com o proxy
    const baseForUrl = fullURL.startsWith('http') ? fullURL : `${window.location.origin}${fullURL}`;
    const urlObj = new URL(baseForUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    
    // Se a URL original era relativa, retornar como relativa
    return fullURL.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
  }

  async request<TResponse = unknown, TError = unknown, TData = unknown>(
    config: RequestConfig<TData>
  ): Promise<{ data: TResponse }> {
    const {
      method = 'GET',
      url = '',
      data,
      params,
      headers = {},
      signal
    } = config;

    const requestURL = this.buildURL(url, params);
    const authHeaders = this.getAuthHeaders();
    const languageHeaders = this.getLanguageHeaders();
    const partnerHeaders = this.getPartnerHeaders();
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...languageHeaders,
      ...partnerHeaders,
      ...this.normalizeHeaders(headers)
    };

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
      signal
    };

    if (data && method !== 'GET' && method !== 'HEAD') {
      requestInit.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(requestURL, requestInit);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ResponseErrorConfig<TError> = {
          status: response.status,
          statusText: response.statusText,
          data: errorData as TError
        };
        throw error;
      }

      // Handle empty responses (like 204 No Content)
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
        return { data: null as TResponse };
      }
      
      const responseData = await response.json();
      return { data: responseData as TResponse };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      // Re-throw ResponseErrorConfig errors
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      
      // Handle network errors
      throw {
        status: 0,
        statusText: 'Network Error',
        data: error
      } as ResponseErrorConfig<TError>;
    }
  }
}

// Create and export the default fetch client instance
const fetchClient = new FetchClient();

// Export the request method as the default fetch function
export default fetchClient.request.bind(fetchClient);