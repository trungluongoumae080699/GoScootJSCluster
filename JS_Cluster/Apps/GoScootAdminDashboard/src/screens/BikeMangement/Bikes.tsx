import { useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./Bikes.css";

import type { Bike, BikeStatus } from "@trungthao/admin_dashboard_dto";


import { useBikeManagementContext, BikeFilterPayload } from "../../context/BikeManagementContext";
import { usePaginationList } from "../../hooks/usePaginationList"; // path đúng dự án bạn
import { bikeApi } from "../../services/ApiClient/BikeApis";

const BIKE_TYPES = ["VINFAST EVO200", "VINFAST KLARA", "VINFAST VENTO"];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "Idle", label: "Available" },
  { value: "Inused", label: "Inused" },
  { value: "Reserved", label: "Reserved" },
];

export default function Bikes() {
  const navigate = useNavigate();

  // ✅ shared state from context
const {
  bikeList,
  setBikeList,

  displayBikeList,
  setDisplayBikeList,

  currentPage,
  setCurrentPage,

  currentPageGroupIndexForFetch,   // RefObject<number>
  prefetchedNextGroupRef,          // RefObject<PrefetchGroupPayload<Bike> | null>

  bikeCount,
  setBikeCount,

  bikeFilterPayload,
  setBikeFilterPayload,

  prevBikeFilterPayload,
} = useBikeManagementContext();



const {
  isLoading,
  totalPages,
  applyFilters,
  goToPage,
} = usePaginationList<Bike, BikeFilterPayload>(
  displayBikeList,
  setDisplayBikeList,

  bikeList,
  setBikeList,

  prefetchedNextGroupRef,

  currentPage,
  setCurrentPage,

  currentPageGroupIndexForFetch,

  bikeCount,
  setBikeCount,

  bikeFilterPayload,
  setBikeFilterPayload,

  prevBikeFilterPayload,

  bikeApi.getBikes
);

  const pageInputRef = useRef<string>("");

  const handleBikeClick = (bikeId: string) => navigate(`/bike/${bikeId}`);

  const getStatusStyle = (status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return { background: "#d4edda", color: "#155724" };
      case "Inused":
        return { background: "#ffe4c4", color: "#856404" };
      case "Reserved":
        return { background: "#fff3cd", color: "#856404" };
      default:
        return { background: "#e2e3e5", color: "#383d41" };
    }
  };

  const getStatusLabel = (status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return "Available";
      case "Inused":
        return "Inused";
      case "Reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  const availableCountOnPage = useMemo(() => {
    return displayBikeList.filter((b) => b.status === "Idle").length;
  }, [displayBikeList]);

  return (
    <div className="bike-details-container">
      <Header title="Bikes" />
      <div className="main-content">
        <Sidebar />
        <div className="content-area bikes-content">
          {/* Stats */}
          <div className="bikes-stats">
            <p>Total: {bikeCount || 0}</p>
            <p>Available (on page): {availableCountOnPage}</p>

            <button className="refresh-btn" onClick={applyFilters} disabled={isLoading} title="Apply filters & fetch group 0">
              ✅ Apply
            </button>

            {isLoading && (
              <span className="background-loading-indicator">
                Loading...
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="bikes-filters">
            <input
              type="text"
              placeholder="Search Bike's VIN"
              value={bikeFilterPayload.search}
              onChange={(e) => setBikeFilterPayload((p) => ({ ...p, search: e.target.value }))}
              className="search-input"
            />

            <div className="filter-dropdown">
              <span className="filter-icon">🔋</span>
              <input
                type="number"
                placeholder="Max Battery %"
                value={bikeFilterPayload.battery}
                onChange={(e) => setBikeFilterPayload((p) => ({ ...p, battery: e.target.value }))}
                className="filter-input"
                min="0"
                max="100"
              />
            </div>

            <div className="filter-dropdown">
              <span className="filter-icon">☰</span>
              <select
                value={bikeFilterPayload.status}
                onChange={(e) => setBikeFilterPayload((p) => ({ ...p, status: e.target.value }))}
                className="filter-select"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bikes-table-container">
            <table className="bikes-table">
              <thead>
                <tr>
                  <th>Vin Number</th>
                  <th>Type</th>
                  <th>Current Battery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayBikeList.map((bike) => (
                  <tr
                    key={bike.id}
                    onClick={() => handleBikeClick(bike.id)}
                    className={bike.status === "Inused" ? "row-highlighted" : ""}
                  >
                    <td className="vin-cell">{bike.id}</td>
                    <td>{bike.name}</td>
                    <td>{bike.battery_status !== null ? `${bike.battery_status}%` : "N/A"}</td>
                    <td>
                      <span className="status-badge-table" style={getStatusStyle(bike.status as BikeStatus)}>
                        {getStatusLabel(bike.status as BikeStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button className="pagination-btn" onClick={() => goToPage(1)} disabled={currentPage === 1} title="First page">
              «
            </button>
            <button
              className="pagination-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous page"
            >
              ‹
            </button>

            <span className="pagination-info">
              Page{" "}
              <input
                type="text"
                defaultValue={String(currentPage)}
                onChange={(e) => (pageInputRef.current = e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const page = parseInt(pageInputRef.current, 10);
                  if (!isNaN(page)) goToPage(page);
                }}
                className="page-input"
                title="Enter page number and press Enter"
              />{" "}
              of {Number.isFinite(totalPages) ? totalPages : "?"}
            </span>

            <button
              className="pagination-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={Number.isFinite(totalPages) ? currentPage === totalPages : false}
              title="Next page"
            >
              ›
            </button>

            <button
              className="pagination-btn"
              onClick={() => Number.isFinite(totalPages) && goToPage(totalPages)}
              disabled={!Number.isFinite(totalPages) || currentPage === totalPages}
              title="Last page"
            >
              »
            </button>

            <span className="total-bikes">({bikeCount || 0} bikes)</span>
          </div>
        </div>
      </div>
    </div>
  );
}