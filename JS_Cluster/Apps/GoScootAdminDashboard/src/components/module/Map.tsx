
// React hooks for component state management and lifecycle
import { useRef, useState, useCallback, useEffect } from 'react';
// Mapbox GL JS library for interactive maps
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Type definitions for bike data structures
import { BikeUpdate, Bike } from '@trungthao/admin_dashboard_dto';



import { useBikeMarkers } from '../../hooks/useBikeMarkers';
import { useHubMarkers } from '../../hooks/useHubMarkers';
import { useMapRealtime } from '../../hooks/useWebSocket';
import BatteryFilter from '../map/BatteryFilter';
import BikeDetailPopup from '../map/BikeDetailPopup';
import DisplayToggle, { DisplayMode } from '../map/DisplayToggle';
import MapStatusIndicator from '../map/MapStatusIndicator';
import HubDetailCard from '../map/HubDetailCard';
import { websocketManager } from '../../services/websocketService';
// Custom hooks for WebSocket connection and map marker management
//import { useWebSocket } from './hooks/useWebSocket';



// Map UI components for displaying information and controls


// Map control components for filtering and display options

// WebSocket service for real-time bike location updates

// API client for fetching bike and hub data from backend

// Error boundary component for handling component errors gracefully


/** 
 * Mapbox API access token from environment variables
 * Required for map rendering and geocoding services
 * Should be set in .env file as VITE_MAPBOX_TOKEN
 */
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoidHJ1bmdsdW9uZ291bWFlMDgwNjk5IiwiYSI6ImNtaG9rbDJ5dDBjMWQya3NlcGxjaHNmMTcifQ.YIh29cJOIa6Ut2NEeoOHQg';

/** 
 * Default map center coordinates (Ho Chi Minh City center)
 * [longitude, latitude] format as required by Mapbox GL JS
 * Used as fallback when no specific location is provided
 */
const SAIGON_CENTER: [number, number] = [106.6297, 10.8231];

/** Props for Map component */
export interface MapProps {
  /** Callback to navigate to other pages */
  onNavigate: (page: string, bikeLocation?: [number, number], bikeId?: string) => void;
  /** Optional location to center map on (e.g., when navigating from bike details) */
  centerOnLocation: [number, number] | null;
}

/**
 * Main Dashboard Map Component
 * 
 * Features:
 * - Real-time bike location tracking via WebSocket
 * - Interactive hub markers with bike listings
 * - Location search with Mapbox Geocoding API
 * - Bike ID search functionality
 * - Battery level filtering
 * - Display mode toggle (bikes/hubs/both)
 * - Detailed popups for bikes and hubs
 * 
 * @param centerOnLocation - Optional coordinates to center map on specific location
 * @param onNavigate - Callback function for navigation to other pages
 */
