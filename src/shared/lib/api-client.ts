const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = errorBody || response.statusText;

    try {
      const payload: unknown = JSON.parse(errorBody);
      if (typeof payload === 'object' && payload !== null && 'message' in payload) {
        const apiMessage = payload.message;
        if (typeof apiMessage === 'string') {
          message = apiMessage;
        }
      }
    } catch {
      // Keep the plain response text when the API did not return JSON.
    }

    throw new Error(`API Error [${response.status}]: ${message}`);
  }

  return response.json();
}
