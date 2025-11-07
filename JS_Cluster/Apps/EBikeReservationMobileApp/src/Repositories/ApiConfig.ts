const API_BASE =  "https://still-simply-katydid.ngrok.app/app";

export const jsonHeaders = {
    "Content-Type": "application/json",
};

export enum Apis {
    registration = `${API_BASE}/auth/signUp`,
    authenticate = `${API_BASE}/auth/signIn`,
    authenticateWithSession = `${API_BASE}/auth/signIn/session`,
    forgetPassword = `${API_BASE}/auth/forgetPassword`,
}

// HttpError.ts — base and specific error classes
export class HttpError extends Error {
  status: number;
  url?: string;
  body?: any;

  constructor(message: string, status: number, url?: string, body?: any) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export class BadRequestError extends HttpError {
  constructor(url?: string, body?: any) {
    const msg = body?.message || "Bad Request — The server could not process your request.";
    super(msg, 400, url, body);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(url?: string, body?: any) {
    const msg = body?.message || "Unauthorized — Please log in again.";
    super(msg, 401, url, body);
  }
}

export class ForbiddenError extends HttpError {
  constructor(url?: string, body?: any) {
    const msg = body?.message || "Forbidden — You don’t have permission to access this resource.";
    super(msg, 403, url, body);
  }
}

export class NotFoundError extends HttpError {
  constructor(url?: string, body?: any) {
    const msg = body?.message || "Not Found — The requested resource was not found.";
    super(msg, 404, url, body);
  }
}

export class ServerError extends HttpError {
  constructor(status: number, url?: string, body?: any) {
    const msg = body?.message || `Server Error — The server responded with ${status}.`;
    super(msg, status, url, body);
  }
}


export async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);

  let payload: any = null;
  const isJSON = res.headers.get("content-type")?.includes("application/json");

  if (isJSON) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      payload = await res.text();
    } catch {
      payload = null;
    }
  }

  if (res.ok) return payload as T;

  // Handle errors with detailed message fallback
  const message = payload?.message || `HTTP ${res.status} — ${res.statusText || "Error"}`;

  switch (res.status) {
    case 400:
      throw new BadRequestError(res.url, payload || { message });
    case 401:
      throw new UnauthorizedError(res.url, payload || { message });
    case 403:
      throw new ForbiddenError(res.url, payload || { message });
    case 404:
      throw new NotFoundError(res.url, payload || { message });
    default:
      if (res.status >= 500) throw new ServerError(res.status, res.url, payload || { message });
      throw new HttpError(message, res.status, res.url, payload);
  }
}