import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Trip, BikeTelemetry, BikeStatus } from '@trungthao/admin_dashboard_dto';


import BikeInfoCard from '../../components/bikeDetails/BikeInfoCard';
import TripsTable from '../../components/bikeDetails/TripsTable';
import TelemetryTable from '../../components/bikeDetails/TelemetryTable';
import BikeMap, { Coordinate } from '../../components/bikeDetails/BikeMap';
import './BikeDetails.css';
import { websocketManager } from '../../services/websocketService';
import { useGlobalContext } from '../../context/GlobalContext';
import { useBikeManagementContext } from '../../context/BikeManagementContext';
import { bikeApi } from '../../services/ApiClient/BikeApis';
import { UnauthenticatedException } from '../../models/Exceptions/ApiExceptions';


/**
 * BikeDetails component
 * Fetches and displays bike data from server with real-time MQTT updates
 */
function BikeDetails() {
    // Bike data state
    const globalContext = useGlobalContext()
    const bikeManagementContext = useBikeManagementContext()
   
    // Export state
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    // Real-time location from MQTT
    const [liveLocation, setLiveLocation] = useState<Coordinate | null>(null);
    const [lastKnownLocation, setLastKnownLocation] = useState<Coordinate | null>(null);
    const [pastLocation, setPastLocation] = useState<Coordinate | null>(null)

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
            latitude: telemetry.last_gps_lat
        })
        setLiveBattery(telemetry.battery);
        //setTelemetry(prev => [telemetry, ...prev.slice(0, 99)]);
    }, []);

    useEffect(() => {
        if (bikeManagementContext.currentBike){
            websocketManager.requestBikeTelemetry(bikeManagementContext.currentBike.id);
            websocketManager.setOnBikeTelemetry(handleOnTelemetryReception)
        }
       
    }, [bikeManagementContext.currentBike]);

    // Fetch bike details
    useEffect(() => {
        const fetchBikeData = async () => {
            if (bikeManagementContext.currentBikeId){
            try {
                abortRef.current?.abort();
                const controller = new AbortController();
                abortRef.current = controller;
                setIsLoading(true);
                const bikeData = await bikeApi.getBikeId(bikeManagementContext.currentBikeId, controller.signal);
                bikeManagementContext.setCurrentBike(bikeData);
            } catch (err) {
                if (err instanceof UnauthenticatedException) {
                    globalContext.setIsAuth(false)
                }
                console.error('Failed to fetch bike data:', err);
                //setError(err instanceof Error ? err.message : 'Failed to load bike data');
            } finally {
                setIsLoading(false);
            }
            }

        };
        
        fetchBikeData();
    }, [bikeManagementContext.currentBikeId]);

    // // Export telemetry to Excel (XLSX format)
    // const exportToExcel = useCallback(async () => {
    //     try {
    //         setIsExporting(true);

    //         const fromTimestamp = telemetryStartDate
    //             ? new Date(telemetryStartDate).getTime()
    //             : undefined;
    //         const toTimestamp = telemetryEndDate
    //             ? new Date(telemetryEndDate + 'T23:59:59').getTime()
    //             : undefined;

    //         // Fetch all telemetry data with current filters (no pagination)
    //         const allTelemetry = await bikeApi.exportBikeTelemetry(bikeId, {
    //             from: fromTimestamp,
    //             to: toTimestamp,
    //             sortDirection: 'desc',
    //         });

    //         // Transform telemetry data for Excel
    //         const excelData = allTelemetry.map(t => ({
    //             'Battery (%)': t.battery,
    //             'Longitude': t.longitude,
    //             'Latitude': t.latitude,
    //             'Last GPS Long': t.last_gps_long,
    //             'Last GPS Lat': t.last_gps_lat,
    //             'Last GPS Contact': t.last_gps_contact_time ? new Date(t.last_gps_contact_time).toISOString() : 'N/A',
    //             'Operation Status': t.operationStatus,
    //             'Usage Status': t.usageStatus,
    //             'Timestamp': new Date(t.time).toISOString(),
    //         }));

    //         // Create workbook and worksheet
    //         const worksheet = XLSX.utils.json_to_sheet(excelData);
    //         const workbook = XLSX.utils.book_new();

    //         // Set column widths
    //         worksheet['!cols'] = [
    //             { wch: 12 },  // Battery
    //             { wch: 15 },  // Longitude
    //             { wch: 15 },  // Latitude
    //             { wch: 15 },  // Last GPS Long
    //             { wch: 15 },  // Last GPS Lat
    //             { wch: 25 },  // Last GPS Contact
    //             { wch: 15 },  // Operation Status
    //             { wch: 12 },  // Usage Status
    //             { wch: 25 },  // Timestamp
    //         ];

    //         XLSX.utils.book_append_sheet(workbook, worksheet, `Telemetry - ${bikeId.slice(0, 20)}`);

    //         // Generate XLSX file and trigger download
    //         const fileName = `bike-${bikeId}-telemetry-${new Date().toISOString().split('T')[0]}.xlsx`;
    //         XLSX.writeFile(workbook, fileName);

    //         console.log(`✅ Exported ${allTelemetry.length} telemetry records to Excel`);
    //     } catch (err) {
    //         console.error('Failed to export telemetry:', err);
    //         alert('Failed to export telemetry data. Please try again.');
    //     } finally {
    //         setIsExporting(false);
    //     }
    // }, [bikeId, telemetryStartDate, telemetryEndDate]);

    const formatDate = useCallback((timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    }, []);

    const getStatusText = useCallback((status: BikeStatus) => {
        switch (status) {
            case BikeStatus.INUSED:
                return 'Being Rent';
            case BikeStatus.RESERVED:
                return 'Reserved';
            case BikeStatus.IDLE:
                return 'Available';
            default:
                return status;
        }
    }, []);



    return (
        bikeManagementContext.currentBike ?
            <div className="bike-details-container">
                <div className="main-content">
                    <div className="content-area">
                        <BikeInfoCard
                            bike={bikeManagementContext.currentBike}
                            liveBattery={liveBattery}
                            formatDate={formatDate}
                            getStatusText={getStatusText}
                        />

                        <div className="trips-map-section">
                            <TripsTable
                                bike={bikeManagementContext.currentBike}
                                onSelectTrip={(trip: Trip) => {
                                    console.log(trip)
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
                            onSelectTelemetry={
                                (telemetry: BikeTelemetry) => {
                                    setPastLocation({ longitude: telemetry.longitude, latitude: telemetry.latitude })
                                }
                            }
                            isExportingExcel={false} onExportExcel={function (): void {
                                throw new Error('Function not implemented.');
                            }}
                        />
                    </div>
                </div>
            </div> : undefined
    );
}

export default BikeDetails;
