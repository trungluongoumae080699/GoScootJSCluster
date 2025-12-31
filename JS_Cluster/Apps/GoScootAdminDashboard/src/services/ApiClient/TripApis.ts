// /** Trip Filter Options */
// export interface GetTripsOptions {
//   from?: number; // Start timestamp (reservation_date)
//   to?: number; // End timestamp (reservation_date)
//   status?: string; // Trip status filter
//   sortBy?: "reservation_date" | "price";
//   sortDirection?: "asc" | "desc";
//   page?: number; // Page number
//   pageSize?: number; // Items per page
// }

// /** Trips API Response */
// export interface TripsResponse {
//   trips: Trip[];
//   page: number;
//   pageSize: number;
//   total: number;
//   totalPages: number;
// }

// export const tripApi = {
//   /**
//    * Get trips for a specific bike with optional date filtering
//    * Returns TripsResponse with pagination
//    */
//   async getTripsByBike(
//     bikeId: string,
//     options: GetTripsOptions = {}
//   ): Promise<TripsResponse> {
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
//     if (options.status) {
//       params.append("status", options.status);
//     }
//     if (options.sortBy) {
//       params.append("sortBy", options.sortBy);
//     }
//     if (options.sortDirection) {
//       params.append("sortDirection", options.sortDirection);
//     }

//     const queryString = params.toString();
//     const endpoint = queryString
//       ? `/dashboard/use/trips/${bikeId}?${queryString}`
//       : `/dashboard/use/trips/${bikeId}`;

//     const response = await apiRequest<any>(endpoint);

//     // Handle both old format (array) and new format (object with pagination)
//     if (Array.isArray(response)) {
//       return {
//         trips: response,
//         page: 1,
//         pageSize: response.length,
//         total: response.length,
//         totalPages: 1,
//       };
//     }

//     return {
//       trips: response.trips || [],
//       page: response.page || 1,
//       pageSize: response.pageSize || 50,
//       total: response.total || 0,
//       totalPages: response.totalPages || 1,
//     };
//   },

//   /**
//    * Get all trips
//    */
  
//   async getAllTrips( // For fast testing, only fetches first 5 pages of bikes
//     tripOptions: GetTripsOptions = {}
//   ): Promise<Trip[]> {
//     const MAX_PAGES = 3;
//     const trips: Trip[] = [];

//     for (let page = 1; page <= MAX_PAGES; page++) {
//       const bikePage = await bikeApi.getBikes({ page });

//       for (const bike of bikePage.bikes) {
//         const tripResponse = await tripApi.getTripsByBike(bike.id, tripOptions);
//         trips.push(...tripResponse.trips);
//       }
//     }

//     return trips;
//   },
// };