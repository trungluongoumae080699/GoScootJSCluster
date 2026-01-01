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

import { getSessionId, clearAuth, getApiBaseUrl } from "../authService";
import { FetchApiArgs, FetchResult, } from "../../hooks/usePaginationList";
import { BikeFilterPayload } from "../../context/BikeManagementContext";
import { UnauthenticatedException } from "../../models/Exceptions/ApiExceptions";

// Re-export auth functions for backward compatibility
export { getSessionId, clearAuth as clearSession } from "../authService";

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
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
  //requiresAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Required for ngrok tunnels
  };

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
    throw new UnauthenticatedException("Session expired. Please log in again.");
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
 * Trip API
 */




/**
 * Hub API
 */

// export const hubApi = {
//   /**
//    * Get hubs in a specific area
//    */
//   async getHubsInArea(bounds: GetHubsOptions): Promise<HubsResponse> {
//     const params = new URLSearchParams();

//     if (bounds.maxLong !== undefined) {
//       params.append('maxLong', bounds.maxLong.toString());
//     }
//     if (bounds.minLong !== undefined) {
//       params.append('minLong', bounds.minLong.toString());
//     }
//     if (bounds.maxLat !== undefined) {
//       params.append('maxLat', bounds.maxLat.toString());
//     }
//     if (bounds.minLat !== undefined) {
//       params.append('minLat', bounds.minLat.toString());
//     }

//     const queryString = params.toString();
//     const endpoint = queryString ? `/dashboard/use/hubs?${queryString}` : '/dashboard/use/hubs';

//     return apiRequest<HubsResponse>(endpoint);
//   },

//   /**
//    * Get bikes in a specific hub
//    */
  
//   /*
//   async getBikesInHub(hubId: string): Promise<BikesResponse> {
//     // Use the regular bikes endpoint with hub filter parameter
//     console.log('🔧 Fixed getBikesInHub calling bikeApi.getBikes with hub:', hubId);
//     return bikeApi.getBikes({ hub: hubId });
//   },
//   */
  
// };
