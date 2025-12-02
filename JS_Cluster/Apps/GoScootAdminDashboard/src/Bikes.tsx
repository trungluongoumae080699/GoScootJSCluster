import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./Bikes.css";

import type { Bike, BikeStatus } from "@trungthao/admin_dashboard_dto";
import { bikeApi } from "./services/apiClient";

// Available bike types (can be expanded based on your data)
const BIKE_TYPES = ["VINFAST EVO200", "VINFAST KLARA", "VINFAST VENTO"];

// Status options for filtering
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "Idle", label: "Available" },
  { value: "Inuse", label: "Being Rent" },
  { value: "Reserved", label: "Reserved" },
];

const PAGE_SIZE = 10;

export default function Bikes() {
  const navigate = useNavigate();
  
  // All bikes cache (fetched from server)
  const [allBikes, setAllBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchVin, setSearchVin] = useState("");
  const [batteryFilter, setBatteryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");

  // Fetch all bikes from server (no filters - get everything)
  const fetchAllBikes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress("Fetching bikes...");

      // First fetch to get total pages
      const firstResponse = await bikeApi.getBikes({ page: 1 });

      if (firstResponse.totalPages <= 1) {
        setAllBikes(firstResponse.bikes);
        setLoadingProgress("");
        return;
      }

      // Fetch all remaining pages in parallel batches
      let allBikesData = [...firstResponse.bikes];
      const totalPages = firstResponse.totalPages;
      const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

      // Fetch in batches of 5 for better performance
      const BATCH_SIZE = 5;
      for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
        const batch = remainingPages.slice(i, i + BATCH_SIZE);
        const progress = Math.round(((i + batch.length + 1) / totalPages) * 100);
        setLoadingProgress(`Loading bikes... ${progress}%`);

        const results = await Promise.all(
          batch.map((page) => bikeApi.getBikes({ page }))
        );

        results.forEach((res) => {
          allBikesData = [...allBikesData, ...res.bikes];
        });
      }

      setAllBikes(allBikesData);
      setLoadingProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bikes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch - only once
  useEffect(() => {
    fetchAllBikes();
  }, [fetchAllBikes]);

  // Client-side filtering (VIN, type, status, AND battery)
  const filteredBikes = useMemo(() => {
    return allBikes.filter((bike) => {
      // VIN search (case-insensitive partial match)
      if (searchVin && !bike.id.toLowerCase().includes(searchVin.toLowerCase())) {
        return false;
      }
      // Type filter
      if (typeFilter && bike.name !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter && bike.status !== statusFilter) {
        return false;
      }
      // Battery filter (max battery percentage)
      if (batteryFilter) {
        const maxBattery = Number(batteryFilter);
        const bikeBattery = bike.battery_status ?? null;
        if (!isNaN(maxBattery) && bikeBattery !== null && bikeBattery > maxBattery) {
          return false;
        }
      }
      return true;
    });
  }, [allBikes, searchVin, typeFilter, statusFilter, batteryFilter]);

  // Calculate pagination
  const totalFilteredBikes = filteredBikes.length;
  const totalPages = Math.ceil(totalFilteredBikes / PAGE_SIZE) || 1;

  // Get current page bikes
  const currentPageBikes = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredBikes.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredBikes, currentPage]);

  // Count available bikes
  const availableCount = useMemo(() => {
    return filteredBikes.filter((bike) => bike.status === "Idle").length;
  }, [filteredBikes]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchVin, typeFilter, statusFilter]);

  const handleBikeClick = (bikeId: string) => {
    navigate(`/bike/${bikeId}`);
  };

  const getStatusStyle = (status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return { background: "#d4edda", color: "#155724" };
      case "Inuse":
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
      case "Inuse":
        return "Being Rent";
      case "Reserved":
        return "Reserved";
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

  return (
    <div className="bike-details-container">
      <Header title="Bikes" />
      <div className="main-content">
        <Sidebar />
        <div className="content-area bikes-content">
          {/* Stats Section */}
          <div className="bikes-stats">
            <p>Total: {totalFilteredBikes}</p>
            <p>Available: {availableCount}</p>
          </div>

          {/* Filters Section */}
          <div className="bikes-filters">
            <input
              type="text"
              placeholder="Search Bike's VIN"
              value={searchVin}
              onChange={(e) => setSearchVin(e.target.value)}
              className="search-input"
            />
            
            {/* Type Filter */}
            <div className="filter-dropdown">
              <span className="filter-icon">☰</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                {BIKE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Battery Filter */}
            <div className="filter-dropdown">
              <span className="filter-icon">🔋</span>
              <input
                type="number"
                placeholder="Max Battery %"
                value={batteryFilter}
                onChange={(e) => setBatteryFilter(e.target.value)}
                className="filter-input"
                min="0"
                max="100"
              />
            </div>

            {/* Status Filter */}
            <div className="filter-dropdown">
              <span className="filter-icon">☰</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Loading State */}
          {loading ? (
            <div className="loading">{loadingProgress || "Loading bikes..."}</div>
          ) : (
            <>
              {/* Bikes Table */}
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
                    {currentPageBikes.map((bike) => (
                      <tr
                        key={bike.id}
                        onClick={() => handleBikeClick(bike.id)}
                        className={bike.status === "Inuse" ? "row-highlighted" : ""}
                      >
                        <td className="vin-cell">{bike.id}</td>
                        <td>{bike.name}</td>
                        <td>{bike.battery_status !== null ? `${bike.battery_status}%` : "N/A"}</td>
                        <td>
                          <span
                            className="status-badge-table"
                            style={getStatusStyle(bike.status)}
                          >
                            {getStatusLabel(bike.status)}
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
                
                <span className="total-bikes">({totalFilteredBikes} bikes)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}