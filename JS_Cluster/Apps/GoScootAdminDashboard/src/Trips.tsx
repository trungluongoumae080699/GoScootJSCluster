import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./Trips.css";

import type { Trip, TripStatus } from "@trungthao/admin_dashboard_dto";
import { tripApi } from "./services/apiClient";
import { RxMixerVertical } from "react-icons/rx";

const PAGE_SIZE = 10;

const bikeIDList = [
  "BIK-00Y5441D",
  "BIK-00ZRONBT",
  "BIK-01GL4BA3",
  "BIK-01NR0D1Q",
  "BIK-01WVFWRE",
  "BIK-026NQACW",
  "BIK-03VQ2B55",
  "BIK-03Y4597M",
  "BIK-047OJXJU",
  "BIK-04SO07Z4",
];

export default function Trips() {
  const navigate = useNavigate();

  // All trips cache (fetched from server)
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchValue, setSearchValue] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");

  // Fetch all trips from server (no filters - get everything)
  const fetchAllTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingProgress("Fetching trips...");

    try {
      let allTripsCombined: Trip[] = [];

      for (let i = 0; i < bikeIDList.length; i++) {   //Later replace the bike list with API call to get all bike IDs
        const bikeId = bikeIDList[i];

        // First request → get total pages
        const first = await tripApi.getTripsByBike(bikeId);

        let bikeTrips = [...first.trips];

        // If no more pages → continue to next bike
        if (first.totalPages > 1) {
          // Prepare pages 2..N
          const pages = Array.from(
            { length: first.totalPages - 1 },
            (_, i) => i + 2
          );

          // Fetch pages gradually (batch to avoid overload)
          const BATCH_SIZE = 5;
          for (let p = 0; p < pages.length; p += BATCH_SIZE) {
            const batch = pages.slice(p, p + BATCH_SIZE);

            const results = await Promise.all(
              batch.map((page) => tripApi.getTripsByBike(bikeId, page))
            );

            results.forEach((res) => {
              bikeTrips.push(...res.trips);
            });
          }
        }

        // Add trips from this bike to overall result
        allTripsCombined.push(...bikeTrips);
      }

      // Final set all trips (VERY IMPORTANT)
      setAllTrips(allTripsCombined);
      setLoadingProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trips");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch - only once
  useEffect(() => {
    fetchAllTrips();
  }, [fetchAllTrips]);

  // Client-side filtering (VIN, type, status, AND battery)
  const filteredTrips = useMemo(() => {
    return allTrips.filter((trip) => {
      // VIN search (case-insensitive partial match)
      if (searchValue) {
        const s = searchValue.toLowerCase();
        const tripMatch = trip.id.toLowerCase().includes(s);
        const bikeMatch = trip.bike_id.toLowerCase().includes(s);
        const customerMatch = trip.customer_id.toLowerCase().includes(s);

        if (!tripMatch && !bikeMatch && !customerMatch) return false;
      }
      if (startDateFilter) {
        const startTimestamp = new Date(startDateFilter).getTime();
        if (trip.trip_start_date! < startTimestamp) return false;
      }

      if (endDateFilter) {
        const endTimestamp = new Date(endDateFilter).getTime();
        if (trip.trip_end_date! > endTimestamp) return false;
      }
      return true;
    });
  }, [allTrips, searchValue, endDateFilter, startDateFilter]);

  // Calculate pagination
  const totalFilteredTrips = filteredTrips.length;
  const totalPages = Math.ceil(totalFilteredTrips / PAGE_SIZE) || 1;

  // Get current page trips
  const currentPageTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredTrips.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTrips, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const handleBikeClick = (tripId: string) => {
    navigate(`/trip/${tripId}`);
  };

  const getStatusStyle = (status: TripStatus) => {
    switch (status) {
      case "complete":
        return { background: "#d4edda", color: "#155724" };
      case "in progress":
        return { background: "#ffe4c4", color: "#856404" };
      case "cancelled":
        return { background: "#eb8585ff", color: "#f30a0aff" };
      default:
        return { background: "#e2e3e5", color: "#383d41" };
    }
  };

  const getStatusLabel = (status: TripStatus) => {
    switch (status) {
      case "complete":
        return "Completed";
      case "in progress":
        return "In Progress";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput("");
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput("");
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageInputSubmit(e);
    }
  };

  const handleCloseDateFilter = () => {
    setShowDateFilter(false);
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const formatDate = (milis?: number) => {
    if (!milis) return "N/A";
    const date = new Date(milis);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bike-details-container">
      <Header title="Trips" />
      <div className="main-content">
        <Sidebar />
        <div className="content-area trips-content">
          {/* Stats Section */}
          <div className="trips-stats">
            <p>Total: {totalFilteredTrips}</p>
            <p>Average duration: 30 minutes</p>
            <p>Total distances: 1000km</p>
          </div>

          {/* Filters Section */}
          <div className="trips-filters">
            <input
              type="text"
              placeholder="Search ID, VIN or CusID..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="search-input"
            />

            <div className="date-filter-wrapper">
              {/* Button that toggles date popup */}
              <button
                className="date-filter-button"
                onClick={() => setShowDateFilter(!showDateFilter)}
              >
                <RxMixerVertical /> Date
              </button>

              {/* Dropdown popup */}
              {showDateFilter && (
                <div className="date-filter-popup">
                  <div className="date-filter-row">
                    <span>From</span>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                    />
                  </div>

                  <div className="date-filter-row">
                    <span>To</span>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                    />
                  </div>

                  <button
                    className="close-popup-btn"
                    onClick={() => handleCloseDateFilter()}
                  >
                    Clear/Close
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Loading State */}
          {loading ? (
            <div className="loading">
              {loadingProgress || "Loading trips..."}
            </div>
          ) : (
            <>
              {/* Trips Table */}
              <div className="trips-table-container">
                <table className="trips-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Vin Number</th>
                      <th>Customer ID</th>
                      <th>Date Range</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageTrips.map((trip) => (
                      <tr
                        key={trip.id}
                        onClick={() => handleBikeClick(trip.id)}
                        className={
                          trip.trip_status === "in progress"
                            ? "row-highlighted"
                            : ""
                        }
                      >
                        <td className="vin-cell">{trip.id}</td>
                        <td>{trip.bike_id}</td>
                        <td>{trip.customer_id}</td>
                        <td>
                          {formatDate(trip.trip_start_date!)} -{" "}
                          {formatDate(trip.trip_end_date!)}
                        </td>
                        <td>
                          <span
                            className="status-badge-table"
                            style={getStatusStyle(
                              trip.trip_status.toLowerCase() as TripStatus
                            )}
                          >
                            {getStatusLabel(
                              trip.trip_status.toLowerCase() as TripStatus
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  title="First page"
                >
                  «
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  ‹
                </button>

                <span className="pagination-info">
                  Page{" "}
                  <input
                    type="text"
                    value={pageInput || currentPage}
                    onChange={handlePageInputChange}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={() => setPageInput("")}
                    className="page-input"
                    title="Enter page number and press Enter"
                  />{" "}
                  of {totalPages}
                </span>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="Next page"
                >
                  ›
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last page"
                >
                  »
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
