import AlertCard from "../components/alert/AlertCard";
import { useNotifications } from "../context/NotificationContext";
import Pagination from "../components/module/pagination";
import { useAlertListing } from "../hooks/PageHooks/useAlertListing";
import { alertApi } from "../services/ApiClient/AlertApis";
import { dateToEndOfDay, dateToStartOfDay } from "../utlities/methods";
import { useEffect, useRef, useState } from "react";
import { useGlobalContext, WebScreen } from "../context/GlobalContext";
import Input, { Option } from "../components/module/Input";
import { Alert, AlertType } from "../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

import styles from "./Alert.module.css";
import { useBikeManagementContext } from "../context/BikeManagementContext";
import { useNavigate } from "react-router-dom";
import Loader from "../components/module/LoadingModule";
import { BadRequestException, UnauthenticatedException } from "../models/Exceptions/ApiExceptions";
import { websocketManager } from "../services/websocketService";

const ALERT_TYPE_OPTIONS: Option[] = [
  { value: "", label: "All Status" },
  { value: AlertType.BOUNDARY_CROSS, label: "Ngoài Phạm Vi" },
  { value: AlertType.LOW_BATTERY, label: "Pin Thấp" },
  { value: AlertType.TOPPLE, label: "Ngã Đỗ" },
  { value: AlertType.CRASH, label: "Va Chạm" },
];

// Main Alerts Page
export default function Alerts() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const bikeManagementContext = useBikeManagementContext()

  const [isResolving, setIsResolving] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState("")

  const {
    isLoading,
    displayList,
    setDisplayList,
    totalCount,
    totalPages,
    currentPage,
    applyFilters,
    resetFilter,
    goToPage,
    filterPayload,
    setFilterPayload,
  } = useAlertListing(alertApi.getAlerts);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    globalContext.setCurrentPage(WebScreen.ALERT);
    globalContext.setCurrentHeader("Cảnh Báo");
    globalContext.setAlerts([])
    globalContext.alertsReserve.current = []
    websocketManager.setOnAlert((alert: Alert) => {
      if (currentPage == 1) {
        setDisplayList((prev) => {
          // ✅ prevent duplicates (optional but recommended)
          if (prev.some((a) => a.id === alert.id)) return prev;

          // ✅ add to top
          const next = [alert, ...prev];

          // ✅ remove one from bottom (keep same length as before)
          return next.slice(0, prev.length);
        });
      }


    });
  }, []);





  useEffect(() => {
    const resolveAlert = async () => {
      if (isResolving && selectedAlert) {
        try {
          abortRef.current?.abort();
          const controller = new AbortController();
          abortRef.current = controller;
          await alertApi.resolveAlerts(selectedAlert, controller.signal)
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setIsResolving(false)
          setDisplayList(prev =>
            (prev ?? []).filter(a => a.id !== selectedAlert)
          );
          globalContext.setSnackbar({
            message: "Đã tiếp nhận xử lý cảnh báo thành công",
            type: "Success",
            isOn: true
          })
        } catch (err: any) {
          if (err?.name === "AbortError") {
            return;
          }

          if (err instanceof UnauthenticatedException) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setIsResolving(false)
            globalContext.setSnackbar({
              message: "Phiên đăng nhập đã hết hạn. Xin vui lòng đăng nhập lại",
              type: "Error",
              isOn: true
            })
            globalContext.setIsAuth(false);

          } else if (err instanceof BadRequestException) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setIsResolving(false)
            setDisplayList(prev =>
              (prev ?? []).filter(a => a.id !== selectedAlert)
            );
            globalContext.setSnackbar({
              message: err.message,
              type: "Error",
              isOn: true
            })

          } else {
            setIsResolving(false)
            globalContext.setSnackbar({
              message: "Đã xảy ra lỗi. Xin vui lòng thử lại",
              type: "Error",
              isOn: true
            })
          }
        }

      }
    }
    resolveAlert()
  }, [isResolving])

  return (
    <div className={styles["page-container"]}>
      {
        isResolving ? <div className={styles.loadingOverlay}>
          <div className={styles.loadingWhiteBackground}>
            <Loader></Loader>
          </div>
        </div> : undefined
      }


      <div className={styles["alerts-wrapper"]}>
        {/* Filter Buttons */}
        <div className={styles["alerts-filters"]}>
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
            type="date"
            placeHolder="Tìm từ ngày"
            label="Tìm Đến Ngày"
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
          />

          <Input
            kind="input"
            type="date"
            placeHolder="Tìm đến ngày"
            label="Tìm Từ Ngày"
            value={
              filterPayload.to === ""
                ? new Date().toISOString().slice(0, 10)
                : new Date(Number(filterPayload.to)).toISOString().slice(0, 10)
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
            value={filterPayload.type}
            placeHolder="Chọn loại cảnh báo"
            options={ALERT_TYPE_OPTIONS}
            label="Loại Cảnh Báo"
            onChange={(e) =>
              setFilterPayload((p) => ({ ...p, type: e.target.value }))
            }
          />

          <button
            className={`${styles["btn"]} ${styles["apply-btn"]}`}
            onClick={applyFilters}
            disabled={isLoading}
            title="Apply filters & fetch group 0"
          >
            Tìm Kiếm
          </button>

          <button
            className={`${styles["btn"]} ${styles["clear-btn"]}`}
            onClick={resetFilter}
            disabled={isLoading}
            title="Apply filters & fetch group 0"
          >
            Huỷ
          </button>
        </div>

        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          totalItems={totalCount}
          goToPage={goToPage}
        />


        {
          isLoading ? <div style={{
            width: "100%",
            height: "500px"
          }}>
            <Loader />
          </div> :
            <div className={`${styles["alerts-container"]}`}>
              {displayList.map((alert: Alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={() => {
                    setIsResolving(true)
                    setSelectedAlert(alert.id)
                  }}
                  className={
                    alert.id === globalContext.activeAlertId
                      ? styles["active-alert"]
                      : ""
                  }
                  onViewDetail={
                    () => {
                      bikeManagementContext.setCurrentBikeId(alert.bike_id)
                      bikeManagementContext.setCurrentBike(null)
                      navigate("/bike")
                    }

                  }
                />
              ))}
            </div>
        }


        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          totalItems={totalCount}
          goToPage={goToPage}
        />
      </div>

    </div>
  );
}