// /**
//  * Alert API
//  */
// export const alertApi = {
//   /**
//    * Get all alerts
//    * Returns Response_DashboardGetAlertsDTO with pagination
//    */
//   async getAllAlerts(page: number): Promise<Response_DashboardGetAlertsDTO> {
//     const response = await apiRequest<Response_DashboardGetAlertsDTO>(
//       `/dashboard/use/alerts?page=${page}`
//     );

//     return response;
//   },

//   /**
//    * Get alerts for a specific bike
//    * Note: Using the general alerts endpoint with bikeId filter
//    */
//   async getAlertsByBike(
//     bikeId: string,
//     page: number = 1,
//     pageSize: number = 50
//   ): Promise<Alert[]> {
//     const response = await apiRequest<any>(
//       `/dashboard/use/alerts?bikeId=${bikeId}&page=${page}&pageSize=${pageSize}`
//     );
//     // Extract alerts array from response
//     return response.alerts || response;
//   },
// };