import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./Alert.css";
import AlertCard from "./components/alert/AlertCard";
import { RxMixerVertical } from "react-icons/rx";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { alertApi } from "./services/apiClient";
import { useEffect, useMemo, useState } from "react";

// Main Alerts Page
export default function Alerts() {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any>([]); 
  const [showFilter, setshowFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchBikeId, setSearchBikeId] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  const totalPages = Math.ceil(filteredAlerts.length / pageSize);

  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    return filteredAlerts.slice(start, end);
  }, [filteredAlerts, currentPage]);

  const fetchAlertData = async () => {
    try {
      setLoading(true);

      const alertData = await alertApi.getAllAlerts();

      setAlerts(alertData.alerts);
      setFilteredAlerts(alertData.alerts);
      console.log("Fetched alert data:", alertData);
    } catch (err) {
      console.error("Failed to fetch alert data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertData();
  }, []);

  // "asc" | "desc"

  const handleFilter = () => {
    let filtered = [...filteredAlerts];

    // --- DATE FILTER ---
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((alert) => {
        const alertTime = new Date(alert.time);
        return alertTime >= start && alertTime <= end; // FIXED (AND not OR)
      });
    }

    // --- SEARCH BY BIKE ID ---
    if (searchBikeId.trim() !== "") {
      filtered = filtered.filter((alert) =>
        alert.bike_id.toLowerCase().includes(searchBikeId.toLowerCase())
      );
    }

    // --- SORTING ---
    if (sortOrder === "asc") {
      filtered.sort((a, b) => a.time - b.time);
    } else if (sortOrder === "desc") {
      filtered.sort((a, b) => b.time - a.time);
    }

    setFilteredAlerts(filtered);
    setCurrentPage(1);
    setshowFilter(false);
  };

  const clearFilter = () => {
    setshowFilter(false);
    setStartDate("");
    setEndDate("");
    setSearchBikeId("");
    setSortOrder("");
    setCurrentPage(1);
    setFilteredAlerts(alerts);
  };

  return (
    <div className="layout">
      <Header title="Alerts" />

      <div className="content">
        <Sidebar />
        {loading ? (
          <p className="loading">Loading alerts...</p>
        ) : (
          <div className="alerts-wrapper">
            {/* Filter Buttons */}
            <div className="filter-row">
              <button className="filter-btn">
                All Alert : {alerts.length}
              </button>
              <button className="filter-btn">Collision & Crash Alert: 3</button>
              <button className="filter-btn">Out-of-Zone Bikes: 2</button>
            </div>

            {/* Action Buttons */}
            <div className="action-row" style={{ position: "relative" }}>
              <button
                className="date-filter-btn"
                onClick={() => setshowFilter(!showFilter)}
              >
                <RxMixerVertical />
                Filter
              </button>

              {/* Popup Fliter */}
              {showFilter && (
                <div className="date-popup">
                  {/* --- ROW 1: SEARCH + SORT --- */}
                  <div className="filter-row-1">
                    <div className="filter-group">
                      <label style={{ fontWeight: "bold" }}>Search Bike:</label>
                      <input
                        type="text"
                        placeholder="Search by bike ID..."
                        value={searchBikeId}
                        onChange={(e) => setSearchBikeId(e.target.value)}
                      />
                    </div>

                    <div className="filter-group">
                      <label style={{ fontWeight: "bold" }}>Sort By:</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                      >
                        <option value="">None</option>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                  </div>

                  {/* --- ROW 2: DATE RANGE --- */}
                  <label style={{ fontWeight: "bold" }}>
                    Filter by Date Range:
                  </label>
                  <div className="filter-row-2">
                    <div className="filter-group">
                      <label>From:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="filter-group">
                      <label>To:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="filter-actions">
                    <button className="apply-btn" onClick={handleFilter}>
                      Apply
                    </button>
                    <button className="clear-btn" onClick={clearFilter}>
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <button className="btn-ack">Acknowledge All</button>
              <button className="btn-dismiss">Dismiss All</button>
            </div>

            {/* Alert List */}
            {paginatedAlerts.map((alert: any) => (
              <AlertCard
                key={alert.id}
                title={alert.bike_id}
                description={alert.content}
                onAcknowledge={() => console.log("Acknowledge", alert.id)}
                onDismiss={() => console.log("Dismiss", alert.id)}
              />
            ))}
            {/* Pagination */}
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <FaArrowLeft />
              </button>

              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    className={`page-number ${
                      page === currentPage ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <FaArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
