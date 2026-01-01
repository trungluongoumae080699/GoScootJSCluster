
import Header from "../components/Header";
import "./Alert.css";
import AlertCard from "../components/alert/AlertCard";
//import { alertApi } from "../services/ApiClient/apiClient";
import { useNotifications } from "../context/NotificationContext";
import Pagination from "../components/module/pagination";
import { useAlertListing } from "../hooks/useAlertListing";
import { alertApi } from "../services/ApiClient/AlertApis";
import { dateToEndOfDay, dateToStartOfDay } from "../utlities/methods";

// Main Alerts Page
export default function Alerts() {
    const { addNotification } = useNotifications();
    const {
        // state
        isLoading,
        displayList,
        totalCount,
        currentPage,
        // actions
        applyFilters, // use snapshot version
        resetFilter,
        goToPage,
        // filters
        filterPayload,
        setFilterPayload,
    } = useAlertListing(alertApi.getAlerts);

    return (
        <div className="layout">
            <Header title="Alerts" />
            <div className="content">
                {/*                 <Sidebar /> */}
                {isLoading ? (
                    <p className="loading">Loading alerts...</p>
                ) : (
                    <div className="alerts-wrapper">
                        {/* Filter Buttons */}
                        <div className="filter-row">
                            <button className="filter-btn">
                                All Alert : {displayList.length}
                            </button>
                            <button className="filter-btn">Collision & Crash Alert: 3</button>
                            <button className="filter-btn">Out-of-Zone Bikes: 2</button>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-row" style={{ position: "relative" }}>
                            <div className="date-popup">
                                {/* --- ROW 1: SEARCH + SORT --- */}
                                <div className="filter-row-1">
                                    <div className="filter-group">
                                        <label style={{ fontWeight: "bold" }}>Search Bike:</label>
                                        <input
                                            type="text"
                                            placeholder="Search by bike ID..."
                                            value={filterPayload.search}
                                            onChange={(e) => setFilterPayload((p) => ({ ...p, search: e.target.value }))}
                                        />
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
                                            value={
                                                filterPayload.from === ""
                                                    ? new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
                                                        .toISOString()
                                                        .slice(0, 10)
                                                    : new Date(filterPayload.from).toISOString().slice(0, 10)
                                            }
                                            onChange={(e) =>
                                                setFilterPayload((p) => ({
                                                    ...p,
                                                    from: String(dateToStartOfDay(e.target.value)),
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="filter-group">
                                        <label>To:</label>
                                        <input
                                            type="date"
                                            value={
                                                filterPayload.to === "" ? new Date().toISOString().slice(0, 10)
                                                    : new Date(filterPayload.to).toISOString().slice(0, 10)
                                            }
                                            onChange={(e) =>
                                                setFilterPayload((p) => ({
                                                    ...p,
                                                    to: String(dateToEndOfDay(e.target.value)),
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="filter-actions">
                                    <button className="apply-btn" onClick={applyFilters}>
                                        Apply
                                    </button>
                                    <button className="clear-btn" onClick={() => { }}>
                                        Clear
                                    </button>
                                </div>
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalItems={totalCount}
                                goToPage={goToPage}></Pagination>
                        </div>

                        {/* Alert List */}
                        {displayList.map((alert: any) => (
                            <AlertCard
                                key={alert.id}
                                title={alert.bike_id}
                                description={alert.content}
                                onAcknowledge={() => console.log("Acknowledge", alert.id)}
                                onDismiss={() => console.log("Dismiss", alert.id)}
                            />
                        ))}
                        {/* Pagination */}

                    </div>
                )}
            </div>
        </div>
    );
}
