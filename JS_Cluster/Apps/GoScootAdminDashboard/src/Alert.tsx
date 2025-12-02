import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./Alert.css";
import AlertCard from "./components/alert/AlertCard";
import { RxMixerVertical } from "react-icons/rx";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { alertApi } from "./services/apiClient";
import { useEffect, useMemo, useState } from "react";

// Mock alert data
const alertDatas = {
  alerts: [
    {
      id: "11560696d0be",
      bike_id: "BIK-ZCVP3SYJ",
      content: "Xe BIK-ZCVP3SYJ đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.29965204657522,
      latitude: 10.825804273769128,
      time: 1764467323179,
    },
    {
      id: "a26bc8967675",
      bike_id: "BIK-J02WNLRS",
      content: "Xe BIK-J02WNLRS đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.6200579164958,
      latitude: 10.499911226528637,
      time: 1764467288175,
    },
    {
      id: "2fb9a63afb36",
      bike_id: "BIK-7PLPUKGK",
      content: "Xe BIK-7PLPUKGK đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 107.10031083328936,
      latitude: 10.800659145508511,
      time: 1764467266202,
    },
    {
      id: "1e763748b224",
      bike_id: "BIK-U54O0UFE",
      content: "Xe BIK-U54O0UFE đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.63438976296985,
      latitude: 10.499569985771876,
      time: 1764467266200,
    },
    {
      id: "f7b228f01046",
      bike_id: "BIK-6CDS2OD4",
      content: "Xe BIK-6CDS2OD4 đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.60522635686858,
      latitude: 10.499673010314206,
      time: 1764467248181,
    },
    {
      id: "46f84d7dc829",
      bike_id: "BIK-YV5H28KN",
      content: "Xe BIK-YV5H28KN đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.83530462302788,
      latitude: 11.10014013729373,
      time: 1764467248178,
    },
    {
      id: "e3615eb7cea1",
      bike_id: "BIK-L11WGOVG",
      content: "Xe BIK-L11WGOVG đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.71953353903274,
      latitude: 10.499847797590531,
      time: 1764467246173,
    },
    {
      id: "b021608903a4",
      bike_id: "BIK-TZN9R53X",
      content: "Xe BIK-TZN9R53X đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.6514000491958,
      latitude: 10.49984789760691,
      time: 1764467226202,
    },
    {
      id: "74ec43613590",
      bike_id: "BIK-X936C065",
      content: "Xe BIK-X936C065 đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 107.10013022646052,
      latitude: 10.835623543052131,
      time: 1764467186178,
    },
    {
      id: "a6e1b80bc714",
      bike_id: "BIK-PGBZD414",
      content: "Xe BIK-PGBZD414 đã đi qua phạm vi khu vực cho phép",
      type: "boundary_cross",
      longitude: 106.706196865477,
      latitude: 11.100173242508532,
      time: 1759294800000,
    },
  ],
  page: 1,
  pageSize: 10,
  total: 89752,
  totalPages: 8976,
};

// Main Alerts Page
export default function Alerts() {
  const [loading, setLoading] = useState(false);
  const [filteredAlerts, setFilteredAlerts] = useState<any>(alertDatas.alerts); // Replarce '[]' when integrating API
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

  useEffect(() => {
    const fetchAlertData = async () => {
      try {
        setLoading(true);

        const alertData = await alertApi.getAllAlerts();

        setFilteredAlerts(alertData.alerts);
        console.log("Fetched alert data:", alertData);
      } catch (err) {
        console.error("Failed to fetch alert data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertData();
  }, [setFilteredAlerts]);

  // "asc" | "desc"

  const handleFilter = () => {
    let filtered = [...alertDatas.alerts];

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
    setFilteredAlerts(alertDatas.alerts);
    setStartDate("");
    setEndDate("");
    setSearchBikeId("");
    setSortOrder("");
    setCurrentPage(1);
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
                All Alert : {alertDatas.alerts.length}
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
