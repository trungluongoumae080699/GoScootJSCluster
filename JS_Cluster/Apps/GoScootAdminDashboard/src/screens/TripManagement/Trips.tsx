import { useNavigate } from "react-router-dom";
import { TripStatus } from "@trungthao/admin_dashboard_dto";
import { useGlobalContext, WebScreen } from "../../context/GlobalContext";
import { useEffect } from "react";
import { useTripListing } from "../../hooks/PageHooks/useTripListing";
import Pagination from "../../components/module/pagination";
import { dateToEndOfDay, dateToStartOfDay } from "../../utlities/methods";
import Input, { Option } from "../../components/module/Input";
import { formatDate } from "../../utlities/convert";
import { tripApi } from "../../services/ApiClient/TripApis";
import Loader from "../../components/module/LoadingModule";

import styles from "./Trips.module.css";
import { useTripManagementContext } from "../../context/TripManagementContext";

const TRIP_STATUS_OPTION: Option[] = [
  { value: "", label: "Tất Cả" },
  { value: TripStatus.PENDING, label: "Đang Chờ" },
  { value: TripStatus.IN_PROGRESS, label: "Đang Thực Hiện" },
  { value: TripStatus.COMPLETE, label: "Hoàn Thành" },
  { value: TripStatus.CANCELLED, label: "Huỷ" },
];

export default function Trips() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const tripManagementContext = useTripManagementContext();

  const {
    resetFilter,
    isLoading,
    displayList,
    totalCount,
    currentPage,
    totalPages,
    applyFilters,
    goToPage,
    filterPayload,
    setFilterPayload,
  } = useTripListing("", tripApi.getTrips);

  useEffect(() => {
    globalContext.setCurrentHeader("Bikes");
    globalContext.setCurrentPage(WebScreen.BIKES);
  }, []);

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

  return (
    <div className={styles["page-container"]}>
      {/* Filters */}
      <div className={styles["trips-filters"]}>
        <Input
          kind="input"
          type="text"
          value={filterPayload.search}
          placeHolder="Tìm Kiếm"
          label="Tìm Kiếm"
          onChange={(e) =>
            setFilterPayload((p) => ({ ...p, search: e.target.value }))
          }
        />

        <Input
          kind="input"
          type="text"
          value={filterPayload.bikeId}
          placeHolder="Nhập xe bạn muốn tìm"
          label="Mã Xe"
          onChange={(e) =>
            setFilterPayload((p) => ({ ...p, bikeId: e.target.value }))
          }
        />

        <Input
          kind="input"
          type="date"
          label="Tìm Đến Ngày"
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

        <Input
          kind="input"
          type="date"
          label="Tìm Từ Ngày"
          value={
            filterPayload.to === ""
              ? new Date().toISOString().slice(0, 10)
              : new Date(filterPayload.to).toISOString().slice(0, 10)
          }
          onChange={(e) =>
            setFilterPayload((p) => ({
              ...p,
              to: String(dateToEndOfDay(e.target.value)),
            }))
          }
        />

        <Input
          kind="select"
          value={filterPayload.status}
          placeHolder="Chọn trạng thái"
          options={TRIP_STATUS_OPTION}
          label="Trạng Thái"
          onChange={(e) =>
            setFilterPayload((p) => ({ ...p, status: e.target.value }))
          }
        />

        <button
          className={`${styles["btn"]} ${styles["apply-btn"]}`}
          onClick={applyFilters}
          disabled={isLoading}
        >
          Apply
        </button>

        <button
          className={`${styles["btn"]} ${styles["clear-btn"]}`}
          onClick={resetFilter}
          disabled={isLoading}
        >
          Clear
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            totalItems={totalCount}
            goToPage={goToPage}
          />

          <div className={styles["trips-table-container"]}>
            <table className={styles["trips-table"]}>
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
                {displayList.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => {
                      tripManagementContext.setCurrentTrip(trip)
                      navigate("/trip")
                    }}
                    className={
                      trip.trip_status === "in progress"
                        ? styles["row-highlighted"]
                        : undefined
                    }
                  >
                    <td className={styles["vin-cell"]}>{trip.id}</td>
                    <td>{trip.bike_id}</td>
                    <td>{trip.customer_id}</td>
                    <td>
                      {formatDate(trip.trip_start_date!)} –{" "}
                      {formatDate(trip.trip_end_date!)}
                    </td>
                    <td>
                      <span
                        className={styles["status-badge-table"]}
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

          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            totalItems={totalCount}
            goToPage={goToPage}
          />
        </>
      )}
    </div>
  );
}