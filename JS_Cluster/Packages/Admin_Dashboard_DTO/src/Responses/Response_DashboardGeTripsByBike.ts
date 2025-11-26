import { Trip } from "../Models/Trip.js";

export interface Response_DashboardGetTripsByBikeDTO {
  trips: Trip[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}