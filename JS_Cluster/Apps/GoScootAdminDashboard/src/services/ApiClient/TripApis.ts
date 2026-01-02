import { Trip } from "@trungthao/admin_dashboard_dto";
import { TripFilterPayload } from "../../hooks/PageHooks/useTripListing";
import { FetchApiArgs, FetchResult } from "../../hooks/usePaginationListSimple";
import { apiRequest } from "./apiClient";

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

export const tripApi = {
    /**
     * Get trips for a specific bike with optional date filtering
     * Returns TripsResponse with pagination
     */


    /**
     * Get all trips
     */

    async getTrips(options: FetchApiArgs<TripFilterPayload>): Promise<FetchResult<Trip>> {
        const params = new URLSearchParams();

        // ✅ your paging is "group start page" (1, 6, 11...)
        params.append("page", options.startPage.toString());
        params.append("limit", options.pageSize.toString());

        // ✅ filters come from options.filter
        const { search, bikeId, from, to, status } = options.filter;

        if (search?.trim()) params.append("search", search.trim());
        if (bikeId?.trim()) params.append("bikeId", bikeId.trim());
        if (status?.trim()) params.append("status", status.trim());
        if (from?.trim()) params.append("from", search.trim());
        if (to?.trim()) params.append("to", search.trim());
        const queryString = params.toString();
        const endpoint = queryString
            ? `/dashboard/use/trips?${queryString}`
            : "/dashboard/use/trips";

        const response = await apiRequest<FetchResult<Trip>>(endpoint, {
            signal: options.signal, // ✅ THIS is the key line
        });
        return response

    },
};