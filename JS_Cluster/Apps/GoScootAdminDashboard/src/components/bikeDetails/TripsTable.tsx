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
import styles from "./TripsTable.module.css"
import Loader from '../module/LoadingModule';

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
    totalPages,
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
    <div className={styles["trips-table-container"]}>
      <div className={styles["trips-header"]}>
        <h3>Last Trips ({totalCount})</h3>
      </div>

      <div className={styles["trips-filters"]}>
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
          className={[styles["trip-btn"], styles["trip-apply-btn"]].join(" ")}
          onClick={applyFilters}
          disabled={isLoading}
          title="Apply filters & fetch group 0"
        >
          Apply
        </button>

        <button
          className={[styles["trip-btn"], styles["trip-clear-btn"]].join(" ")}
          onClick={resetFilter}
          disabled={isLoading}
          title="Clear filters"
        >
          Clear
        </button>
      </div>

      <div className={styles["trip-table-wrapper"]}>
        {
          isLoading ? <Loader></Loader> : <table className={styles["trips-table"]}>
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
                  const hasLocation =
                    trip.trip_end_long != null && trip.trip_end_lat != null;

                  const rowClass = [
                    selectedTrip?.id === trip.id ? styles["selected"] : "",
                    !hasLocation ? styles["no-location"] : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const statusKey = `status_${String(trip.trip_status || "")
                    .toLowerCase()
                    .replace(/\s+/g, "_")}`;

                  return (
                    <tr
                      key={trip.id}
                      className={rowClass}
                      onClick={() => {
                        onSelectTrip(trip);
                        selectTrip(trip);
                      }}
                      title={
                        hasLocation
                          ? "Click to view trip end location"
                          : "No location data available"
                      }
                    >
                      <td>{trip.customer_id}</td>

                      <td>
                        <span
                          className={[
                            styles["trip-status"],
                            styles[statusKey] ?? "",
                          ].join(" ")}
                        >
                          {trip.trip_status}
                        </span>
                      </td>

                      <td>{formatDate(trip.reservation_date)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "2rem" }}>
                    No trips found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        }

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

export default TripsTable;
