import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BikeStatus, BikeTelemetry } from "@trungthao/admin_dashboard_dto";
import { useGlobalContext, WebScreen } from "../../context/GlobalContext";
import Pagination from "../../components/module/pagination";
import { useBikeListing } from "../../hooks/PageHooks/useBikeListing";
import { bikeApi } from "../../services/ApiClient/BikeApis";
import Input, { Option } from "../../components/module/Input";
import { useBikeManagementContext } from "../../context/BikeManagementContext";
import Loader from "../../components/module/LoadingModule";

import styles from "./Bikes.module.css";
import Battery from "../../components/module/Battery";
import { websocketManager } from "../../services/websocketService";
import { getStatusStyle, getStatusText } from "../../utlities/methods";

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
    globalContext.setCurrentHeader("Danh Sách Xe");
    globalContext.setCurrentPage(WebScreen.BIKES);
  }, []);

  const {
    resetFilter,
    isLoading,
    displayList,
    setDisplayList,
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
  }, []);


  useEffect(() => {
    if (!displayList || displayList.length === 0) return;

    const bikeIds = displayList.map((b) => b.id);

    const fire = () => {
      if (websocketManager.isConnected()) {
        websocketManager.requestBikeTelemetry(bikeIds);
      }
    };

    fire();

    const timer = window.setInterval(fire, 10_000);
    return () => window.clearInterval(timer);
  }, [displayList]);

  useEffect(() => {
  websocketManager.setOnBikeTelemetry((t: BikeTelemetry) => {
    // chỉ update nếu bike đang nằm trong displayList hiện tại
    setDisplayList((prev) => {
      const idx = prev.findIndex((b) => b.id === t.bike_id);
      if (idx === -1) return prev;

      const old = prev[idx];

      // build updated bike (patch live fields)
      const updated = {
        ...old,
        battery_status: t.battery,
        batteryIsLow: t.batteryIsLow,

        latitude: t.latitude,
        longitude: t.longitude,

        isToppled: t.isToppled,
        isCrashed: t.isCrashed,
        isOutOfBound: t.isOutOfBound,

        status: t.usageStatus, // BikeStatus
      };

      // (optional) tránh rerender nếu không đổi gì đáng kể
      const noChange =
        old.battery_status === updated.battery_status &&
        old.batteryIsLow === updated.batteryIsLow &&
        old.latitude === updated.latitude &&
        old.longitude === updated.longitude &&
        old.isToppled === updated.isToppled &&
        old.isCrashed === updated.isCrashed &&
        old.isOutOfBound === updated.isOutOfBound &&
        old.status === updated.status;

      if (noChange) return prev;

      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
  });

  return () => {
    websocketManager.setOnBikeTelemetry(null);
  };
}, [setDisplayList]);




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

                function getStatusLabel(arg0: BikeStatus): import("react").ReactNode {
                  throw new Error("Function not implemented.");
                }

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
                        <div className={styles.batteryContainer}>
                        <Battery
                          level={bike.battery_status}
                          size="xs"
                          orientation="horizontal"
                          showText={true}
                        />
                        </div>

                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td>
                      <span
                        className={styles["status-badge-table"]}
                        style={getStatusStyle(bike.status as BikeStatus)}
                      >
                        {getStatusText(bike.status as BikeStatus)}
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