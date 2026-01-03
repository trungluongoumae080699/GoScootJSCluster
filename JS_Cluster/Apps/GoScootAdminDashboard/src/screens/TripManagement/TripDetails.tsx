// src/pages/TripDetails.tsx

import { FaRegClock } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { GoDotFill } from "react-icons/go";
import styles from "./TripDetails.module.css";
import { useEffect, useState } from "react";

import { useTripManagementContext } from "../../context/TripManagementContext";
import TripMap from "../../components/tripDetails/TripMap";
import { convertLocationName, formatDate, formatDistance, calculateDuration } from "../../utlities/convert";
import { calculateDistance } from "../../utlities/methods";

export default function TripDetails() {
  const tripManagementContext = useTripManagementContext();

  const [fromLocationName, setFromLocationName] = useState<string>("");
  const [toLocationName, setToLocationName] = useState<string>("");

  const [startLocation, setStartLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>({
    longitude: 106.660172,
    latitude: 10.762622,
  });

  const trip = tripManagementContext.currentTrip;

  useEffect(() => {
    if (!startLocation) return;

    convertLocationName(startLocation.longitude, startLocation.latitude)
      .then(setFromLocationName)
      .catch(() => setFromLocationName("Unknown location"));

    if (trip?.trip_end_long != null && trip?.trip_end_lat != null) {
      convertLocationName(trip.trip_end_long, trip.trip_end_lat)
        .then(setToLocationName)
        .catch(() => setToLocationName("Unknown location"));
    } else {
      setToLocationName("Unknown location");
    }
  }, [startLocation, trip]);

  return trip ? (
              <div className={styles["trip-detail-content"]}>
            <div className={styles["detail-header-card"]}>
              <div className={styles["map-icon-container"]}>
                <img
                  className={styles["map-icon"]}
                  src="/Map.png"
                  alt="Trip Map"
                />
              </div>

              <div className={styles["trip-info"]}>
                <h2 className={styles["vin"]}>{trip.id}</h2>
                <p>Bike ID: {trip.bike_id}</p>
                <p>Customer ID: {trip.customer_id}</p>
                <p>
                  Time: {formatDate(trip.trip_start_date!)} –{" "}
                  {formatDate(trip.trip_end_date!)}
                </p>
                <p>From: {fromLocationName}</p>
                <p>To: {toLocationName}</p>
              </div>
            </div>

            <div className={styles["trip-statistics-section"]}>
              <div className={styles["trip-statistic-card"]}>
                <h3 className={styles["statistic-title"]}>Trip Statistic</h3>

                <div
                  className={[
                    styles["statistic-item"],
                    styles["location-stats"],
                  ].join(" ")}
                >
                  <div className={styles["location-icon-group"]}>
                    <div className={styles["location-icon"]}>
                      <GoDotFill size={24} />
                    </div>
                    <div className={styles["location-icon"]}>
                      <FaLocationDot style={{ margin: 3 }} />
                    </div>
                  </div>

                  <div className={styles["location-text-group"]}>
                    <p>{fromLocationName}</p>
                    <p>{toLocationName}</p>
                  </div>

                  <p className={styles["distance"]}>
                    {formatDistance(
                      calculateDistance(
                        startLocation?.longitude!,
                        startLocation?.latitude!,
                        trip.trip_end_long!,
                        trip.trip_end_lat!
                      )
                    )}
                  </p>
                </div>

                <div
                  className={[
                    styles["statistic-item"],
                    styles["duration-stats"],
                  ].join(" ")}
                >
                  <div className={styles["duration-icon"]}>
                    <FaRegClock size={30} />
                  </div>
                  <p>
                    {calculateDuration(
                      trip.trip_start_date!,
                      trip.trip_end_date!
                    )}
                  </p>
                </div>
              </div>

              <div className={styles["map-image-container"]}>
                <TripMap
                  routeStart={
                    startLocation ?? {
                      longitude: 106.660172,
                      latitude: 10.762622,
                    }
                  }
                  routeEnd={{
                    longitude: trip.trip_end_long!,
                    latitude: trip.trip_end_lat!,
                  }}
                />
              </div>
            </div>
          </div>
  ) : undefined;
}