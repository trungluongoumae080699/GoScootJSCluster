
import type {
  Bike,
  BikeTelemetry,
  Trip,
  // Alert, // Will be available after DTO package rebuild
} from '@trungthao/admin_dashboard_dto';

import { getSessionId, clearAuth, getApiBaseUrl } from './authService';

// Re-export auth functions for backward compatibility
export { getSessionId, clearAuth as clearSession } from './authService';

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

/** Session storage keys */
const SESSION_KEY = 'goscoot_session_id';
const MQTT_PASSWORD_KEY = 'goscoot_mqtt_password';

/**
 * Test credentials (formless sign-in) - TEMPORARY
 * These will be replaced by actual login response
 * Staff Profile: Martin Larkin (Martin.Larkin@hotmail.com)
 * Staff ID: 26b7e566-defb-441c-8148-f06bcebb7a49
 */
const TEST_SESSION_ID = '8ecc770d-8962-4b85-8b9f-bf7e5b3f8ac9';
const TEST_MQTT_PASSWORD = 'AaynoOeGK97zKc+F/D/Exg==';

/**
 * Get the current session ID from storage
 * Falls back to test session ID if not found
 */
export function getSessionId(): string | null {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    return stored;
  }
  // Fallback to test credentials for development
  sessionStorage.setItem(SESSION_KEY, TEST_SESSION_ID);
  return TEST_SESSION_ID;
}

/**
 * Get MQTT password for real-time connections
 * Automatically retrieved from login response
 */
export function getMqttPassword(): string {
  const stored = sessionStorage.getItem(MQTT_PASSWORD_KEY);
  if (stored) {
    return stored;
  }
  // Fallback to test credentials for development
  sessionStorage.setItem(MQTT_PASSWORD_KEY, TEST_MQTT_PASSWORD);
  return TEST_MQTT_PASSWORD;
}

/**
 * Store session credentials (session ID and MQTT password)
 */
export function setSessionId(sessionId: string, mqttPassword?: string): void {
  sessionStorage.setItem(SESSION_KEY, sessionId);
  if (mqttPassword) {
    sessionStorage.setItem(MQTT_PASSWORD_KEY, mqttPassword);
  }
}

/**
 * Clear all session data from storage
 */
export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(MQTT_PASSWORD_KEY);
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
    'ngrok-skip-browser-warning': 'true', // Required for ngrok tunnels
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
    clearAuth();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Bike API
 */
export const authApi = {
  /**
   * Log in with email and password
   * Returns session ID, MQTT password, and staff profile
   * Automatically stores credentials for future use
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

    // Store session ID and MQTT password for future requests
    setSessionId(response.sessionId, response.mqtt_password || undefined);

    console.log('✅ Login successful - credentials stored automatically');
    console.log('📧 Staff:', response.staffProfile.full_name, `(${response.staffProfile.email})`);

    return response;
  },

  /**
   * Get all bikes with optional filters and pagination
   * Returns paginated response with bikes, total, totalPages
   */
  async getBikes(options: GetBikesOptions = {}): Promise<BikesResponse> {
    const params = new URLSearchParams();
    
    if (options.page) {
      params.append('page', options.page.toString());
    }
    if (options.battery !== undefined) {
      params.append('battery', options.battery.toString());
    }
    if (options.hub) {
      params.append('hub', options.hub);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/dashboard/bikes?${queryString}` : '/dashboard/bikes';
    
    return apiRequest<BikesResponse>(endpoint);
  },

  /**
   * Get all bikes (legacy - returns array directly)
   * @deprecated Use getBikes() instead for pagination support
   */
  async getAllBikes(): Promise<Bike[]> {
    const response = await this.getBikes();
    return response.bikes;
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
