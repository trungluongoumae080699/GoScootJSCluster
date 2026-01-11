
import React, { useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Bike } from '@trungthao/admin_dashboard_dto';
import { websocketManager } from '../../services/websocketService';

/**
 * COMPONENT PROPS INTERFACE
 * @param onBatteryFilter - Callback function called with filtered bike array
 * @param onBikeClick - Callback when user clicks on a bike in the filtered list
 * @param filteredBikes - Array of bikes matching current battery filter criteria
 * @param isLoading - Loading state while fetching filtered bikes from API
 * @param getBikeById - Function to check if bike data is already available in memory
 * @param mapRef - Reference to the Mapbox map instance for navigation
 */
interface BatteryFilterProps {
  onBatteryFilter: (maxBattery: number) => void;
  onBikeClick: (bike: Bike) => void;
  filteredBikes: Bike[];
  isLoading: boolean;
  getBikeById: (bikeId: string) => any; // Function to check if bike is already fetched
  mapRef: React.RefObject<mapboxgl.Map | null>; // Map reference for navigation
}

/**
 * BATTERY FILTER COMPONENT IMPLEMENTATION
 * 
 * Provides range-based filtering for bike battery levels with
 * minimum and maximum battery percentage controls.
 */
const BatteryFilter: React.FC<BatteryFilterProps> = ({
  onBatteryFilter,
  onBikeClick,
  filteredBikes,
  isLoading,
  getBikeById,
  mapRef
}) => {
  /**
   * COMPONENT STATE
   * Tracks the current battery level threshold and results visibility
   */
  const [batteryLevel, setBatteryLevel] = useState(100);    // Maximum battery percentage (0-100)
  const [showResults, setShowResults] = useState(false);    // Controls visibility of filtered results



  /**
   * RESULTS VISIBILITY EFFECT
   * Automatically shows results when API call completes successfully
   * This ensures users see the filtered results after the loading finishes
   */
  React.useEffect(() => {
    if (!isLoading && filteredBikes.length >= 0) {
      setShowResults(true);
    }
  }, [isLoading, filteredBikes]);

  /**
   * SLIDER CHANGE HANDLER
   * 
   * Updates the battery level threshold as user drags the slider.
   * This provides real-time visual feedback but doesn't trigger
   * the API call until the user releases the slider.
   * 
   * @param e - Input change event from range slider
   */
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBatteryLevel(parseInt(e.target.value));
  }, []);

  /**
   * SLIDER RELEASE HANDLER
   * 
   * Triggers the battery filter API call when user releases the slider.
   * This prevents excessive API calls while dragging and only filters
   * when the user has finished selecting their desired threshold.
   * 
   * Process:
   * 1. Call the parent component's filter function with new threshold
   * 2. Wait for API response before showing results (handled by useEffect)
   */
  const handleSliderMouseUp = useCallback(() => {
    onBatteryFilter(batteryLevel);
  }, [batteryLevel, onBatteryFilter]);

  /**
   * BIKE ITEM CLICK HANDLER
   * 
   * Handles user clicks on individual bikes in the filtered results list.
   * Now includes map navigation to the bike's location.
   * 
   * Process:
   * 1. Check if bike data is already available in memory
   * 2. If available, navigate map to bike location and show bike details popup
   * 3. If not available, request bike data via WebSocket
   * 4. Hide the results panel after interaction
   * 
   * @param bike - Bike object from filtered results list
   */
  const handleBikeItemClick = useCallback((bike: Bike) => {
    // Check if bike is already fetched
    const existingBike = getBikeById(bike.id);

    if (mapRef.current && bike.longitude && bike.latitude) {
      mapRef.current.flyTo({
        center: [bike.longitude, bike.latitude],
        zoom: 15, // Zoom in to see the bike clearly
        duration: 2000 // 2 second smooth animation
      });
    } else {
      websocketManager.requestBike(bike.id)
    }

    // Hide the filter results panel
    setShowResults(false);
  }, [onBikeClick, getBikeById, mapRef]);

  /**
   * BATTERY COLOR HELPER FUNCTION
   * 
   * Returns appropriate color for battery level indicators based on charge level.
   * Uses a traffic light color scheme for intuitive understanding:
   * 
   * Color Mapping:
   * - Green (60-100%): Good battery level, bike ready for use
   * - Orange (30-60%): Medium battery level, may need charging soon
   * - Red (0-30%): Low battery level, needs immediate charging
   * - Gray (null/undefined): Unknown battery status
   * 
   * @param battery - Battery percentage (0-100) or null/undefined
   * @returns Hex color code string for the battery indicator
   */
  const getBatteryColor = (battery: number | null | undefined) => {
    if (!battery) return '#9E9E9E';    // Gray for unknown/missing data
    if (battery > 60) return '#4CAF50'; // Green for good battery
    if (battery > 30) return '#FF9800'; // Orange for medium battery
    return '#F44336';                   // Red for low battery
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minWidth: '250px'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '8px',
          color: '#333'
        }}>
          Max Battery Level: {batteryLevel}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={batteryLevel}
          onChange={handleSliderChange}
          onMouseUp={handleSliderMouseUp}
          onTouchEnd={handleSliderMouseUp}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: `linear-gradient(to right, #F44336 0%, #FF9800 50%, #4CAF50 100%)`,
            outline: 'none',
            cursor: 'pointer'
          }}
        />
      </div>

      {showResults && (
        <div style={{
          borderTop: '1px solid #eee',
          paddingTop: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>
              {isLoading ? 'Loading...' : `${filteredBikes.length} bikes found`}
            </span>
            <button
              onClick={() => setShowResults(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#666',
                padding: '0'
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #eee',
            borderRadius: '4px'
          }}>
            {filteredBikes.length === 0 && !isLoading ? (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                color: '#666',
                fontSize: '12px'
              }}>
                No bikes found with battery ≤ {batteryLevel}%
              </div>
            ) : (
              filteredBikes.map((bike) => (
                <div
                  key={bike.id}
                  onClick={() => handleBikeItemClick(bike)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{bike.name || bike.id}</div>
                    <div style={{ color: '#666', fontSize: '10px' }}>
                      Hub: {bike.current_hub || 'None'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getBatteryColor(bike.battery_status)
                      }}
                    />
                    <span style={{ fontSize: '10px', fontWeight: '500' }}>
                      {bike.battery_status || 0}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatteryFilter;
