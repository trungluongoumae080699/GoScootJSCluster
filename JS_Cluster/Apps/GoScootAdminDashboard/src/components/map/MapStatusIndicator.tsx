/**
 * MapStatusIndicator Component
 * 
 * Displays real-time status information in top-left corner of map:
 * - WebSocket connection status (green dot = connected, red = disconnected)
 * - Total number of bikes online in the system
 * - Number of bikes visible in current map viewport
 * 
 * This helps users understand:
 * 1. If they're receiving live updates
 * 2. How many bikes are being tracked
 * 3. How many bikes they can see on their current map view
 */

interface MapStatusIndicatorProps {
  /** WebSocket connection status */
  wsConnected: boolean;
  /** Total number of bikes tracked in the system */
  totalBikeCount: number;
  /** Number of bikes visible in current map viewport */
  visibleBikeCount: number;
}

function MapStatusIndicator({ wsConnected, totalBikeCount, visibleBikeCount }: MapStatusIndicatorProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000, // Ensure it appears above map
        background: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontWeight: 'bold',
      }}
    >
      {/* Connection Status Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Status Indicator Dot: Green = connected, Red = disconnected */}
        <span style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          background: wsConnected ? '#4CAF50' : '#F44336', // Green or Red
          display: 'inline-block'
        }} />
        <span>{wsConnected ? 'Connected' : 'Connecting...'}</span>
      </div>
      
      {/* Total Bikes Count */}
      <div style={{ marginTop: '5px' }}>
        🚲 {totalBikeCount} Bikes Online
      </div>
      
      {/* Visible Bikes Count (in current viewport) */}
      <div style={{ marginTop: '2px', fontSize: '0.85em', color: '#666' }}>
        ({visibleBikeCount} visible in viewport)
      </div>
    </div>
  );
}

export default MapStatusIndicator;
