/**
 * TripsTable Component
 * Displays bike trip history with date filtering and pagination
 */

import { Bike, Trip } from '@trungthao/admin_dashboard_dto';
import { tripApi } from '../../services/ApiClient/TripApis';
import { useTripListing } from '../../hooks/PageHooks/useTripListing';
import Input from '../module/Input';
import { dateToEndOfDay, dateToStartOfDay } from '../../utlities/methods';
import { formatDate } from '../../utlities/convert';
import { useState } from 'react';
import Pagination from '../module/pagination';

type TripsTableProps = {
  bike: Bike,
  onSelectTrip: (trip: Trip) => void
}
function TripsTable({
  bike, onSelectTrip
}: TripsTableProps) {

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
  } = useTripListing(bike.id, tripApi.getTrips);

  const [selectedTrip, selectTrip] = useState<Trip | null>(null)

  return (
    <div className="trips-table-container">
      <div className="trips-header">
        <h3>Last Trips ({totalCount})</h3>
        <div className="trips-filters">
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
          {displayList.length > 0 ? (
            displayList.map((trip) => {
              const hasLocation = trip.trip_end_long != null && trip.trip_end_lat != null;
              return (
                <tr
                  key={trip.id}
                  className={`${selectedTrip?.id === trip.id ? 'selected' : ''} ${!hasLocation ? 'no-location' : ''}`}
                  onClick={
                    () => {
                      onSelectTrip(trip)
                      selectTrip(trip)
                    }

                  }
                  title={hasLocation ? 'Click to view trip end location' : 'No location data available'}
                >
                  <td>{trip.customer_id}</td>
                  <td>
                    <span className={`trip-status ${trip.trip_status?.toLowerCase()}`}>
                      {trip.trip_status}
                    </span>
                  </td>
                  <td>{formatDate(trip.reservation_date)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                No trips found
              </td>
            </tr>
          )}
        </tbody>
      </table>

              <Pagination
                currentPage={currentPage}
                totalItems={totalCount}
                goToPage={goToPage}>
              </Pagination>
      



      {/*
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
      */}

    </div>
  );
}

export default TripsTable;
