

import { useRef, useState, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { useWebSocket } from './hooks/useWebSocket';
import { useBikeMarkers } from './hooks/useBikeMarkers';
import MapStatusIndicator from './components/map/MapStatusIndicator';
import BikeDetailPopup from './components/map/BikeDetailPopup';
import { websocketManager } from './services/websocketService';

/** Mapbox API access token from environment variables */
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || '';

/** Default map center (Saigon center) */
const SAIGON_CENTER: [number, number] = [106.6297, 10.8231];

/** Props for Map component */
export interface MapProps {
  /** Callback to navigate to other pages */
  onNavigate: (page: string, bikeLocation?: [number, number], bikeId?: string) => void;
  /** Optional location to center map on (e.g., when navigating from bike details) */
  centerOnLocation: [number, number] | null;
}

/**
 * Map component
 * Dashboard map showing real-time bike locations via WebSocket
 */
function DashboardMap({ centerOnLocation }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // State: Number of bikes visible in current map viewport
  const [visibleBikeCount, setVisibleBikeCount] = useState(0);
  
  // State: Total number of bikes tracked by the system
  const [totalBikeCount, setTotalBikeCount] = useState(0);
  
  // State: Loading state while map initializes
  const [isLoading, setIsLoading] = useState(true);
  
  // State: Error message if map fails to load
  const [error, setError] = useState<string | null>(null);
  
  // State: WebSocket connection status
  const [wsConnected, setWsConnected] = useState(false);
  
  // State: Currently selected bike for detail popup
  const [selectedBike, setSelectedBike] = useState<BikeUpdate | null>(null);
  
  // State: Search query for location search
  const [searchQuery, setSearchQuery] = useState('');
  
  // State: Search results from Mapbox Geocoding API
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // State: Show/hide search results dropdown
  const [showResults, setShowResults] = useState(false);
  
  // State: Bike ID search query
  const [bikeSearchQuery, setBikeSearchQuery] = useState('');
  
  // State: Bike search error message
  const [bikeSearchError, setBikeSearchError] = useState<string | null>(null);

  /**
   * Handler: When user clicks on a bike marker
   * Opens the detail popup for that bike
   */
  const handleBikeClick = useCallback((bike: BikeUpdate) => {
    setSelectedBike(bike);
  }, []);
  
  /**
   * Handler: Search for locations using Mapbox Geocoding API
   */
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    try {
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

  // Custom hook: Manages bike markers on the map (add, update, remove)
  const { updateMarkers, clearMarkers, getBikeById } = useBikeMarkers(handleBikeClick);

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
   * Effect: Initialize Mapbox map on component mount
   * - Sets up map container with Mapbox GL
   * - Configures map center (either provided location or default Saigon center)
   * - Adds navigation controls (zoom, rotate)
   * - Adds geolocation control (find user's location)
   * - Cleans up map on unmount
   */
  useEffect(() => {
    // Validate map container and token exist
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      setError('Mapbox token is missing');
      setIsLoading(false);
      return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Create new map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11', // Street map style
      center: centerOnLocation || SAIGON_CENTER, // Center on provided location or default
      zoom: centerOnLocation ? 15 : 15, // Zoom to district level - shows streets and neighborhoods clearly
    });

    // Event: Map finished loading
    map.on('load', () => setIsLoading(false));
    
    // Event: Map encountered an error
    map.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setIsLoading(false);
    });

    // Add zoom/rotate controls to top-right corner
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add geolocation control (find my location button)
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true }, // Use GPS for accuracy
        trackUserLocation: true, // Keep tracking as user moves
        showUserHeading: true, // Show direction user is facing
      }),
      'top-right'
    );

    // Store map reference for use in other functions
    mapRef.current = map;

    // Cleanup: Remove markers and destroy map when component unmounts
    return () => {
      clearMarkers();
      map.remove();
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

  // Custom hook: Connect to WebSocket for real-time GPS updates
  useWebSocket(handleBikeUpdate, mapRef.current);

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

      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default DashboardMap;
