/**
 * TelemetryTable Component
 * Displays bike telemetry/movement history with date filtering, pagination, and Excel export
 */

import { BikeTelemetry, OperationStatus, BikeStatus } from '@trungthao/admin_dashboard_dto';
import { MdFileDownload } from 'react-icons/md';

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
  telemetry: BikeTelemetry[];
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onExportExcel: () => void;
  isExporting: boolean;
  formatDate: (timestamp: number) => string;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function TelemetryTable({ 
  telemetry, 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onExportExcel,
  isExporting,
  formatDate,
  page,
  totalPages,
  total,
  onPageChange,
}: TelemetryTableProps) {
  return (
    <div className="movement-history-section">
      <div className="movement-history-header">
        <h3>Movement History ({total} records) 
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              placeholder="Start Date"
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              placeholder="End Date"
              className="date-input"
            />
          </div>
          <button 
            onClick={onExportExcel} 
            className="export-btn"
            disabled={isExporting}
            title="Export to Excel"
          >
            <MdFileDownload size={18} style={{ marginRight: '4px' }} />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>
      <table className="trips-table telemetry-table">
        <thead>
          <tr>
            <th>Battery</th>
            <th>Longitude</th>
            <th>Latitude</th>
            <th>Last GPS Long</th>
            <th>Last GPS Lat</th>
            <th>GPS Contact</th>
            <th>Operation</th>
            <th>Usage</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {telemetry.length > 0 ? (
            telemetry.map((t) => (
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
                <td>
                  <span className={`telemetry-status ${getOperationStatusClass(t.operationStatus)}`}>
                    {t.operationStatus}
                  </span>
                </td>
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
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ◀
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button 
            className="pagination-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

export default TelemetryTable;
