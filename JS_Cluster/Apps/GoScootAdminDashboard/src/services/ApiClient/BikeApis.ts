import { Bike, BikeTelemetry } from "@trungthao/admin_dashboard_dto";

import { apiRequest } from "./apiClient";
import { FetchApiArgs, FetchResult } from "../../hooks/usePaginationListSimple";
import { BikeFilterPayload } from "../../hooks/PageHooks/useBikeListing";
import { TelemetryFilterPayload } from "../../hooks/PageHooks/useTelemetryListing";

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
    params.append("limit", options.pageSize.toString());

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

  async getBikeId(bikeId: string, signal?: AbortSignal): Promise<Bike> {
    const endpoint = `/dashboard/use/bike/${bikeId}`
    const response = await apiRequest<Bike>(endpoint, {
      signal, // ✅ use the function param, not options.signal
    });

    return response;
  },


  async getBikeTelemetry(options: FetchApiArgs<TelemetryFilterPayload>): Promise<FetchResult<BikeTelemetry>> {
    const params = new URLSearchParams();

    // ✅ your paging is "group start page" (1, 6, 11...)
    params.append("page", options.startPage.toString());
    params.append("limit", options.pageSize.toString());

    // ✅ filters come from options.filter
    const { bikeId, from, to } = options.filter;

    if (bikeId?.trim()) params.append("bikeId", bikeId.trim());
    if (from?.trim()) params.append("from", from.trim());
    if (to?.trim()) params.append("to", to.trim());


    const queryString = params.toString();
    const endpoint = queryString
      ? `/dashboard/use/telemetry?${queryString}`
      : "/dashboard/use/telemetry";

    const response = await apiRequest<FetchResult<BikeTelemetry>>(endpoint, {
      signal: options.signal, // ✅ THIS is the key line
    });
    return response

  },


};