function DashboardMap({ centerOnLocation }: MapProps) {
  // DOM reference to the map container div element
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Reference to the Mapbox GL JS map instance for direct map manipulation
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // === MAP STATUS STATE ===
  // Number of bikes currently visible within the map viewport bounds
  const [visibleBikeCount, setVisibleBikeCount] = useState(0);
  // Total number of bikes being tracked by the system
  const [totalBikeCount, setTotalBikeCount] = useState(0);
  // Loading state during initial map setup and Mapbox GL initialization
  const [isLoading, setIsLoading] = useState(true);
  // Error message if map fails to load or encounters issues
  const [error, setError] = useState<string | null>(null);
  
  // === WEBSOCKET CONNECTION STATE ===
  // Real-time WebSocket connection status for live bike updates
  const [wsConnected, setWsConnected] = useState(false);
  
  // === BIKE SELECTION STATE ===
  // Currently selected bike for displaying detailed popup information
  const [selectedBike, setSelectedBike] = useState<BikeUpdate | null>(null);
  
  // === LOCATION SEARCH STATE ===
  // User input for location search (addresses, landmarks, etc.)
  const [searchQuery, setSearchQuery] = useState('');
  // Results from Mapbox Geocoding API for location suggestions
  const [searchResults, setSearchResults] = useState<any[]>([]);
  // Controls visibility of the search results dropdown menu
  const [showResults, setShowResults] = useState(false);
  
  // === BIKE ID SEARCH STATE ===
  // User input for searching specific bikes by their unique ID
  const [bikeSearchQuery, setBikeSearchQuery] = useState('');
  // Error message displayed when bike search fails or bike not found
  const [bikeSearchError, setBikeSearchError] = useState<string | null>(null);
  
  // === DISPLAY CONTROL STATE ===
  // Current display mode: 'bikes', 'hubs', or 'both' - controls which markers are visible
  const [displayMode, setDisplayMode] = useState<DisplayMode>('both');
  
  // === HUB INTERACTION STATE ===
  // Currently selected hub for displaying detailed information card
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  // List of bikes located at the currently selected hub
  const [hubBikes, setHubBikes] = useState<any[]>([]);
  // Loading state while fetching bikes for the selected hub
  const [hubBikesLoading, setHubBikesLoading] = useState(false);
  
  // === BATTERY FILTER STATE ===
  // Bikes filtered by battery level criteria (e.g., low battery bikes)
  const [filteredBikes, setFilteredBikes] = useState<Bike[]>([]);
  // Loading state while applying battery level filters
  const [filteredBikesLoading, setFilteredBikesLoading] = useState(false);
  
  // === ERROR HANDLING STATE ===
  // Error message to display in the snackbar notification
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Controls visibility of the error notification snackbar
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);

  /**
   * BIKE INTERACTION HANDLER
   * Triggered when user clicks on a bike marker on the map
   * Opens detailed popup showing bike information (ID, battery, status, etc.)
   * 
   * @param bike - BikeUpdate object containing current bike location and status data
   */
  const handleBikeClick = useCallback((bike: BikeUpdate) => {
    setSelectedBike(bike);
  }, []);
  
  /**
   * LOCATION SEARCH HANDLER
   * Uses Mapbox Geocoding API to search for addresses, landmarks, and places
   * Provides autocomplete suggestions as user types
   * 
   * Features:
   * - Minimum 3 characters required to trigger search
   * - Limits results to 5 suggestions for performance
   * - Handles API errors gracefully
   * 
   * @param query - User input string for location search
   */
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    // Don't search for very short queries to avoid too many API calls
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    try {
      // Call Mapbox Geocoding API for location suggestions
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, []);
  
  /**
   * Handler: When user selects a location from search results
   */
  const handleSelectLocation = useCallback((result: any) => {
    if (!mapRef.current) return;
    
    const [lng, lat] = result.center;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 2000
    });
    
    setSearchQuery(result.place_name);
    setShowResults(false);
  }, []);

  /**
   * Handler: Close the bike detail popup
   */
  const handleClosePopup = useCallback(() => {
    setSelectedBike(null);
  }, []);

  /**
   * HUB INTERACTION HANDLER
   * Triggered when user clicks on a hub/station marker
   * 
   * Functionality:
   * - Opens detailed hub information card
   * - Fetches and displays all bikes currently at this hub
   * - Shows loading state while fetching bike data
   * - Handles different API response formats for compatibility
   * - Displays error messages if hub data cannot be loaded
   * 
   * @param hub - Hub object containing hub ID, location, and metadata
   */
  const handleHubClick = useCallback(async (hub: Hub) => {
    setSelectedHub(hub);
    setHubBikesLoading(true);
    
    try {
      // Fetch bikes located at this specific hub from the backend API
      const response = await hubApi.getBikesInHub(hub.id);
      
      // Handle different response formats for backward compatibility
      if (response && response.bikes) {
        // Standard paginated response format
        setHubBikes(response.bikes);
      } else if (Array.isArray(response)) {
        // Direct array response format
        setHubBikes(response);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setHubBikes([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch bikes in hub:', error);
      setHubBikes([]);
      // Show user-friendly error message in snackbar notification
      setErrorMessage(`Failed to load bikes for hub: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowErrorSnackbar(true);
    } finally {
      setHubBikesLoading(false);
    }
  }, []);

  // === CUSTOM HOOKS FOR MAP MARKER MANAGEMENT ===
  
  /**
   * BIKE MARKERS HOOK
   * Manages all bike markers on the map including:
   * - Adding new bike markers when bikes come online
   * - Updating existing markers when bikes move or change status
   * - Removing markers when bikes go offline
   * - Controlling marker visibility based on display mode
   * - Finding specific bikes by ID for search functionality
   */
  const { updateMarkers, clearMarkers, getBikeById, getAllBikes, setBikeMarkersVisible } = useBikeMarkers(handleBikeClick);
  
  /**
   * HUB MARKERS HOOK
   * Manages all hub/station markers on the map including:
   * - Displaying hub locations with custom icons
   * - Updating hub information and bike counts
   * - Controlling hub marker visibility
   * - Handling hub click interactions
   */
  const { updateHubMarkers, clearHubMarkers, setHubMarkersVisible } = useHubMarkers(handleHubClick);

  /**
   * Handler: Search for a bike by ID
   * Requests bike from server via WebSocket and moves camera to it
   */
  const handleBikeSearch = useCallback(async () => {
    if (!bikeSearchQuery.trim()) {
      setBikeSearchError('Please enter a bike ID');
      return;
    }

    setBikeSearchError('Searching...');
    const searchId = bikeSearchQuery.trim();
    console.log('🔍 Searching for bike ID:', searchId);
    
    // First, check if bike is already in memory
    const existingBike = getBikeById(searchId);
    console.log('🔍 getBikeById result:', existingBike);
    
    if (existingBike && mapRef.current) {
      console.log('✅ Bike found in memory:', existingBike);
      // Bike found in memory - move camera to it
      mapRef.current.flyTo({
        center: [existingBike.longitude, existingBike.latitude],
        zoom: 16,
        duration: 2000
      });
      
      // Open bike detail popup
      setSelectedBike(existingBike);
      setBikeSearchQuery('');
      setBikeSearchError(null);
      return;
    }

    console.log('📡 Bike not in memory, requesting from server via WebSocket...');
    
    // Request bike from server via WebSocket
    websocketManager.requestBike(searchId);
    
    // Wait for WebSocket to send the bike data
    // Set a timeout to show error if bike doesn't arrive
    const timeoutId = setTimeout(() => {
      // Check again if bike arrived
      const bike = getBikeById(searchId);
      if (!bike) {
        setBikeSearchError('Bike not found. Please check the bike ID and try again.');
      }
    }, 5000); // 5 second timeout
    
    // Store timeout ID to clear it if bike arrives sooner
    (window as any).__bikeSearchTimeout = timeoutId;
    
    // Clear search query
    setBikeSearchQuery('');
  }, [bikeSearchQuery, getBikeById]);

  /**
   * Handler: Close hub detail card
   */
  const handleCloseHubCard = useCallback(() => {
    setSelectedHub(null);
    setHubBikes([]);
  }, []);

  /**
   * Handler: Display mode change
   */
  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    
    // Update marker visibility based on mode
    const showBikes = mode === 'both' || mode === 'bikes';
    const showHubs = mode === 'both' || mode === 'hubs';
    
    setBikeMarkersVisible(showBikes);
    setHubMarkersVisible(showHubs);
  }, [setBikeMarkersVisible, setHubMarkersVisible]);

  /**
   * Handler: Battery filter
   * Filters bikes from WebSocket data instead of making API calls
   */
  const handleBatteryFilter = useCallback(async (maxBattery: number) => {
    setFilteredBikesLoading(true);
    
    try {
      // Get all bikes from WebSocket data (much faster than API calls)
      const allWebSocketBikes = getAllBikes();
      
      console.log(`🔋 Filtering ${allWebSocketBikes.length} bikes from WebSocket data with battery ≤ ${maxBattery}%`);
      
      // Filter bikes by battery level
      const filtered = allWebSocketBikes.filter(bike => 
        (bike.battery_status ?? 0) <= maxBattery
      );
      
      console.log(`🔋 Found ${filtered.length} bikes with battery ≤ ${maxBattery}%`);
      
      // Convert BikeUpdate to Bike format for the filter component
      const bikesForFilter: Bike[] = filtered.map(bikeUpdate => ({
        id: bikeUpdate.id,
        name: bikeUpdate.id, // Use ID as name if no name field
        battery_status: bikeUpdate.battery_status,
        current_hub: bikeUpdate.currentHub || null,
        // Add other required Bike fields with defaults
        longitude: bikeUpdate.longitude,
        latitude: bikeUpdate.latitude,
        isCrashed: bikeUpdate.isCrashed,
        isOutOfBound: bikeUpdate.isOutOfBound,
        isToppled: bikeUpdate.isToppled,
        batteryIsLow: bikeUpdate.batteryIsLow,
        usageStatus: bikeUpdate.usageStatus,
        created_at: Date.now(),
        last_modification_date: Date.now(),
        deleted: false
      }));
      
      setFilteredBikes(bikesForFilter);
    } catch (error) {
      console.error('Failed to filter bikes from WebSocket data:', error);
      setFilteredBikes([]);
    } finally {
      setFilteredBikesLoading(false);
    }
  }, [getAllBikes]);

  /**
   * Handler: Hub update from WebSocket
   */
  const handleHubUpdate = useCallback((hubs: Hub[]) => {
    if (!mapRef.current) return;
    updateHubMarkers(hubs, mapRef.current);
  }, [updateHubMarkers]);

  /**
   * Handler: Error from WebSocket
   */
  const handleWebSocketError = useCallback((error: string) => {
    setErrorMessage(error);
    setShowErrorSnackbar(true);
  }, []);

  /**
   * Handler: Close error snackbar
   */
  const handleCloseErrorSnackbar = useCallback(() => {
    setShowErrorSnackbar(false);
    setErrorMessage(null);
  }, []);

  /**
   * Handler: Handle bike click from different sources
   * Converts Bike to BikeUpdate format if needed
   */
  const handleBikeClickFromList = useCallback((bike: Bike | BikeUpdate) => {
    // Check if it's already a BikeUpdate
    if ('longitude' in bike && 'latitude' in bike) {
      setSelectedBike(bike as BikeUpdate);
    } else {
      // Try to get the BikeUpdate version from memory
      const bikeUpdate = getBikeById(bike.id);
      if (bikeUpdate) {
        setSelectedBike(bikeUpdate);
      } else {
        // Request the bike via WebSocket if not in memory
        websocketManager.requestBike(bike.id);
      }
    }
  }, [getBikeById]);

  /**
   * MAP INITIALIZATION EFFECT
   * 
   * This is the core map setup that runs once when the component mounts.
   * It creates and configures the Mapbox GL JS map instance with all necessary
   * controls and event handlers.
   * 
   * Setup Process:
   * 1. Validates required dependencies (DOM container, API token)
   * 2. Creates Mapbox map instance with street style
   * 3. Sets initial center and zoom level
   * 4. Adds navigation controls (zoom in/out, rotate, compass)
   * 5. Adds geolocation control (find user's current location)
   * 6. Sets up error handling for map loading failures
   * 7. Stores map reference for use by other components
   * 
   * Cleanup:
   * - Removes all markers when component unmounts
   * - Destroys map instance to prevent memory leaks
   */
  useEffect(() => {
    // === VALIDATION ===
    // Ensure DOM container exists and API token is available
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      setError('Mapbox token is missing');
      setIsLoading(false);
      return;
    }

    // === MAP CONFIGURATION ===
    // Set global Mapbox access token for API requests
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Create new interactive map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,           // DOM element to render map in
      style: 'mapbox://styles/mapbox/streets-v11',  // Street map style with roads and labels
      center: centerOnLocation || SAIGON_CENTER,    // Initial map center coordinates
      zoom: centerOnLocation ? 15 : 15,             // Zoom level (15 = neighborhood level detail)
    });

    // === EVENT HANDLERS ===
    // Map finished loading all tiles and styles
    //map.on('load', () => setIsLoading(false));
    
    // Map encountered an error during loading or operation
    map.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setIsLoading(false);
    });

    // === MAP CONTROLS ===
    // Add zoom in/out, rotate, and compass controls to top-right corner
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add "Find My Location" button with high-accuracy GPS tracking
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true }, // Use GPS for precise location
        trackUserLocation: true,                        // Continue tracking as user moves
        showUserHeading: true,                          // Show direction user is facing
      }),
      'top-right'
    );

    // === REFERENCE STORAGE ===
    // Store map instance for access by other components and hooks
    mapRef.current = map;

    // === CLEANUP FUNCTION ===
    // Runs when component unmounts to prevent memory leaks
    return () => {
      clearMarkers();     // Remove all bike markers
      clearHubMarkers();  // Remove all hub markers
      map.remove();       // Destroy map instance and free resources
    };
  }, [centerOnLocation, clearMarkers]);

  /**
   * Handler: Process bike updates from WebSocket
   * Called whenever new bike location data arrives
   * Updates markers on map and bike counts
   */
  const handleBikeUpdate = useCallback((bikes: BikeUpdate[]) => {
    console.log('🎯 handleBikeUpdate called with', bikes.length, 'bikes');
    
    // Guard: Don't process if map isn't ready yet
    if (!mapRef.current) {
      console.warn('⚠️ Map not ready yet');
      return;
    }

    console.log(`📍 Received ${bikes.length} bikes from WebSocket`);

    // Update markers on map and get counts
    const counts = updateMarkers(bikes, mapRef.current);
    setTotalBikeCount(counts.totalCount); // Total bikes in system
    setVisibleBikeCount(counts.visibleCount); // Bikes visible in current viewport
    
    console.log(`🗺️ Total bikes: ${counts.totalCount}, Visible: ${counts.visibleCount}`);
    
    // Check if we received a bike we were searching for
    if (bikes.length === 1 && bikeSearchError === 'Searching...') {
      const bike = bikes[0];
      console.log('✅ Received searched bike:', bike.id);
      
      // Clear any pending timeout
      if ((window as any).__bikeSearchTimeout) {
        clearTimeout((window as any).__bikeSearchTimeout);
        (window as any).__bikeSearchTimeout = null;
      }
      
      // Move camera to bike location
      mapRef.current.flyTo({
        center: [bike.longitude, bike.latitude],
        zoom: 16,
        duration: 2000
      });
      
      // Open bike detail popup
      setSelectedBike(bike);
      setBikeSearchError(null);
    }
  }, [updateMarkers, bikeSearchError]);

  // === REAL-TIME DATA CONNECTION ===
  /**
   * WEBSOCKET INTEGRATION
   * Establishes real-time connection to receive live bike location updates
   * 
   * Handles:
   * - Bike location updates (GPS coordinates, battery status, availability)
   * - Hub information updates (bike counts, status changes)
   * - Connection errors and reconnection attempts
   * - Automatic marker updates when new data arrives
   */
useMapRealtime(
  handleBikeUpdate,
  handleHubUpdate,
  handleWebSocketError, 
  mapRef.current,
  () => setIsLoading(false),
);

  /**
   * Effect: Poll WebSocket connection status
   * Updates the wsConnected state based on actual WebSocket connection
   */
  useEffect(() => {
    const checkConnection = () => {
      const connected = websocketManager.isConnected();
      setWsConnected(connected);
    };

    // Check immediately
    checkConnection();

    // Check every second
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="error-container">
        <h2>Missing Mapbox Token</h2>
        <p>Please add your Mapbox token to the .env file</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <p>{error}</p>
        </div>
      )}

      {/* Search Boxes Container */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '500px',
        display: 'flex',
        gap: '12px'
      }}>
        {/* Bike ID Search */}
        <div style={{ flex: '0 0 200px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={bikeSearchQuery}
              onChange={(e) => {
                setBikeSearchQuery(e.target.value);
                setBikeSearchError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleBikeSearch()}
              placeholder="Enter Bike ID..."
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: '14px',
                border: bikeSearchError ? '1px solid #F44336' : '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                outline: 'none'
              }}
            />
            <button
              onClick={handleBikeSearch}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
            >
              🔍
            </button>
          </div>
          {bikeSearchError && (
            <div style={{
              marginTop: '4px',
              fontSize: '12px',
              color: '#F44336',
              backgroundColor: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {bikeSearchError}
            </div>
          )}
        </div>

        {/* Location Search */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search location..."
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              outline: 'none'
            }}
          />
          
          {showResults && searchResults.length > 0 && (
            <div style={{
              marginTop: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectLocation(result)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: '500' }}>{result.text}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {result.place_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DisplayToggle
        displayMode={displayMode}
        onDisplayModeChange={handleDisplayModeChange}
      />

      <BatteryFilter
        onBatteryFilter={handleBatteryFilter}
        onBikeClick={handleBikeClickFromList}
        filteredBikes={filteredBikes}
        isLoading={filteredBikesLoading}
        getBikeById={getBikeById}
        mapRef={mapRef}
      />

      <MapStatusIndicator 
        wsConnected={wsConnected}
        totalBikeCount={totalBikeCount}
        visibleBikeCount={visibleBikeCount}
      />

      {selectedBike && (
        <BikeDetailPopup
          bike={selectedBike}
          onClose={handleClosePopup}
        />
      )}

      {/* {selectedHub && (
        <ErrorBoundary fallback={
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '350px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 1000,
            padding: '20px'
          }}>
            <h3>Hub Error</h3>
            <p>Failed to load hub details. Please try again.</p>
            <button 
              onClick={handleCloseHubCard}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        }>
          <HubDetailCard
            hub={selectedHub}
            bikes={hubBikes}
            isLoading={hubBikesLoading}
            onClose={handleCloseHubCard}
            onBikeClick={handleBikeClickFromList}
          />
        </ErrorBoundary>
      )} */}

      

      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default DashboardMap;
