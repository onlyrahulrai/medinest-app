import { authStorage } from '../../utils/authStorage';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

function normalizeBaseUrl(baseUrl?: string) {
  return baseUrl?.trim().replace(/\/$/, '') ?? '';
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
}

export function isApiConfigured() {
  return getApiBaseUrl().length > 0;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new ApiError('API base URL is not configured', 0);
  }

  const token = options.skipAuth ? null : await authStorage.getToken();
  const headers = new Headers(DEFAULT_HEADERS);

  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value: string, key: string) => headers.set(key, value));
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String(payload.message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}