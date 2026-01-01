import { Alert } from "../../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";
import { AlertFilterPayload } from "../../hooks/useAlertListing";
import { FetchApiArgs, FetchResult } from "../../hooks/usePaginationListSimple";
import { apiRequest } from "./apiClient";


/**
 * Alert API
 */
export const alertApi = {
  /**
   * Get all alerts
   * Returns Response_DashboardGetAlertsDTO with pagination
   */


    async getAlerts(options: FetchApiArgs<AlertFilterPayload>): Promise<FetchResult<Alert>> {
      const params = new URLSearchParams();
  
      // ✅ your paging is "group start page" (1, 6, 11...)
      params.append("page", options.startPage.toString());
    
      // ✅ filters come from options.filter
      const { search, from, to } = options.filter;
  
    if (search?.trim()) params.append("search", search.trim());
    if (from?.trim()) params.append("from", search.trim());
    if (to?.trim()) params.append("to", search.trim());
      
  
      const queryString = params.toString();
      const endpoint = queryString
        ? `/dashboard/use/alerts?${queryString}`
        : "/dashboard/use/alerts";
  
      const response = await apiRequest<FetchResult<Alert>>(endpoint, {
        signal: options.signal, // ✅ THIS is the key line
      });
      return response
  
    },


};