import React from 'react';
import { Bike } from '@trungthao/admin_dashboard_dto';
import { Hub } from '../../services/apiClient';

interface HubDetailCardProps {
  hub: Hub;
  bikes: any[];
  isLoading: boolean;
  onClose: () => void;
  onBikeClick: (bike: Bike) => void;
}

const HubDetailCard: React.FC<HubDetailCardProps> = ({
  hub,
  bikes = [],
  isLoading,
  onClose,
  onBikeClick
}) => {
  const handleBikeClick = (bike: any) => {
    // Convert to Bike format if needed
    const bikeData: Bike = {
      id: bike.id || bike.bikeId,
      batteryLevel: bike.batteryLevel || bike.battery || 0,
      operationStatus: bike.operationStatus || 'unknown',
      usageStatus: bike.usageStatus || 'available',
      lastUpdate: bike.lastUpdate || new Date().toISOString(),
      // Add other required Bike properties with defaults
      model: bike.model || 'Unknown',
      location: bike.location || 'Unknown'
    };
    onBikeClick(bikeData);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '350px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      zIndex: 1000,
      maxHeight: '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {hub?.name || `Hub ${hub?.id}`}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            {hub?.address || 'No address available'}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999',
            padding: '0',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            e.currentTarget.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#999';
          }}
        >
          ×
        </button>
      </div>

      {/* Hub Info */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Current Bikes:</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            {bikes.length}
          </span>
        </div>
      </div>

      {/* Bikes List */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid #eee' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Bikes in Hub ({bikes.length})
          </h4>
        </div>

        {isLoading ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #2196F3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }} />
            Loading bikes...
          </div>
        ) : bikes.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚲</div>
            <p style={{ margin: 0, fontSize: '14px' }}>No bikes in this hub</p>
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0'
          }}>
            {bikes.map((bike, index) => (
              <div
                key={bike.id || bike.bikeId || index}
                onClick={() => handleBikeClick(bike)}
                style={{
                  padding: '12px 20px',
                  borderBottom: index < bikes.length - 1 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                      🚲 {bike.id || bike.bikeId || 'Unknown ID'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Battery: {bike.batteryLevel || bike.battery || 0}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor:
                        (bike.usageStatus === 'available' || bike.availability === 'available') ? '#e8f5e8' :
                        (bike.usageStatus === 'reserved' || bike.availability === 'reserved') ? '#fff3e0' : '#f5f5f5',
                      color:
                        (bike.usageStatus === 'available' || bike.availability === 'available') ? '#2e7d32' :
                        (bike.usageStatus === 'reserved' || bike.availability === 'reserved') ? '#f57c00' : '#666',
                      fontWeight: '500'
                    }}>
                      {(bike.usageStatus === 'available' || bike.availability === 'available') ? 'Available' :
                       (bike.usageStatus === 'reserved' || bike.availability === 'reserved') ? 'Reserved' : 'Available'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default HubDetailCard;