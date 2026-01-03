import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Trip, BikeTelemetry, BikeStatus } from "@trungthao/admin_dashboard_dto";

import BikeInfoCard from "../../components/bikeDetails/BikeInfoCard";
import TripsTable from "../../components/bikeDetails/TripsTable";
import TelemetryTable from "../../components/bikeDetails/TelemetryTable";
import BikeMap, { Coordinate } from "../../components/bikeDetails/BikeMap";

import { websocketManager } from "../../services/websocketService";
import { useGlobalContext } from "../../context/GlobalContext";
import { useBikeManagementContext } from "../../context/BikeManagementContext";
import { bikeApi } from "../../services/ApiClient/BikeApis";
import { UnauthenticatedException } from "../../models/Exceptions/ApiExceptions";

import styles from "./BikeDetails.module.css";

/**
 * BikeDetails component
 * Fetches and displays bike data from server with real-time MQTT updates
 */
function BikeDetails() {
  const globalContext = useGlobalContext();
  const bikeManagementContext = useBikeManagementContext();

  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [liveLocation, setLiveLocation] = useState<Coordinate | null>(null);
  const [lastKnownLocation, setLastKnownLocation] =
    useState<Coordinate | null>(null);
  const [pastLocation, setPastLocation] = useState<Coordinate | null>(null);

  const [liveBattery, setLiveBattery] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Subscribe to bike telemetry topic for real-time updates
  const handleOnTelemetryReception = useCallback((telemetry: BikeTelemetry) => {
    setLiveLocation({
      longitude: telemetry.longitude,
      latitude: telemetry.latitude,
    });
    setLastKnownLocation({
      longitude: telemetry.last_gps_long,
      latitude: telemetry.last_gps_lat,
    });
    setLiveBattery(telemetry.battery);
  }, []);

  useEffect(() => {
    console.log("Current bike", bikeManagementContext.currentBike);
    if (bikeManagementContext.currentBike) {
      websocketManager.requestBikeTelemetry(bikeManagementContext.currentBike.id);
      websocketManager.setOnBikeTelemetry(handleOnTelemetryReception);
    }
  }, [bikeManagementContext.currentBike, handleOnTelemetryReception]);

  // Fetch bike details
  useEffect(() => {
    const fetchBikeData = async () => {
      if (!bikeManagementContext.currentBikeId) return;

      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);

        const bikeData = await bikeApi.getBikeId(
          bikeManagementContext.currentBikeId,
          controller.signal
        );

        bikeManagementContext.setCurrentBike(bikeData);
      } catch (err) {
        if (err instanceof UnauthenticatedException) {
          globalContext.setIsAuth(false);
        }
        console.error("Failed to fetch bike data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBikeData();
  }, [bikeManagementContext.currentBikeId, bikeManagementContext, globalContext]);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  const getStatusText = useCallback((status: BikeStatus) => {
    switch (status) {
      case BikeStatus.INUSED:
        return "Being Rent";
      case BikeStatus.RESERVED:
        return "Reserved";
      case BikeStatus.IDLE:
        return "Available";
      default:
        return status;
    }
  }, []);

  if (!bikeManagementContext.currentBike) return undefined;

  return (
    <div className={styles["bike-details-container"]}>
      <div className={styles["main-content"]}>
        <div className={styles["content-area"]}>
          <BikeInfoCard
            bike={bikeManagementContext.currentBike}
            liveBattery={liveBattery}
            formatDate={formatDate}
            getStatusText={getStatusText}
          />

          <div className={styles["trips-map-section"]}>
            <TripsTable
              bike={bikeManagementContext.currentBike}
              onSelectTrip={(trip: Trip) => {
                console.log(trip);
              }}
            />

            <BikeMap
              bike={bikeManagementContext.currentBike}
              lastKnownLocation={lastKnownLocation}
              liveLocation={liveLocation}
              pastTelemetryLocation={pastLocation}
            />
          </div>

          <TelemetryTable
            bike={bikeManagementContext.currentBike}
            onSelectTelemetry={(telemetry: BikeTelemetry) => {
              setPastLocation({
                longitude: telemetry.longitude,
                latitude: telemetry.latitude,
              });
            }}
            isExportingExcel={false}
            onExportExcel={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default BikeDetails;