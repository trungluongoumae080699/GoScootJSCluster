import { Bike } from "@trungthao/admin_dashboard_dto";
import { FetchApiArgs, FetchResult } from "../../hooks/usePaginationList";
import { BikeFilterPayload } from "../../context/BikeManagementContext";
import { apiRequest } from "./apiClient";

/**
 * Bike API
 */
export const bikeApi = {
  /**
   * Get all bikes with optional filters and pagination
   * Returns paginated response with bikes, total, totalPages
   */

  async getBikes(options: FetchApiArgs<BikeFilterPayload>): Promise<FetchResult<Bike>> {
    const params = new URLSearchParams();

    // ✅ your paging is "group start page" (1, 6, 11...)
    params.append("page", options.startPage.toString());

    // ✅ only ask server for totalCount when needed
    if (options.withTotalCount) {
      params.append("withTotalCount", "true");
    }

    // ✅ filters come from options.filter
    const { search, battery, operationStatus, status } = options.filter;

    if (search?.trim()) params.append("search", search.trim());
    if (operationStatus?.trim()) params.append("operationStatus", operationStatus.trim());
    if (status?.trim()) params.append("status", status.trim());

    // battery is a string in your payload; convert safely
    const batteryNum =
      battery?.trim() === "" ? undefined : Number(battery.trim());

    if (batteryNum !== undefined && Number.isFinite(batteryNum)) {
      params.append("battery", String(batteryNum));
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/dashboard/use/bikes?${queryString}`
      : "/dashboard/use/bikes";

    const response = await apiRequest<FetchResult<Bike>>(endpoint, {
      signal: options.signal, // ✅ THIS is the key line
    });
    return response

  },

  /**
   * Get bike telemetry (location and battery data) with optional date filtering
   * Returns TelemetryResponse with pagination
   */
//   async getBikeTelemetry(
//     bikeId: string,
//     options: GetTelemetryOptions = {}
//   ): Promise<TelemetryResponse> {
//     const params = new URLSearchParams();

//     if (options.page) {
//       params.append("page", options.page.toString());
//     }
//     if (options.pageSize) {
//       params.append("pageSize", options.pageSize.toString());
//     }
//     if (options.from !== undefined) {
//       params.append("from", options.from.toString());
//     }
//     if (options.to !== undefined) {
//       params.append("to", options.to.toString());
//     }
//     if (options.sortDirection) {
//       params.append("sortDirection", options.sortDirection);
//     }

//     const queryString = params.toString();
//     const endpoint = queryString
//       ? `/dashboard/use/telemetry/${bikeId}?${queryString}`
//       : `/dashboard/use/telemetry/${bikeId}`;

//     const response = await apiRequest<any>(endpoint);

//     // Handle both old format (array) and new format (object with pagination)
//     if (Array.isArray(response)) {
//       return {
//         telemetry: response,
//         page: 1,
//         pageSize: response.length,
//         total: response.length,
//         totalPages: 1,
//       };
//     }

//     // Server returns 'data' field, not 'telemetry'
//     return {
//       telemetry: response.data || response.telemetry || [],
//       page: response.page || 1,
//       pageSize: response.pageSize || 50,
//       total: response.total || 0,
//       totalPages: response.totalPages || 1,
//     };
//   },

  /**
   * Export all telemetry data for a bike with date filters (no pagination limit)
   * Used for Excel export - fetches all records matching the filter
   */
//   async exportBikeTelemetry(
//     bikeId: string,
//     options: Omit<GetTelemetryOptions, "page" | "pageSize"> = {}
//   ): Promise<BikeTelemetry[]> {
//     const params = new URLSearchParams();

//     // Large page size to get all data for export
//     params.append("pageSize", "10000");

//     if (options.from !== undefined) {
//       params.append("from", options.from.toString());
//     }
//     if (options.to !== undefined) {
//       params.append("to", options.to.toString());
//     }
//     if (options.sortDirection) {
//       params.append("sortDirection", options.sortDirection);
//     }

//     const queryString = params.toString();
//     const endpoint = `/dashboard/use/telemetry/${bikeId}?${queryString}`;

//     const response = await apiRequest<any>(endpoint);

//     if (Array.isArray(response)) {
//       return response;
//     }

//     // Server returns 'data' field, not 'telemetry'
//     return response.data || response.telemetry || [];
//   },

//   /**
//    * Get latest telemetry for all bikes
//    */
//   async getAllBikesTelemetry(): Promise<BikeTelemetry[]> {
//     return apiRequest<BikeTelemetry[]>('/dashboard/use/telemetry');
//   },
};