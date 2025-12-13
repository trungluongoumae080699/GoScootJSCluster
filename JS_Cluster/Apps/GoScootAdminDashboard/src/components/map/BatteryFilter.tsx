import React, { useState, useCallback } from 'react';
import { Bike } from '@trungthao/admin_dashboard_dto';
import { websocketManager } from '../../services/websocketService';

interface BatteryFilterProps {
  onBatteryFilter: (maxBattery: number) => void;
  onBikeClick: (bike: Bike) => void;
  filteredBikes: Bike[];
  isLoading: boolean;
  getBikeById: (bikeId: string) => any; // Function to check if bike is already fetched
}

const BatteryFilter: React.FC<BatteryFilterProps> = ({
  onBatteryFilter,
  onBikeClick,
  filteredBikes,
  isLoading,
  getBikeById
}) => {
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [showResults, setShowResults] = useState(false);

  // Debug: Log when filteredBikes changes
  React.useEffect(() => {
    console.log('🎚️ BatteryFilter: filteredBikes updated:', filteredBikes);
    console.log('🎚️ BatteryFilter: isLoading:', isLoading);
    console.log('🎚️ BatteryFilter: showResults:', showResults);
  }, [filteredBikes, isLoading, showResults]);

  // Show results when API call completes (loading finishes)
  React.useEffect(() => {
    if (!isLoading && filteredBikes.length >= 0) {
      console.log('🎚️ BatteryFilter: API call completed, showing results');
      setShowResults(true);
    }
  }, [isLoading, filteredBikes]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBatteryLevel(parseInt(e.target.value));
  }, []);

  const handleSliderMouseUp = useCallback(() => {
    console.log('🎚️ BatteryFilter: Slider released at', batteryLevel);
    onBatteryFilter(batteryLevel);
    // Don't show results immediately - wait for API response
    // setShowResults(true); // Removed this line
  }, [batteryLevel, onBatteryFilter]);

  const handleBikeItemClick = useCallback((bike: Bike) => {
    // Check if bike is already fetched
    const existingBike = getBikeById(bike.id);
    
    if (!existingBike) {
      // Bike not fetched, request it via WebSocket
      websocketManager.requestBike(bike.id);
    } else {
      // Bike already fetched, show it
      onBikeClick(existingBike);
    }
    
    setShowResults(false);
  }, [onBikeClick, getBikeById]);

  const getBatteryColor = (battery: number | null | undefined) => {
    if (!battery) return '#9E9E9E';
    if (battery > 60) return '#4CAF50';
    if (battery > 30) return '#FF9800';
    return '#F44336';
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