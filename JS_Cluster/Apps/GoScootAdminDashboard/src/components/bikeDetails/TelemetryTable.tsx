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
import "./TelemetryTable.css"

/** Get CSS class for operation status badge */
function getOperationStatusClass(status: OperationStatus): string {
  switch (status) {
    case OperationStatus.NORMAL:
      return 'status-normal';
    case OperationStatus.OUT_OF_BOUND:
      return 'status-warning';
    case OperationStatus.LOW_BATTERY:
      return 'status-danger';
    default:
      return 'status-normal';
  }
}

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
  onSelectTelemetry: (telemetry: BikeTelemetry) => void
  isExportingExcel: boolean
  onExportExcel: () => void
}

function TelemetryTable({
  bike,
  onSelectTelemetry,
  isExportingExcel,
  onExportExcel,

}: TelemetryTableProps) {
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
    totalPages,
    // filters
    filterPayload,
    setFilterPayload,
  } = useTelemetryListing(bike.id, bikeApi.getBikeTelemetry);

  return (
    <div className="movement-history-section">
      <div className="movement-history-header">
        <h3>Movement History ({totalCount} records)
          <span style={{
            fontSize: '12px',
            color: '#4CAF50',
            marginLeft: '8px',
            fontWeight: 'normal'
          }}>
            ● Live Updates
          </span>
        </h3>
        <div className="movement-history-controls">
          <div className="date-filters">
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
                  : new Date(filterPayload.from).toISOString().slice(0, 10)
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
                  : new Date(filterPayload.to).toISOString().slice(0, 10)
              }
              onChange={(e) =>
                setFilterPayload((p) => ({
                  ...p,
                  to: String(dateToEndOfDay(e.target.value)),
                }))
              }
            >

            </Input>
          </div>
          <button
            onClick={onExportExcel}
            className="export-btn"
            disabled={isExportingExcel}
            title="Export to Excel"
          >
            <MdFileDownload size={18} style={{ marginRight: '4px' }} />
            {isExportingExcel ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>
      <div className="telemetry-table-wrapper">
        <table className="trips-table telemetry-table">
          <thead>
            <tr>
              <th>Battery</th>
              <th>Longitude</th>
              <th>Latitude</th>
              <th>Last GPS Long</th>
              <th>Last GPS Lat</th>
              <th>GPS Contact</th>
              {/*<th>Operation</th>*/}
              <th>Usage</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {displayList.length > 0 ? (
              displayList.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span style={{
                      color: t.battery > 20 ? '#4CAF50' : '#F44336',
                      fontWeight: 'bold'
                    }}>
                      {t.battery}%
                    </span>
                  </td>
                  <td>{t.longitude.toFixed(6)}</td>
                  <td>{t.latitude.toFixed(6)}</td>
                  <td>{t.last_gps_long?.toFixed(6) ?? 'N/A'}</td>
                  <td>{t.last_gps_lat?.toFixed(6) ?? 'N/A'}</td>
                  <td>{t.last_gps_contact_time ? formatDate(t.last_gps_contact_time) : 'N/A'}</td>

                  {/*<td>
                  <span className={`telemetry-status ${getOperationStatusClass(t.operationStatus)}`}>
                    {t.operationStatus}
                  </span>
                </td>*/}

                  <td>
                    <span className={`telemetry-status ${getUsageStatusClass(t.usageStatus)}`}>
                      {t.usageStatus}
                    </span>
                  </td>
                  <td>{formatDate(t.time)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
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
        goToPage={goToPage}>
      </Pagination>

    </div>
  );
}

export default TelemetryTable;
