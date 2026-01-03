import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BikeStatus } from "@trungthao/admin_dashboard_dto";
import { useGlobalContext, WebScreen } from "../../context/GlobalContext";
import Pagination from "../../components/module/pagination";
import { useBikeListing } from "../../hooks/PageHooks/useBikeListing";
import { bikeApi } from "../../services/ApiClient/BikeApis";
import Input, { Option } from "../../components/module/Input";
import { useBikeManagementContext } from "../../context/BikeManagementContext";
import Loader from "../../components/module/LoadingModule";

import styles from "./Bikes.module.css";
import Battery from "../../components/module/Battery";

const STATUS_OPTIONS: Option[] = [
  { value: "", label: "All Status" },
  { value: BikeStatus.IDLE, label: "Available" },
  { value: BikeStatus.INUSED, label: "Inused" },
  { value: BikeStatus.RESERVED, label: "Reserved" },
];

export default function Bikes() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const bikeManagementContext = useBikeManagementContext();

  useEffect(() => {
    globalContext.setCurrentHeader("Bikes");
    globalContext.setCurrentPage(WebScreen.BIKES);
  }, []);

  const {
    resetFilter,
    isLoading,
    displayList,
    totalCount,
    currentPage,
    applyFilters,
    totalPages,
    goToPage,
    filterPayload,
    setFilterPayload,
  } = useBikeListing(bikeApi.getBikes);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const WarningBang = ({ on }: { on: boolean }) =>
    on ? (
      <span
        className={[styles["warning-bang"], styles["warning-danger"], styles["warning-bang--blink"]].join(
          " "
        )}
        aria-label="warning"
        title="Warning"
      >
        !
      </span>
    ) : (
      <span
        className={[styles["warning-bang"], styles["warning-ok"]].join(
          " "
        )}
        aria-label="warning"
        title="Warning"
      >
        ✓
      </span>
    );

  return (
    <div className={styles["page-container"]}>
      <div className={styles["bikes-filters"]}>
        <Input
          kind="input"
          type="text"
          value={filterPayload.search}
          placeHolder="Nhập xe bạn muốn tìm"
          label="Tìm Kiếm"
          onChange={(e) =>
            setFilterPayload((p) => ({ ...p, search: e.target.value }))
          }
        />

        <Input
          kind="input"
          type="text"
          value={filterPayload.battery}
          placeHolder="Nhập lượng pin"
          label="Dung Lượng Pin"
          onChange={(e) =>
            setFilterPayload((p) => ({ ...p, battery: e.target.value }))
          }
        />

        <Input
          kind="select"
          value={filterPayload.status}
          placeHolder="Chọn trạng thái"
          options={STATUS_OPTIONS}
          label="Trạng Thái Hoạt Động"
          onChange={(e) =>
            setFilterPayload((p) => ({ ...p, status: e.target.value }))
          }
        />

        <button
          className={`${styles["btn"]} ${styles["apply-btn"]}`}
          onClick={applyFilters}
          disabled={isLoading}
          title="Apply filters & fetch group 0"
        >
          Apply
        </button>

        <button
          className={`${styles["btn"]} ${styles["clear-btn"]}`}
          onClick={resetFilter}
          disabled={isLoading}
          title="Apply filters & fetch group 0"
        >
          Clear
        </button>
      </div>

      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        totalItems={totalCount}
        goToPage={goToPage}
      />

      {isLoading ? (
        <div style={{
          width: "100%",
          height: "500px"
        }}>
          <Loader />
        </div>

      ) : (
        <div className={styles["bikes-table-container"]}>
          <table className={styles["bikes-table"]}>
            <thead>
              <tr>
                <th>Số VIN</th>
                <th>Loại Xe</th>
                <th>Dung Lượng Pin</th>
                <th>Trạng Thái</th>
                <th>Cảnh Báo Pin</th>
                <th>Cảnh Báo Trộm</th>
                <th>Cảnh Báo Va Chạm</th>
              </tr>
            </thead>

            <tbody>
              {displayList.map((bike) => {
                const batteryWarningIsOn = bike.batteryIsLow
                const robberyWarningIsOn = bike.isToppled
                const crashWarningIsOn = bike.isCrashed
                const bikeIsOffline = !bike.battery_status || !bike.latitude || !bike.latitude
                const bikeIsOutOfBound = bike.isOutOfBound

                return (
                  <tr
                    key={bike.id}
                    onClick={() => {
                      bikeManagementContext.setCurrentBike(bike);
                      navigate("/bike");
                    }}
                    className={[
                      bike.status === "Inused" ? styles["row-highlighted"] : "",
                      bikeIsOffline ? styles["row-offline"] : "",
                      bikeIsOutOfBound ? styles["row-out-of-bound"] : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <td className={styles["vin-cell"]}>{bike.id}</td>
                    <td>{bike.name}</td>

                    <td>
                      {bike.battery_status ? (
                        <Battery
                          level={bike.battery_status}
                          size="xs"
                          orientation="horizontal"
                          showText={true}
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td>
                      <span
                        className={styles["status-badge-table"]}
                        style={getStatusStyle(bike.status as BikeStatus)}
                      >
                        {getStatusLabel(bike.status as BikeStatus)}
                      </span>
                    </td>

                    {/* ✅ CẢNH BÁO */}
                    <td className={styles["warning-cell"]}>
                      <WarningBang on={batteryWarningIsOn} />
                    </td>

                    <td className={styles["warning-cell"]}>
                      <WarningBang on={robberyWarningIsOn} />
                    </td>

                    <td className={styles["warning-cell"]}>
                      <WarningBang on={crashWarningIsOn} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        totalItems={totalCount}
        goToPage={goToPage}
      />
    </div>
  );
}