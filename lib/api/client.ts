type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type ApiRequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string | null;
  cache?: RequestCache;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";
}

function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("bakery_auth_token");
}

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, headers = {}, token, cache = "no-store" }: ApiRequestOptions = {},
): Promise<T> {
  const authToken = token ?? getStoredAuthToken();

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache,
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload?.error?.code, payload?.error?.details);
  }

  return payload as T;
}
