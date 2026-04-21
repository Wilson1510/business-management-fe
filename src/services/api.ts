const API_ORIGIN = import.meta.env.VITE_API_ORIGIN_LOCAL as string;

export type ApiFetchInit = RequestInit & {
  /** Jangan sertakan Bearer (mis. endpoint login). */
  skipAuth?: boolean;
};

export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const { skipAuth = false, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (!skipAuth) {
    const token = localStorage.getItem('access');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  if (rest.body && !(rest.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${API_ORIGIN}${path}`, { ...rest, headers });
}
