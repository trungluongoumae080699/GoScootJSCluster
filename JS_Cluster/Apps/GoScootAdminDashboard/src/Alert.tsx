import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./Alert.css";
import AlertCard from "./components/alert/AlertCard";
import { RxMixerVertical } from "react-icons/rx";
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { alertApi } from "./services/apiClient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMqttClient } from "./hooks/useMqttClient";
import { decodeAlertBinary } from "./utlities/BindaryDecoder";

// Main Alerts Page
export default function Alerts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any>([]);
  const [showFilter, setshowFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchBikeId, setSearchBikeId] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(filteredAlerts.length / pageSize);

  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    return filteredAlerts.slice(start, end);
  }, [filteredAlerts, currentPage]);

  const client = useMqttClient(
    "0dbd0886-f5c9-4916-8f0b-ef7195158503", 
    "SGGvuz8O5ZaMBQ2EPbhS2A==");

  useEffect(() => {
    console.log("Subscribing to topic")
    if (!client) {
      console.log("Subscription failed")
      return
    }

    const topic = `alerts/+`;

    client.subscribe(topic, (err) => {
      if (err) console.error("Failed to subscribe:", err);
      else console.log("Successfully subscribed to:", topic);
    });

    const handleMessage = (topic: string, payload: any) => {
      const alert = decodeAlertBinary(new Uint8Array(payload));
      console.log("Alert:", alert);
    };
    
    client.on("message", handleMessage);

    // cleanup when component unmounts OR bikeId changes
    return () => {
      client.off("message", handleMessage);
      client.unsubscribe(topic);
    };
  }, [client]);

  const fetchAllAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // First fetch to get total pages
      const firstResponse = await alertApi.getAllAlerts(1);

      if (firstResponse.totalPages <= 1) {
        setAlerts(firstResponse.alerts);
        return;
      }

      // Fetch all remaining pages in parallel batches
      let allAlertsData = [...firstResponse.alerts];
      const maxPages = 100;
      const remainingPages = Array.from(
        { length: maxPages - 1 },
        (_, i) => i + 2
      );

      // Fetch in batches of 5 for better performance
      const BATCH_SIZE = 5;
      for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
        const batch = remainingPages.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(
          batch.map((page) => alertApi.getAllAlerts(page))
        );

        results.forEach((res) => {
          allAlertsData = [...allAlertsData, ...res.alerts];
        });
      }

      setAlerts(allAlertsData);
      setFilteredAlerts(allAlertsData);
    } catch (err) {
      console.log(
        err instanceof Error ? err.message : "Failed to fetch alerts"
      );
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAlerts();
  }, [fetchAllAlerts]);

  // "asc" | "desc"

  const handleFilter = () => {
    let filtered = [...alerts];

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

  const getVisiblePages = () => {
    const maxSide = 2;
    const pages = [];

    if (totalPages <= 10) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    let start = Math.max(2, currentPage - maxSide);
    let end = Math.min(totalPages - 1, currentPage + maxSide);

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");

    pages.push(totalPages);
    return pages;
  };

  if (loading) {
    return (
      <div className="bike-details-container">
        <Header title="Alerts" />
        <div className="main-content">
          <Sidebar />
          <div
            className="content-area"
            style={{ padding: "20px", textAlign: "center" }}
          >
            <p>Loading alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bike-details-container">
        <Header title="Alerts" />
        <div className="main-content">
          <Sidebar />
          <div className="content-area" style={{ padding: "20px" }}>
            <div
              className="error-message"
              style={{
                color: "red",
                padding: "20px",
                background: "#fee",
                borderRadius: "8px",
              }}
            >
              <h3>Error Loading Alert Data</h3>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{ marginTop: "10px", padding: "8px 16px" }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {/* Go to First Page */}
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <MdKeyboardDoubleArrowLeft />
              </button>
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <MdKeyboardArrowLeft />
              </button>

              {/* Page Numbers */}
              {getVisiblePages().map((page, index) => {
                if (page === "...") {
                  return (
                    <span key={`dots-${index}`} className="dots">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={`page-${page}-${index}`}
                    className={`page-number ${
                      page === currentPage ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page as number)}
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
                <MdKeyboardArrowRight />
              </button>
              {/* Go to Last Page */}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                <MdKeyboardDoubleArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
