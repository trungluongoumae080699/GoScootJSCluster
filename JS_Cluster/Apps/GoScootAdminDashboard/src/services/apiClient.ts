/**
 * API Client Service
 * Handles all HTTP requests to the backend API with authentication
 * Uses DTOs from @trungthao/admin_dashboard_dto package
 */

import type {
  Bike,
  BikeTelemetry,
  Response_DashboardGetAlertsDTO,
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

/** Bikes API Response */
export interface BikesResponse {
  bikes: Bike[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Bikes API Filter Options */
export interface GetBikesOptions {
  battery?: number;  // Max battery percentage
  hub?: string;      // Hub ID filter
  page?: number;     // Page number (default: 1)
}

/** Base API URL */
const API_BASE_URL = getApiBaseUrl();

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
export const bikeApi = {
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
  async getAllAlerts(): Promise<Response_DashboardGetAlertsDTO> {
    const response = await apiRequest<Response_DashboardGetAlertsDTO>(
      `/dashboard/alerts`
    );

    return response;
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