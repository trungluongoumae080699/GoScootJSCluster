import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Bike, Trip, BikeTelemetry, BikeStatus } from '@trungthao/admin_dashboard_dto';
import { bikeApi, tripApi, TelemetryResponse, TripsResponse } from './services/apiClient';
import { useMqttClient } from './hooks/useMqttClient';
import { decodeTelemetry } from './utlities/BindaryDecoder';
import { getMqttPassword, getStaffProfile } from './services/authService';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BikeInfoCard from './components/bikeDetails/BikeInfoCard';
import TripsTable from './components/bikeDetails/TripsTable';
import TelemetryTable from './components/bikeDetails/TelemetryTable';
import BikeMap from './components/bikeDetails/BikeMap';
import './BikeDetails.css';

const DEFAULT_BIKE_ID = 'bike-vin-123456';

/** Props for BikeDetails component */
interface BikeDetailsProps {
  /** Callback to navigate to other pages, optionally with bike location */
  onNavigate: (page: string, bikeLocation?: [number, number]) => void;
  /** Optional bike ID to display */
  bikeId?: string;
}

/**
 * BikeDetails component
 * Fetches and displays bike data from server with real-time MQTT updates
 */
function BikeDetails({ onNavigate, bikeId = DEFAULT_BIKE_ID }: BikeDetailsProps) {
  // Bike data state
  const [bike, setBike] = useState<Bike | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [telemetry, setTelemetry] = useState<BikeTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [telemetryPage, setTelemetryPage] = useState(1);
  const [telemetryTotal, setTelemetryTotal] = useState(0);
  const [telemetryTotalPages, setTelemetryTotalPages] = useState(1);
  const [tripsPage, setTripsPage] = useState(1);
  const [tripsTotal, setTripsTotal] = useState(0);
  const [tripsTotalPages, setTripsTotalPages] = useState(1);
  
  // UI state
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTripLocation, setSelectedTripLocation] = useState<{ longitude: number; latitude: number } | null>(null);
  
  // Telemetry date filters
  const [telemetryStartDate, setTelemetryStartDate] = useState<string>('');
  const [telemetryEndDate, setTelemetryEndDate] = useState<string>('');
  
  // Trips date filters
  const [tripsStartDate, setTripsStartDate] = useState<string>('');
  const [tripsEndDate, setTripsEndDate] = useState<string>('');
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  // Real-time location from MQTT
  const [liveLocation, setLiveLocation] = useState<{ longitude: number; latitude: number } | null>(null);
  const [liveBattery, setLiveBattery] = useState<number | null>(null);

  // Get MQTT credentials
  const mqttPassword = getMqttPassword();
  const staffProfile = getStaffProfile();
  const mqttUsername = staffProfile?.id || '';

  // MQTT client for real-time updates
  const mqttClient = useMqttClient(mqttUsername, mqttPassword || '');

  // Subscribe to bike telemetry topic for real-time updates
  useEffect(() => {
    if (!mqttClient || !bikeId) return;

    // Check if the client is connected before subscribing
    if (!mqttClient.connected) {
      console.log("⏳ Waiting for MQTT connection...");
      
      const onConnect = () => {
        console.log("✅ MQTT connected, subscribing to topic");
        subscribeToTopic();
      };
      
      mqttClient.once("connect", onConnect);
      return () => {
        mqttClient.off("connect", onConnect);
      };
    }

    subscribeToTopic();

    function subscribeToTopic() {
      const topic = `/telemetry/${bikeId}`;

      mqttClient!.subscribe(topic, (err) => {
        if (err) console.warn("Failed to subscribe:", err.message);
        else console.log("📡 Subscribed to:", topic);
      });

      const handleMessage = (_topic: string, payload: any) => {
        try {
          const telemetryData = decodeTelemetry(new Uint8Array(payload));
          console.log("📍 Live Telemetry:", telemetryData);
          
          // Update live location and battery
          setLiveLocation({
            longitude: telemetryData.longitude,
            latitude: telemetryData.latitude,
          });
          setLiveBattery(telemetryData.battery);
          
          // Update bike battery status
          setBike(prev => prev ? {
            ...prev,
            battery_status: telemetryData.battery
          } : null);

          // Add new telemetry record to the beginning of the list
          const newTelemetry: BikeTelemetry = {
            id: telemetryData.id,
            bike_id: bikeId,
            battery: telemetryData.battery,
            last_gps_long: telemetryData.last_gps_long,
            last_gps_lat: telemetryData.last_gps_lat,
            longitude: telemetryData.longitude,
            latitude: telemetryData.latitude,
            time: telemetryData.time,
            last_gps_contact_time: telemetryData.last_gps_contact_time,
            operationStatus: telemetryData.operationStatus,
            usageStatus: telemetryData.usageStatus,
          };

          setTelemetry(prev => [newTelemetry, ...prev.slice(0, 99)]); // Keep last 100 records
        } catch (err) {
          console.warn("Failed to decode telemetry:", err);
        }
      };

      mqttClient!.on("message", handleMessage);

      // Return cleanup function
      return () => {
        mqttClient!.off("message", handleMessage);
        if (mqttClient!.connected) {
          mqttClient!.unsubscribe(topic);
        }
      };
    }
  }, [mqttClient, bikeId, bike]);

  // Fetch bike details
  useEffect(() => {
    const fetchBikeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const bikeData = await bikeApi.getBikeById(bikeId);
        setBike(bikeData);
      } catch (err) {
        console.error('Failed to fetch bike data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bike data');
      } finally {
        setLoading(false);
      }
    };

    fetchBikeData();
  }, [bikeId]);

  // Fetch telemetry with date filters
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const fromTimestamp = telemetryStartDate 
          ? new Date(telemetryStartDate).getTime() 
          : undefined;
        const toTimestamp = telemetryEndDate 
          ? new Date(telemetryEndDate + 'T23:59:59').getTime() 
          : undefined;

        const response: TelemetryResponse = await bikeApi.getBikeTelemetry(bikeId, {
          page: telemetryPage,
          pageSize: 50,
          from: fromTimestamp,
          to: toTimestamp,
          sortDirection: 'desc',
        });

        setTelemetry(response.telemetry);
        setTelemetryTotal(response.total);
        setTelemetryTotalPages(response.totalPages);
      } catch (err) {
        console.error('Failed to fetch telemetry:', err);
      }
    };

    if (bikeId) {
      fetchTelemetry();
    }
  }, [bikeId, telemetryPage, telemetryStartDate, telemetryEndDate]);

  // Fetch trips with date filters
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const fromTimestamp = tripsStartDate 
          ? new Date(tripsStartDate).getTime() 
          : undefined;
        const toTimestamp = tripsEndDate 
          ? new Date(tripsEndDate + 'T23:59:59').getTime() 
          : undefined;

        const response: TripsResponse = await tripApi.getTripsByBike(bikeId, {
          page: tripsPage,
          pageSize: 10,
          from: fromTimestamp,
          to: toTimestamp,
          sortDirection: 'desc',
        });

        setTrips(response.trips);
        setTripsTotal(response.total);
        setTripsTotalPages(response.totalPages);
      } catch (err) {
        console.error('Failed to fetch trips:', err);
      }
    };

    if (bikeId) {
      fetchTrips();
    }
  }, [bikeId, tripsPage, tripsStartDate, tripsEndDate]);

  // Export telemetry to Excel (XLSX format)
  const exportToExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      
      const fromTimestamp = telemetryStartDate 
        ? new Date(telemetryStartDate).getTime() 
        : undefined;
      const toTimestamp = telemetryEndDate 
        ? new Date(telemetryEndDate + 'T23:59:59').getTime() 
        : undefined;

      // Fetch all telemetry data with current filters (no pagination)
      const allTelemetry = await bikeApi.exportBikeTelemetry(bikeId, {
        from: fromTimestamp,
        to: toTimestamp,
        sortDirection: 'desc',
      });

      // Transform telemetry data for Excel
      const excelData = allTelemetry.map(t => ({
        'Battery (%)': t.battery,
        'Longitude': t.longitude,
        'Latitude': t.latitude,
        'Last GPS Long': t.last_gps_long,
        'Last GPS Lat': t.last_gps_lat,
        'Last GPS Contact': t.last_gps_contact_time ? new Date(t.last_gps_contact_time).toISOString() : 'N/A',
        'Operation Status': t.operationStatus,
        'Usage Status': t.usageStatus,
        'Timestamp': new Date(t.time).toISOString(),
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 },  // Battery
        { wch: 15 },  // Longitude
        { wch: 15 },  // Latitude
        { wch: 15 },  // Last GPS Long
        { wch: 15 },  // Last GPS Lat
        { wch: 25 },  // Last GPS Contact
        { wch: 15 },  // Operation Status
        { wch: 12 },  // Usage Status
        { wch: 25 },  // Timestamp
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, `Telemetry - ${bikeId.slice(0, 20)}`);
      
      // Generate XLSX file and trigger download
      const fileName = `bike-${bikeId}-telemetry-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      console.log(`✅ Exported ${allTelemetry.length} telemetry records to Excel`);
    } catch (err) {
      console.error('Failed to export telemetry:', err);
      alert('Failed to export telemetry data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [bikeId, telemetryStartDate, telemetryEndDate]);

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

  const handleMapClick = useCallback(() => {
    const location = liveLocation || (telemetry.length > 0 
      ? { longitude: telemetry[0].longitude, latitude: telemetry[0].latitude }
      : null);
    
    if (location) {
      onNavigate('/', [location.longitude, location.latitude]);
    }
  }, [liveLocation, telemetry, onNavigate]);

  // Telemetry filter handlers
  const handleTelemetryStartDateChange = useCallback((date: string) => {
    setTelemetryStartDate(date);
    setTelemetryPage(1); // Reset to first page when filter changes
  }, []);

  const handleTelemetryEndDateChange = useCallback((date: string) => {
    setTelemetryEndDate(date);
    setTelemetryPage(1);
  }, []);

  // Trips filter handlers
  const handleTripsStartDateChange = useCallback((date: string) => {
    setTripsStartDate(date);
    setTripsPage(1);
  }, []);

  const handleTripsEndDateChange = useCallback((date: string) => {
    setTripsEndDate(date);
    setTripsPage(1);
  }, []);

  // Trip selection handler - updates map location (toggle on second click)
  const handleTripSelect = useCallback((tripId: string) => {
    // If clicking the same trip, deselect it and return to current location
    if (selectedTrip === tripId) {
      setSelectedTrip(null);
      setSelectedTripLocation(null);
      return;
    }
    
    setSelectedTrip(tripId);
    
    // Find the selected trip and get its end location
    const trip = trips.find(t => t.id === tripId);
    if (trip && trip.trip_end_long !== null && trip.trip_end_long !== undefined && 
        trip.trip_end_lat !== null && trip.trip_end_lat !== undefined) {
      setSelectedTripLocation({
        longitude: trip.trip_end_long,
        latitude: trip.trip_end_lat,
      });
    } else {
      // Clear selected trip location if no valid coordinates
      setSelectedTripLocation(null);
    }
  }, [trips, selectedTrip]);

  if (loading) {
    return (
      <div className="bike-details-container">
        <Header title="Bike Details" />
        <div className="main-content">
          <Sidebar />
          <div className="content-area" style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading bike details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bike-details-container">
        <Header title="Bike Details" />
        <div className="main-content">
          <Sidebar />
          <div className="content-area" style={{ padding: '20px' }}>
            <div className="error-message" style={{ color: 'red', padding: '20px', background: '#fee', borderRadius: '8px' }}>
              <h3>Error Loading Bike Data</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 16px' }}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="bike-details-container">
        <Header title="Bike Details" />
        <div className="main-content">
          <Sidebar />
          <div className="content-area" style={{ padding: '20px' }}>
            <p>Bike not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bike-details-container">
      <Header title="Bike Details" />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <BikeInfoCard 
            bike={bike} 
            liveBattery={liveBattery}
            formatDate={formatDate} 
            getStatusText={getStatusText} 
          />

          <div className="trips-map-section">
            <TripsTable 
              trips={trips}
              selectedTrip={selectedTrip}
              onTripSelect={handleTripSelect}
              formatDate={formatDate}
              startDate={tripsStartDate}
              endDate={tripsEndDate}
              onStartDateChange={handleTripsStartDateChange}
              onEndDateChange={handleTripsEndDateChange}
              page={tripsPage}
              totalPages={tripsTotalPages}
              total={tripsTotal}
              onPageChange={setTripsPage}
            />
            <BikeMap 
              bike={bike}
              telemetry={telemetry}
              liveLocation={liveLocation}
              selectedTripLocation={selectedTripLocation}
              lastKnownLocation={
                // Find the first trip with valid end location (skip cancelled trips without location)
                (() => {
                  const tripWithLocation = trips.find(
                    t => t.trip_end_long != null && t.trip_end_lat != null
                  );
                  return tripWithLocation 
                    ? { longitude: tripWithLocation.trip_end_long!, latitude: tripWithLocation.trip_end_lat! }
                    : null;
                })()
              }
              onMapClick={handleMapClick}
            />
          </div>

          <TelemetryTable 
            telemetry={telemetry}
            startDate={telemetryStartDate}
            endDate={telemetryEndDate}
            onStartDateChange={handleTelemetryStartDateChange}
            onEndDateChange={handleTelemetryEndDateChange}
            onExportExcel={exportToExcel}
            isExporting={isExporting}
            formatDate={formatDate}
            page={telemetryPage}
            totalPages={telemetryTotalPages}
            total={telemetryTotal}
            onPageChange={setTelemetryPage}
          />
        </div>
      </div>
    </div>
  );
}

export default BikeDetails;
