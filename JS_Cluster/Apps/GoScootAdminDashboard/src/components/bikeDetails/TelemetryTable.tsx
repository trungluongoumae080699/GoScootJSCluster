/**
 * TelemetryTable Component
 * Displays bike telemetry/movement history with date filtering, pagination, and Excel export
 */

import { BikeTelemetry, OperationStatus, BikeStatus, Bike } from '@trungthao/admin_dashboard_dto';
import { MdFileDownload } from 'react-icons/md';
import { useTelemetryListing } from '../../hooks/PageHooks/useTelemetryListing';
import { dateToEndOfDay, dateToStartOfDay } from '../../utlities/methods';
import Input from '../module/Input';
import { formatDate } from '../../utlities/convert';
import Pagination from '../module/pagination';
import { bikeApi } from '../../services/ApiClient/BikeApis';
import styles from "./TelemetryTable.module.css"
import { exportBikeTelemetryToExcel } from '../../utlities/FileUtility';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

/** Get CSS class for usage status badge */
function getUsageStatusClass(status: BikeStatus): string {
  switch (status) {
    case BikeStatus.IDLE:
      return 'status-idle';
    case BikeStatus.RESERVED:
      return 'status-reserved';
    case BikeStatus.INUSED:
      return 'status-inuse';
    default:
      return 'status-idle';
  }
}

interface TelemetryTableProps {
  bike: Bike,
  newTelemetry: BikeTelemetry | null,
  setNewTelemetry: Dispatch<SetStateAction<BikeTelemetry | null>>

  selectedTelemetry: BikeTelemetry | null
  onSelectTelemetry: (telemetry: BikeTelemetry) => void
  isExportingExcel: boolean
  onExportExcel: () => void
}

function TelemetryTable({
  bike,
  newTelemetry,
  setNewTelemetry,
  selectedTelemetry,
  onSelectTelemetry,
  isExportingExcel,
  onExportExcel,

}: TelemetryTableProps) {
  const {
    // state
    isLoading,
    displayList,
    setDisplayList,
    totalCount,
    currentPage,
    // actions
    applyFilters, // use snapshot version
    resetFilter,
    goToPage,
    totalPages,
    // filters
    filterPayload,
    setFilterPayload,
  } = useTelemetryListing(bike.id, bikeApi.getBikeTelemetry);

  useEffect(() => {
    if (!newTelemetry) return;

    setDisplayList((prev) => {
      if (!prev || prev.length === 0) return [newTelemetry];

      // add to top, remove last
      return [newTelemetry, ...prev.slice(0, prev.length - 1)];
    });

    setNewTelemetry(null);
  }, [newTelemetry, setDisplayList]);

  return (
    <div className={styles["movement-history-section"]}>
      <div className={styles["movement-history-header"]}>
        <h3>
          Lịch Sử Trạng Thái ({totalCount} records)
          <span
            style={{
              fontSize: "12px",
              color: "#4CAF50",
              marginLeft: "8px",
              fontWeight: "normal",
            }}
          >
            ● Trực Tuyến
          </span>
        </h3>
      </div>

      <div className={styles["telemetry-filters"]}>
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
          placeHolder="Tìm đến ngày"
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

        <button
          className={[styles["btn"], styles["apply-btn"]].join(" ")}
          onClick={applyFilters}
          disabled={isLoading}
          title="Apply filters & fetch group 0"
        >
          Tìm Kiếm
        </button>

        <button
          className={[styles["btn"], styles["clear-btn"]].join(" ")}
          onClick={resetFilter}
          disabled={isLoading}
          title="Clear filters"
        >
          Huỷ
        </button>
      </div>

      <button
        onClick={() => {
          if (displayList.length > 0) {
            exportBikeTelemetryToExcel(displayList)
          }
        }}
        className={styles["export-btn"]}
        disabled={isExportingExcel}
        title="Xuất File Excel"
      >
        <MdFileDownload size={18} style={{ marginRight: "4px" }} />
        {isExportingExcel ? "Exporting..." : "Export Excel"}
      </button>

      <div className={styles["telemetry-table-wrapper"]}>
        <table className={[styles["trips-table"], styles["telemetry-table"]].join(" ")}>
          <thead>
            <tr>
              <th>Pin</th>
              <th>Kinh Độ</th>
              <th>Vĩ Độ</th>
              <th>Kinh Độ GPS</th>
              <th>Vĩ Độ GPS</th>
              <th>Kết Nôi GPS Cuối Cùng</th>
              <th>Thời Gian</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {displayList.length > 0 ? (
              displayList.map((t) => (
                <tr
                  key={t.id}
                  className={[
                    selectedTelemetry?.id === t.id ? styles.selectedRow : "",
                  ].join(" ")}
                  onClick={() => onSelectTelemetry(t)}
                >
                  <td>
                    <span
                      style={{
                        color: t.battery > 20 ? "#4CAF50" : "#F44336",
                        fontWeight: "bold",
                      }}
                    >
                      {t.battery}%
                    </span>
                  </td>

                  <td>{t.longitude.toFixed(6)}</td>
                  <td>{t.latitude.toFixed(6)}</td>
                  <td>{t.last_gps_long?.toFixed(6) ?? "N/A"}</td>
                  <td>{t.last_gps_lat?.toFixed(6) ?? "N/A"}</td>
                  <td>
                    {t.last_gps_contact_time
                      ? formatDate(t.last_gps_contact_time)
                      : "N/A"}
                  </td>

                  <td>
                    <span
                      className={[
                        styles["telemetry-status"],
                        getUsageStatusClass(t.usageStatus),
                      ].filter(Boolean).join(" ")}
                    >
                      {t.usageStatus}
                    </span>
                  </td>

                  <td>{formatDate(t.time)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "2rem" }}>
                  No telemetry data found for the selected date range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        totalItems={totalCount}
        goToPage={goToPage}
      />
    </div>
  );


}

export default TelemetryTable;
