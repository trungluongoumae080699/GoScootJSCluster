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

/** Telemetry Filter Options */
export interface GetTelemetryOptions {
  from?: number;       // Start timestamp
  to?: number;         // End timestamp
  page?: number;       // Page number
  pageSize?: number;   // Items per page
  sortDirection?: 'asc' | 'desc';
}

/** Telemetry API Response */
export interface TelemetryResponse {
  telemetry: BikeTelemetry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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
   * Note: Server doesn't have a single bike endpoint, so we fetch all and filter
   */
  async getBikeById(bikeId: string): Promise<Bike> {
    // Fetch bikes and find the one with matching ID
    const response = await this.getBikes({ page: 1 });
    
    // Search through all pages if needed
    let allBikes = response.bikes;
    let bike = allBikes.find(b => b.id === bikeId);
    
    if (!bike && response.totalPages > 1) {
      // Search remaining pages
      for (let page = 2; page <= response.totalPages && !bike; page++) {
        const pageResponse = await this.getBikes({ page });
        bike = pageResponse.bikes.find(b => b.id === bikeId);
      }
    }
    
    if (!bike) {
      throw new Error(`Bike with ID ${bikeId} not found`);
    }
    
    return bike;
  },

  /**
   * Get bike telemetry (location and battery data) with optional date filtering
   * Returns TelemetryResponse with pagination
   */
  async getBikeTelemetry(
    bikeId: string, 
    options: GetTelemetryOptions = {}
  ): Promise<TelemetryResponse> {
    const params = new URLSearchParams();
    
    if (options.page) {
      params.append('page', options.page.toString());
    }
    if (options.pageSize) {
      params.append('pageSize', options.pageSize.toString());
    }
    if (options.from !== undefined) {
      params.append('from', options.from.toString());
    }
    if (options.to !== undefined) {
      params.append('to', options.to.toString());
    }
    if (options.sortDirection) {
      params.append('sortDirection', options.sortDirection);
    }
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/dashboard/telemetry/${bikeId}?${queryString}` 
      : `/dashboard/telemetry/${bikeId}`;
    
    const response = await apiRequest<any>(endpoint);
    
    // Handle both old format (array) and new format (object with pagination)
    if (Array.isArray(response)) {
      return {
        telemetry: response,
        page: 1,
        pageSize: response.length,
        total: response.length,
        totalPages: 1,
      };
    }
    
    // Server returns 'data' field, not 'telemetry'
    return {
      telemetry: response.data || response.telemetry || [],
      page: response.page || 1,
      pageSize: response.pageSize || 50,
      total: response.total || 0,
      totalPages: response.totalPages || 1,
    };
  },

  /**
   * Export all telemetry data for a bike with date filters (no pagination limit)
   * Used for Excel export - fetches all records matching the filter
   */
  async exportBikeTelemetry(
    bikeId: string,
    options: Omit<GetTelemetryOptions, 'page' | 'pageSize'> = {}
  ): Promise<BikeTelemetry[]> {
    const params = new URLSearchParams();
    
    // Large page size to get all data for export
    params.append('pageSize', '10000');
    
    if (options.from !== undefined) {
      params.append('from', options.from.toString());
    }
    if (options.to !== undefined) {
      params.append('to', options.to.toString());
    }
    if (options.sortDirection) {
      params.append('sortDirection', options.sortDirection);
    }
    
    const queryString = params.toString();
    const endpoint = `/dashboard/telemetry/${bikeId}?${queryString}`;
    
    const response = await apiRequest<any>(endpoint);
    
    if (Array.isArray(response)) {
      return response;
    }
    
    // Server returns 'data' field, not 'telemetry'
    return response.data || response.telemetry || [];
  },

  /**
   * Get latest telemetry for all bikes
   */
  async getAllBikesTelemetry(): Promise<BikeTelemetry[]> {
    return apiRequest<BikeTelemetry[]>('/dashboard/telemetry');
  },
};

/** Trip Filter Options */
export interface GetTripsOptions {
  from?: number;       // Start timestamp (reservation_date)
  to?: number;         // End timestamp (reservation_date)
  status?: string;     // Trip status filter
  sortBy?: 'reservation_date' | 'price';
  sortDirection?: 'asc' | 'desc';
  page?: number;       // Page number
  pageSize?: number;   // Items per page
}

/** Trips API Response */
export interface TripsResponse {
  trips: Trip[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Trip API
 */
export const tripApi = {
  /**
   * Get trips for a specific bike with optional date filtering
   * Returns TripsResponse with pagination
   */
  async getTripsByBike(
    bikeId: string, 
    options: GetTripsOptions = {}
  ): Promise<TripsResponse> {
    const params = new URLSearchParams();
    
    if (options.page) {
      params.append('page', options.page.toString());
    }
    if (options.pageSize) {
      params.append('pageSize', options.pageSize.toString());
    }
    if (options.from !== undefined) {
      params.append('from', options.from.toString());
    }
    if (options.to !== undefined) {
      params.append('to', options.to.toString());
    }
    if (options.status) {
      params.append('status', options.status);
    }
    if (options.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    if (options.sortDirection) {
      params.append('sortDirection', options.sortDirection);
    }
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/dashboard/trips/${bikeId}?${queryString}` 
      : `/dashboard/trips/${bikeId}`;
    
    const response = await apiRequest<any>(endpoint);
    
    // Handle both old format (array) and new format (object with pagination)
    if (Array.isArray(response)) {
      return {
        trips: response,
        page: 1,
        pageSize: response.length,
        total: response.length,
        totalPages: 1,
      };
    }
    
    return {
      trips: response.trips || [],
      page: response.page || 1,
      pageSize: response.pageSize || 50,
      total: response.total || 0,
      totalPages: response.totalPages || 1,
    };
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
   * Note: Using the general alerts endpoint with bikeId filter
   */
  async getAlertsByBike(bikeId: string, page: number = 1, pageSize: number = 50): Promise<Alert[]> {
    const response = await apiRequest<any>(
      `/dashboard/alerts?bikeId=${bikeId}&page=${page}`
    );
    // Extract alerts array from response
    return response.alerts || response;
  },
};