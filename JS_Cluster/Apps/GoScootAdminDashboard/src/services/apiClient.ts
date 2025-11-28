/**
 * API Client Service
 * Handles all HTTP requests to the backend API with authentication
 * Uses DTOs from @trungthao/admin_dashboard_dto package
 */

import type {
  Request_DashboardLogInDTO,
  Response_DashboardLogInDTO,
  Bike,
  BikeTelemetry,
  Trip,
  // Alert, // Will be available after DTO package rebuild
} from '@trungthao/admin_dashboard_dto';

// Temporary Alert type until DTO package is rebuilt
interface Alert {
  id: string;
  bike_id: string;
  content: string;
  type: string;
  longitude: number;
  latitude: number;
  time: number;
}

/** Base API URL from environment variables */
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'https://still-simply-katydid.ngrok.app/GoScoot/Server';

/** Session storage key for storing session ID */
const SESSION_KEY = 'goscoot_session_id';

/** Hardcoded session ID for testing (formless sign-in) */
const TEST_SESSION_ID = '59a79823-b278-474d-9f58-ad3ef79723e5';

/**
 * Get the current session ID from storage
 * Falls back to test session ID if not found
 */
export function getSessionId(): string | null {
  // Always use the latest test session ID (clear old cached value)
  sessionStorage.setItem(SESSION_KEY, TEST_SESSION_ID);
  return TEST_SESSION_ID;
}

/**
 * Store session ID in session storage
 */
export function setSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_KEY, sessionId);
}

/**
 * Clear session ID from storage
 */
export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Make an authenticated API request
 * Automatically includes authorization header for non-auth requests
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authorization header for authenticated requests
  if (requiresAuth) {
    const sessionId = getSessionId();
    if (!sessionId) {
      throw new Error('No session ID found. Please log in.');
    }
    headers['authorization'] = sessionId;
  }

  // Merge with any additional headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    clearSession();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Log in with email and password
   * Returns session ID and staff profile
   */
  async login(credentials: Request_DashboardLogInDTO): Promise<Response_DashboardLogInDTO> {
    const response = await apiRequest<Response_DashboardLogInDTO>(
      '/dashboard/auth/signIn',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      false // Login doesn't require auth
    );

    // Store session ID for future requests
    setSessionId(response.sessionId);

    return response;
  },

  /**
   * Log out and clear session
   */
  async logout(): Promise<void> {
    try {
      await apiRequest('/dashboard/auth/signIn/session', { method: 'DELETE' });
    } finally {
      clearSession();
    }
  },
};

/**
 * Bike API
 */
export const bikeApi = {
  /**
   * Get all bikes
   */
  async getAllBikes(): Promise<Bike[]> {
    return apiRequest<Bike[]>('/dashboard/bikes');
  },

  /**
   * Get bike by ID
   */
  async getBikeById(bikeId: string): Promise<Bike> {
    return apiRequest<Bike>(`/dashboard/bikes/${bikeId}`);
  },

  /**
   * Get bike telemetry (location and battery data)
   * Returns Response_DashboardGetBikeTelemetry with pagination
   */
  async getBikeTelemetry(bikeId: string, page: number = 1, pageSize: number = 100): Promise<BikeTelemetry[]> {
    const response = await apiRequest<any>(
      `/dashboard/bikes/${bikeId}/telemetry?page=${page}&pageSize=${pageSize}`
    );
    // Extract telemetry array from response
    return response.telemetry || response;
  },

  /**
   * Get latest telemetry for all bikes
   */
  async getAllBikesTelemetry(): Promise<BikeTelemetry[]> {
    return apiRequest<BikeTelemetry[]>('/dashboard/telemetry');
  },
};

/**
 * Trip API
 */
export const tripApi = {
  /**
   * Get trips for a specific bike
   * Returns Response_DashboardGeTripsByBike with pagination
   */
  async getTripsByBike(bikeId: string, page: number = 1, pageSize: number = 50): Promise<Trip[]> {
    const response = await apiRequest<any>(
      `/dashboard/bikes/${bikeId}/trips?page=${page}&pageSize=${pageSize}`
    );
    // Extract trips array from response
    return response.trips || response;
  },

  /**
   * Get all trips
   */
  async getAllTrips(): Promise<Trip[]> {
    return apiRequest<Trip[]>('/dashboard/trips');
  },
};

/**
 * Alert API
 */
export const alertApi = {
  /**
   * Get all alerts
   * Returns Response_DashboardGetAlertsDTO with pagination
   */
  async getAllAlerts(page: number = 1, pageSize: number = 50): Promise<Alert[]> {
    const response = await apiRequest<any>(
      `/dashboard/alerts?page=${page}&pageSize=${pageSize}`
    );
    // Extract alerts array from response
    return response.alerts || response;
  },

  /**
   * Get alerts for a specific bike
   */
  async getAlertsByBike(bikeId: string, page: number = 1, pageSize: number = 50): Promise<Alert[]> {
    const response = await apiRequest<any>(
      `/dashboard/bikes/${bikeId}/alerts?page=${page}&pageSize=${pageSize}`
    );
    // Extract alerts array from response
    return response.alerts || response;
  },
};
