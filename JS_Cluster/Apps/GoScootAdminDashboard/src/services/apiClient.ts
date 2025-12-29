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
} from "@trungthao/admin_dashboard_dto";

import { getSessionId, clearAuth, getApiBaseUrl } from "./authService";

// Re-export auth functions for backward compatibility
export { getSessionId, clearAuth as clearSession } from "./authService";

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

/** Hub interface - matches server response */
export interface Hub {
  id: string;
  longitude: number;
  latitude: number;
  address: string;
  deleted: boolean;
  last_modification_date: number;
  created_at: number; // Unix timestamp in milliseconds
  // Optional fields for display (can be calculated or defaulted)
  name?: string;
  capacity?: number;
  current_bikes?: number;
}

/** Hub API Response - server returns array directly */
export type HubsResponse = Hub[];

/** Get Hubs Options */
export interface GetHubsOptions {
  maxLong?: number;
  minLong?: number;
  maxLat?: number;
  minLat?: number;
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
  battery?: number; // Max battery percentage
  hub?: string; // Hub ID filter
  page?: number; // Page number (default: 1)
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
  //requiresAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Required for ngrok tunnels
  };

  // Add authorization header for authenticated requests
  /*
  if (requiresAuth) {
    const sessionId = getSessionId();
    if (!sessionId) {
      throw new Error("No session ID found. Please log in.");
    }
    headers["authorization"] = sessionId;
  }
    */

  // Merge with any additional headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", 
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    clearAuth();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/** Telemetry Filter Options */
export interface GetTelemetryOptions {
  from?: number; // Start timestamp
  to?: number; // End timestamp
  page?: number; // Page number
  pageSize?: number; // Items per page
  sortDirection?: "asc" | "desc";
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
 * Generate mock battery level based on bike ID
 * Creates consistent battery levels for testing when Redis has no telemetry data
 */
function generateMockBattery(bikeId: string): number {
  // Use bike ID to generate consistent battery level
  let hash = 0;
  for (let i = 0; i < bikeId.length; i++) {
    const char = bikeId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert hash to battery percentage (10-95% range for realism)
  const battery = Math.abs(hash) % 86 + 10; // 10-95%
  return battery;
}

/**
 * Add mock battery data to bikes that have null/undefined battery_status
 */
function addMockBatteryToBikes(bikes: Bike[]): Bike[] {
  return bikes.map(bike => ({
    ...bike,
    battery_status: bike.battery_status ?? generateMockBattery(bike.id)
  }));
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
      params.append("page", options.page.toString());
    }
    if (options.battery !== undefined) {
      params.append("battery", options.battery.toString());
    }
    if (options.hub) {
      params.append("hub", options.hub);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/dashboard/use/bikes?${queryString}` : '/dashboard/use/bikes';
    
    const response = await apiRequest<BikesResponse>(endpoint);
    
    // Add mock battery data for bikes with null/undefined battery_status
    const bikesWithMockBattery = addMockBatteryToBikes(response.bikes);
    
    // If battery filter is applied, filter the results with mock battery data
    let filteredBikes = bikesWithMockBattery;
    if (options.battery !== undefined) {
      filteredBikes = bikesWithMockBattery.filter(bike => 
        (bike.battery_status ?? 0) <= options.battery!
      );
    }
    
    return {
      ...response,
      bikes: filteredBikes,
      total: filteredBikes.length,
      totalPages: Math.ceil(filteredBikes.length / (response.pageSize || 50))
    };
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
    let bike = allBikes.find((b) => b.id === bikeId);

    if (!bike && response.totalPages > 1) {
      // Search remaining pages
      for (let page = 2; page <= response.totalPages && !bike; page++) {
        const pageResponse = await this.getBikes({ page });
        bike = pageResponse.bikes.find((b) => b.id === bikeId);
      }
    }

    if (!bike) {
      throw new Error(`Bike with ID ${bikeId} not found`);
    }
    
    // Ensure bike has mock battery if needed
    return {
      ...bike,
      battery_status: bike.battery_status ?? generateMockBattery(bike.id)
    };
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
      params.append("page", options.page.toString());
    }
    if (options.pageSize) {
      params.append("pageSize", options.pageSize.toString());
    }
    if (options.from !== undefined) {
      params.append("from", options.from.toString());
    }
    if (options.to !== undefined) {
      params.append("to", options.to.toString());
    }
    if (options.sortDirection) {
      params.append("sortDirection", options.sortDirection);
    }

    const queryString = params.toString();
    const endpoint = queryString 
      ? `/dashboard/use/telemetry/${bikeId}?${queryString}` 
      : `/dashboard/use/telemetry/${bikeId}`;
    
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
    options: Omit<GetTelemetryOptions, "page" | "pageSize"> = {}
  ): Promise<BikeTelemetry[]> {
    const params = new URLSearchParams();

    // Large page size to get all data for export
    params.append("pageSize", "10000");

    if (options.from !== undefined) {
      params.append("from", options.from.toString());
    }
    if (options.to !== undefined) {
      params.append("to", options.to.toString());
    }
    if (options.sortDirection) {
      params.append("sortDirection", options.sortDirection);
    }

    const queryString = params.toString();
    const endpoint = `/dashboard/use/telemetry/${bikeId}?${queryString}`;
    
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
    return apiRequest<BikeTelemetry[]>('/dashboard/use/telemetry');
  },
};

/** Trip Filter Options */
export interface GetTripsOptions {
  from?: number; // Start timestamp (reservation_date)
  to?: number; // End timestamp (reservation_date)
  status?: string; // Trip status filter
  sortBy?: "reservation_date" | "price";
  sortDirection?: "asc" | "desc";
  page?: number; // Page number
  pageSize?: number; // Items per page
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
      params.append("page", options.page.toString());
    }
    if (options.pageSize) {
      params.append("pageSize", options.pageSize.toString());
    }
    if (options.from !== undefined) {
      params.append("from", options.from.toString());
    }
    if (options.to !== undefined) {
      params.append("to", options.to.toString());
    }
    if (options.status) {
      params.append("status", options.status);
    }
    if (options.sortBy) {
      params.append("sortBy", options.sortBy);
    }
    if (options.sortDirection) {
      params.append("sortDirection", options.sortDirection);
    }

    const queryString = params.toString();
    const endpoint = queryString 
      ? `/dashboard/use/trips/${bikeId}?${queryString}` 
      : `/dashboard/use/trips/${bikeId}`;
    
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
  async getAllTrips( // For fast testing, only fetches first 5 pages of bikes
    tripOptions: GetTripsOptions = {}
  ): Promise<Trip[]> {
    const MAX_PAGES = 3;
    const trips: Trip[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const bikePage = await bikeApi.getBikes({ page });

      for (const bike of bikePage.bikes) {
        const tripResponse = await tripApi.getTripsByBike(bike.id, tripOptions);
        trips.push(...tripResponse.trips);
      }
    }

    return trips;
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
  async getAllAlerts(page: number): Promise<Response_DashboardGetAlertsDTO> {
    const response = await apiRequest<Response_DashboardGetAlertsDTO>(
      `/dashboard/use/alerts?page=${page}`
    );

    return response;
  },

  /**
   * Get alerts for a specific bike
   * Note: Using the general alerts endpoint with bikeId filter
   */
  async getAlertsByBike(
    bikeId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<Alert[]> {
    const response = await apiRequest<any>(
      `/dashboard/use/alerts?bikeId=${bikeId}&page=${page}&pageSize=${pageSize}`
    );
    // Extract alerts array from response
    return response.alerts || response;
  },
};

/**
 * Hub API
 */
export const hubApi = {
  /**
   * Get hubs in a specific area
   */
  async getHubsInArea(bounds: GetHubsOptions): Promise<HubsResponse> {
    const params = new URLSearchParams();
    
    if (bounds.maxLong !== undefined) {
      params.append('maxLong', bounds.maxLong.toString());
    }
    if (bounds.minLong !== undefined) {
      params.append('minLong', bounds.minLong.toString());
    }
    if (bounds.maxLat !== undefined) {
      params.append('maxLat', bounds.maxLat.toString());
    }
    if (bounds.minLat !== undefined) {
      params.append('minLat', bounds.minLat.toString());
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/dashboard/use/hubs?${queryString}` : '/dashboard/use/hubs';
    
    return apiRequest<HubsResponse>(endpoint);
  },

  /**
   * Get bikes in a specific hub
   */
  async getBikesInHub(hubId: string): Promise<BikesResponse> {
    // Use the regular bikes endpoint with hub filter parameter
    console.log('🔧 Fixed getBikesInHub calling bikeApi.getBikes with hub:', hubId);
    return bikeApi.getBikes({ hub: hubId });
  },
};
