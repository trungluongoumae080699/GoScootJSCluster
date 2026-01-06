/**
 * API Client Service
 * Handles all HTTP requests to the backend API with authentication
 * Uses DTOs from @trungthao/admin_dashboard_dto package
 */

import type {
  Bike,
  BikeTelemetry,
  // Alert, // Will be available after DTO package rebuild
} from "@trungthao/admin_dashboard_dto";

import { getApiBaseUrl } from "../authService";
import { BadRequestException, UnauthenticatedException } from "../../models/Exceptions/ApiExceptions";
import { resolve } from "path";

// Re-export auth functions for backward compatibility
export { getSessionId, clearAuth as clearSession } from "../authService";



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

  if (response.status === 401) {
    throw new UnauthenticatedException("Session expired. Please log in again.");
  }

  if (response.status === 400) {
    const data = await response.json().catch(() => null);
    throw new BadRequestException(
      data?.message ?? "Đã xảy ra lỗi, xin vui lòng thử lại"
    );
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
 * Trip API
 */




/**
 * Hub API
 */

export const hubApi = {
  /**
   * Get hubs in a specific area
   */


  /**
   * Get bikes in a specific hub
   */

  /*
  async getBikesInHub(hubId: string): Promise<BikesResponse> {
    // Use the regular bikes endpoint with hub filter parameter
    console.log('🔧 Fixed getBikesInHub calling bikeApi.getBikes with hub:', hubId);
    return bikeApi.getBikes({ hub: hubId });
  },
  */

};
