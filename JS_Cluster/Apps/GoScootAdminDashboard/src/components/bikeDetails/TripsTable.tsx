/**
 * TripsTable Component
 * Displays bike trip history with date filtering and pagination
 */

import { Trip } from '@trungthao/admin_dashboard_dto';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface TripsTableProps {
  trips: Trip[];
  selectedTrip: string | null;
  onTripSelect: (tripId: string) => void;
  formatDate: (timestamp: number) => string;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function TripsTable({ 
  trips, 
  selectedTrip, 
  onTripSelect, 
  formatDate,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  page,
  totalPages,
  total,
  onPageChange,
}: TripsTableProps) {
  return (
    <div className="trips-table-container">
      <div className="trips-header">
        <h3>Last Trips ({total})</h3>
        <div className="trips-filters">
          <div className="date-filters">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              placeholder="From"
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              placeholder="To"
              className="date-input"
            />
          </div>
        </div>
      </div>
      <table className="trips-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {trips.length > 0 ? (
            trips.map((trip) => (
              <tr
                key={trip.id}
                className={selectedTrip === trip.id ? 'selected' : ''}
                onClick={() => onTripSelect(trip.id)}
              >
                <td>{trip.customer_id}</td>
                <td>
                  <span className={`trip-status ${trip.trip_status?.toLowerCase()}`}>
                    {trip.trip_status}
                  </span>
                </td>
                <td>{formatDate(trip.reservation_date)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                No trips found
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
          >
            <MdChevronLeft size={20} />
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button 
            className="pagination-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default TripsTable;
