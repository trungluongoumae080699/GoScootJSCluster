import { Alert } from "../Models/Alerts.js";

export interface Response_DashboardGetAlertsDTO {
  alerts: Alert[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}