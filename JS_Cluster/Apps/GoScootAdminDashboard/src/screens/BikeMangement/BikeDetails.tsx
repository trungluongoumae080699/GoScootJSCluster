import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Trip, BikeTelemetry, BikeStatus } from "@trungthao/admin_dashboard_dto";

import BikeInfoCard from "../../components/bikeDetails/BikeInfoCard";
import TripsTable from "../../components/bikeDetails/TripsTable";
import TelemetryTable from "../../components/bikeDetails/TelemetryTable";
import BikeMap, { Coordinate } from "../../components/bikeDetails/BikeMap";

import { websocketManager } from "../../services/websocketService";
import { useGlobalContext, WebScreen } from "../../context/GlobalContext";
import { useBikeManagementContext } from "../../context/BikeManagementContext";
import { bikeApi } from "../../services/ApiClient/BikeApis";
import { UnauthenticatedException } from "../../models/Exceptions/ApiExceptions";

import styles from "./BikeDetails.module.css";
import Loader from "../../components/module/LoadingModule";

/**
 * BikeDetails component
 * Fetches and displays bike data from server with real-time MQTT updates
 */
function BikeDetails() {
  console.log("Bike Detail Re-render")
  const globalContext = useGlobalContext();
  const bikeManagementContext = useBikeManagementContext();
  const [isLoading, setIsLoading] = useState(false);
  const [liveLocation, setLiveLocation] = useState<Coordinate | null>(null);
  const [lastKnownLocation, setLastKnownLocation] =
    useState<Coordinate | null>(null);
  const [pastLocation, setPastLocation] = useState<Coordinate | null>(null);
  const [selectedTelemetry, selectTelemetry] = useState<BikeTelemetry | null>(null)
  const [liveBattery, setLiveBattery] = useState<number | null>(null);

  const [newTelemetry, setNewTelemetry] = useState<BikeTelemetry | null>(null)

  const [liveOutofBoundWarning, setLiveOutofBoundWarning] = useState<boolean>(false);
  const [liveLowBatteryWarning, setLiveLowBatteryWarning] = useState<boolean>(false);
  const [liveCrashWarning, setLiveCrashWarning] = useState<boolean>(false);
  const [liveToppleWarning, setLiveToppleWarning] = useState<boolean>(false)
  const [liveUsageStatusUpdate, setLiveUsageStatusUpdate] = useState<BikeStatus | null>(null)

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
    setLiveUsageStatusUpdate(telemetry.usageStatus)
    setLiveBattery(telemetry.battery);
    setLiveCrashWarning(telemetry.isCrashed)
    setLiveToppleWarning(telemetry.isToppled)
    setLiveLowBatteryWarning(telemetry.batteryIsLow)
    setLiveOutofBoundWarning(telemetry.isOutOfBound)
    setNewTelemetry(telemetry)
  }, []);

  useEffect(()=>{
    globalContext.setCurrentPage(WebScreen.BIKE_DETAIL)
    globalContext.setCurrentHeader("Chi Tiết Xe")
  })

  useEffect(() => {
    if (!bikeManagementContext.currentBike) return;

    const bikeId = bikeManagementContext.currentBike.id;

    // chạy ngay lần đầu
    websocketManager.requestBikeTelemetry([bikeId]);
    websocketManager.setOnBikeTelemetry(handleOnTelemetryReception);

    const interval = setInterval(() => {
      console.log("Polling telemetry for bike", bikeId);
      websocketManager.requestBikeTelemetry([bikeId]);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [bikeManagementContext.currentBike?.id, handleOnTelemetryReception]);

  useEffect(() => {
    const disabledLoading = async () => {
      if (bikeManagementContext.currentBike) {
        setLiveUsageStatusUpdate(bikeManagementContext.currentBike.status)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
      }
    }
    
    disabledLoading()

  }, [bikeManagementContext.currentBike])

  // Fetch bike details
  useEffect(() => {
    const fetchBikeData = async () => {
      setIsLoading(true)
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
      }
    };

    fetchBikeData();
  }, [bikeManagementContext.currentBikeId]);

  useEffect(() => {
    console.log("Past Loc", pastLocation)
  }, [pastLocation])

  useEffect(() => {
    console.log("Telemetry", selectedTelemetry)
  }, [selectedTelemetry])

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  const getStatusText = useCallback((status: BikeStatus) => {
    switch (status) {
      case BikeStatus.INUSED:
        return "Đang sử dụng";

      case BikeStatus.RESERVED:
        return "Đã được đặt";

      case BikeStatus.IDLE:
        return "Sẵn sàng";

      default:
        return status;
    }
  }, []);

  if (!bikeManagementContext.currentBike) return undefined;

  return (
    <div className={styles["bike-details-container"]}>
      {
        isLoading ? <Loader></Loader> : <div className={styles["main-content"]}>
          <div className={styles["content-area"]}>
            <BikeInfoCard
              bike={bikeManagementContext.currentBike}
              liveUsageStatusUpdate={liveUsageStatusUpdate}
              liveBattery={liveBattery}
              liveCrashWarning={liveCrashWarning}
              liveLowBatteryWarning={liveLowBatteryWarning}
              liveOutofBoundWarning={liveOutofBoundWarning}
              liveToppleWarning={liveToppleWarning}
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
              newTelemetry={newTelemetry}
              setNewTelemetry={setNewTelemetry}
              selectedTelemetry={selectedTelemetry}
              onSelectTelemetry={(telemetry: BikeTelemetry) => {
                console.log("Tele Row Clicked")
                if (selectedTelemetry && telemetry.id === selectedTelemetry.id) {
                  console.log("existing tele clicked")
                  selectTelemetry(null)
                  setPastLocation(null)
                } else {
                  console.log("New tele clicked")
                  selectTelemetry(telemetry)
                  setPastLocation({
                    longitude: telemetry.last_gps_long,
                    latitude: telemetry.last_gps_lat
                  })
                }

              }}
              isExportingExcel={false}
              onExportExcel={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
          </div>
        </div>

      }

    </div>
  );
}

export default BikeDetails;