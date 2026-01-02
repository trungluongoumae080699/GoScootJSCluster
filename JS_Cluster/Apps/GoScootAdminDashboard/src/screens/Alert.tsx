
import "./Alert.css";
import AlertCard from "../components/alert/AlertCard";
//import { alertApi } from "../services/ApiClient/apiClient";
import { useNotifications } from "../context/NotificationContext";
import Pagination from "../components/module/pagination";
import { useAlertListing } from "../hooks/PageHooks/useAlertListing";
import { alertApi } from "../services/ApiClient/AlertApis";
import { dateToEndOfDay, dateToStartOfDay } from "../utlities/methods";
import { useEffect } from "react";
import { useGlobalContext, WebScreen } from "../context/GlobalContext";
import Input, { Option } from "../components/module/Input";
import { AlertType } from "../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

const ALERT_TYPE_OPTIONS: Option[] = [
    { value: "", label: "All Status" },
    { value: AlertType.BOUNDARY_CROSS, label: "Boudary Cross" },
    { value: AlertType.LOW_BATTERY, label: "Low Batter" },
    { value: AlertType.TOPPLE, label: "Topple" },
    { value: AlertType.CRASH, label: "Crash" }
];

// Main Alerts Page
export default function Alerts() {
    const { addNotification } = useNotifications();
    const globalContext = useGlobalContext()

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

    useEffect(() => {
        globalContext.setCurrentPage(WebScreen.ALERT)
        globalContext.setCurrentHeader("Alerts")
    })

    return (
        <div className="page-container">
            {
                isLoading ? <p className="loading">Loading alerts...</p> : <div className="alerts-wrapper">
                    {/* Filter Buttons */}
                    <div className="alerts-filters">
                        <Input
                            kind="input"
                            type={"text"}
                            value={filterPayload.search}
                            placeHolder="Nhập xe bạn muốn tìm"
                            label={"Tìm Kiếm"}
                            onChange={
                                (e) => setFilterPayload((p) => ({ ...p, search: e.target.value }))
                            }
                        >
                        </Input>

                        <Input
                            kind="input"
                            type={"date"}
                            placeHolder="Tìm từ ngày"
                            label={"Tìm Đến Ngày"}
                            value={
                                filterPayload.from === ""
                                    ? new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
                                        .toISOString()
                                        .slice(0, 10)
                                    : new Date(Number(filterPayload.from)).toISOString().slice(0, 10)
                            }
                            onChange={(e) =>
                                setFilterPayload((p) => ({
                                    ...p,
                                    from: String(dateToStartOfDay(e.target.value)),
                                }))
                            }
                        >

                        </Input>

                        <Input
                            kind="input"
                            type={"date"}
                            placeHolder="Tìm đến ngày"
                            label={"Tìm Từ Ngày"}
                            value={
                                filterPayload.to === "" ? new Date().toISOString().slice(0, 10)
                                    : new Date(Number(filterPayload.to)).toISOString().slice(0, 10)
                            }
                            onChange={(e) =>
                                setFilterPayload((p) => ({
                                    ...p,
                                    to: String(dateToEndOfDay(e.target.value)),
                                }))
                            }
                        >

                        </Input>


                        <Input
                            kind="select"
                            value={filterPayload.type}
                            placeHolder="Chọn loại cảnh báo"
                            options={ALERT_TYPE_OPTIONS}
                            label={"Loại Cảnh Báo"}
                            onChange={
                                (e) => setFilterPayload((p) => ({ ...p, type: e.target.value }))
                            }
                        >
                        </Input>

                        <button
                            className="btn apply-btn"
                            onClick={applyFilters}
                            disabled={isLoading}
                            title="Apply filters & fetch group 0">
                            Apply
                        </button>

                        <button
                            className="btn clear-btn"
                            onClick={applyFilters}
                            disabled={isLoading}
                            title="Apply filters & fetch group 0">
                            Clear
                        </button>

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

                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalCount}
                        goToPage={goToPage}>
                    </Pagination>


                </div>
            }

        </div>
    );
}
