import { Hub } from '@trungthao/admin_dashboard_dto';
import React from 'react';


/**
 * Props for HubDetailCard component
 */
interface HubDetailCardProps {
  hub: Hub;                                    // Hub data to display
  bikes: any[];                               // Array of bikes located at this hub
  isLoading: boolean;                         // Loading state while fetching bikes
  onClose: () => void;                        // Callback to close the detail card
  onBikeClick: (bike: any) => void;          // Callback when user clicks on a bike in the list
}

/**
 * HUB DETAIL CARD COMPONENT IMPLEMENTATION
 */
const HubDetailCard: React.FC<HubDetailCardProps> = ({
  hub,
  bikes = [],
  isLoading,
  onClose,
  onBikeClick
}) => {
  /**
   * BIKE CLICK HANDLER
   * 
   * Converts bike data from hub API format to standard Bike format
   * and triggers the bike detail popup. This handles format differences
   * between different API endpoints.
   * 
   * Data Mapping:
   * - Handles multiple possible field names (id/bikeId, batteryLevel/battery)
   * - Provides default values for missing fields
   * - Ensures consistent data format for bike detail popup
   * 
   * @param bike - Raw bike data from hub API (may have different field names)
   */
  const handleBikeClick = (bike: any) => {
    // === DATA FORMAT CONVERSION ===
    // Convert hub API bike format to standard Bike interface
    const bikeData: any = {
      id: bike.id || bike.bikeId,                           // Handle different ID field names
      battery_level: bike.batteryLevel || bike.battery || 0, // Handle different battery field names
      operationStatus: bike.operationStatus || 'unknown',   // Default to unknown if not provided
      usageStatus: bike.usageStatus || 'available',         // Default to available
      lastUpdate: bike.lastUpdate || new Date().toISOString(), // Use current time if not provided
      // Additional required fields with sensible defaults
      model: bike.model || 'Unknown',
      location: bike.location || 'Unknown'
    };
    onBikeClick(bikeData);
  };

  return (
    <div style={{
      position: 'absolute',        // Float over map content
      top: '20px',                // 20px from top of map
      right: '20px',              // 20px from right edge of map
      width: '350px',             // Fixed width for consistent layout
      backgroundColor: 'white',   // Clean white background
      borderRadius: '12px',       // Rounded corners for modern look
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)', // Subtle shadow for depth
      zIndex: 1000,               // Appear above map and other elements
      maxHeight: '80vh',          // Limit height to 80% of viewport
      overflow: 'hidden',         // Hide content that exceeds container
      display: 'flex',            // Flexbox layout for sections
      flexDirection: 'column'     // Stack sections vertically
    }}>
      {/* === HEADER SECTION === */}
      {/* Contains hub name, address, and close button */}
      <div style={{
        padding: '20px',                    // Comfortable padding around content
        borderBottom: '1px solid #eee',     // Separator line below header
        display: 'flex',                    // Horizontal layout
        justifyContent: 'space-between',    // Push content to edges
        alignItems: 'center'                // Vertically center content
      }}>
        {/* === HUB INFORMATION === */}
        {/* Hub name and address display */}
        <div>
          {/* Hub name with fallback to ID if name not available */}
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {hub?.id || `Hub ${hub?.id}`}
          </h3>
          {/* Hub address with fallback message */}
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            {hub?.address || 'No address available'}
          </p>
        </div>
        {/* === CLOSE BUTTON === */}
        {/* Circular close button with hover effects */}
        <button
          onClick={onClose}
          style={{
            background: 'none',             // Transparent background
            border: 'none',                 // Remove default border
            fontSize: '24px',               // Large × symbol
            cursor: 'pointer',              // Show clickable cursor
            color: '#999',                  // Muted gray color
            padding: '0',                   // Remove default padding
            width: '32px',                  // Fixed width for circle
            height: '32px',                 // Fixed height for circle
            display: 'flex',                // Center the × symbol
            alignItems: 'center',           // Vertically center ×
            justifyContent: 'center',       // Horizontally center ×
            borderRadius: '50%'             // Perfect circle shape
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';  // Light gray on hover
            e.currentTarget.style.color = '#333';               // Darker text on hover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'; // Reset background
            e.currentTarget.style.color = '#999';                  // Reset text color
          }}
        >
          ×
        </button>
      </div>

      {/* === HUB STATISTICS SECTION === */}
      {/* Shows current bike count at this hub */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Label for bike count */}
          <span style={{ fontSize: '14px', color: '#666' }}>Current Bikes:</span>
          {/* Actual bike count with emphasis */}
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            {bikes.length}
          </span>
        </div>
      </div>

      {/* === BIKES LIST SECTION === */}
      {/* Scrollable list of all bikes currently at this hub */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* === BIKES LIST HEADER === */}
        {/* Section title with bike count */}
        <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid #eee' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Bikes in Hub ({bikes.length})
          </h4>
        </div>

        {/* === CONDITIONAL CONTENT RENDERING === */}
        {/* Shows different content based on loading state and bike availability */}
        
        {/* === LOADING STATE === */}
        {/* Displays animated spinner while fetching bike data */}
        {isLoading ? (
          <div style={{
            padding: '40px 20px',          // Generous padding for centered content
            textAlign: 'center',           // Center align all content
            color: '#666'                  // Muted text color
          }}>
            {/* Animated loading spinner */}
            <div style={{
              width: '24px',                           // Spinner size
              height: '24px',
              border: '2px solid #f3f3f3',            // Light gray border
              borderTop: '2px solid #2196F3',         // Blue top border for animation
              borderRadius: '50%',                    // Perfect circle
              animation: 'spin 1s linear infinite',   // Continuous rotation
              margin: '0 auto 12px'                   // Center and add bottom margin
            }} />
            Loading bikes...
          </div>
        
        /* === EMPTY STATE === */
        /* Shows friendly message when no bikes are at this hub */
        ) : bikes.length === 0 ? (
          <div style={{
            padding: '40px 20px',          // Generous padding for centered content
            textAlign: 'center',           // Center align all content
            color: '#666'                  // Muted text color
          }}>
            {/* Large bike emoji for visual appeal */}
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚲</div>
            {/* Friendly empty state message */}
            <p style={{ margin: 0, fontSize: '14px' }}>No bikes in this hub</p>
          </div>
        
        /* === BIKES LIST === */
        /* Scrollable list of bikes with details and interactions */
        ) : (
          <div style={{
            flex: 1,                        // Take remaining vertical space
            overflowY: 'auto',             // Enable vertical scrolling for long lists
            padding: '8px 0'               // Vertical padding around bike items
          }}>
            {/* === BIKE ITEMS MAPPING === */}
            {/* Render each bike as a clickable list item */}
            {bikes.map((bike, index) => (
              <div
                key={bike.id || bike.bikeId || index}  // Unique key with fallbacks
                onClick={() => handleBikeClick(bike)}   // Handle bike selection
                style={{
                  padding: '12px 20px',                                                    // Comfortable padding
                  borderBottom: index < bikes.length - 1 ? '1px solid #f0f0f0' : 'none', // Separator except last item
                  cursor: 'pointer',                                                       // Show clickable cursor
                  transition: 'background-color 0.2s'                                     // Smooth hover animation
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}   // Light gray on hover
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} // Reset on leave
              >
                {/* === BIKE ITEM LAYOUT === */}
                {/* Two-column layout: bike info on left, status on right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  {/* === LEFT COLUMN: BIKE INFORMATION === */}
                  <div>
                    {/* Bike ID with emoji icon */}
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                      🚲 {bike.id || bike.bikeId || 'Unknown ID'}
                    </div>
                    {/* Battery level with fallback to 0% */}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Battery: {bike.battery_status || 0}%
                    </div>
                  </div>
                  
                  {/* === RIGHT COLUMN: STATUS BADGE === */}
                  <div style={{ textAlign: 'right' }}>
                    {/* Color-coded status badge */}
                    <div style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      // === DYNAMIC BACKGROUND COLOR === 
                      // Green for available, orange for reserved, gray for unknown
                      backgroundColor:
                        (bike.usageStatus === 'available' || bike.availability === 'available') ? '#e8f5e8' :
                        (bike.usageStatus === 'reserved' || bike.availability === 'reserved') ? '#fff3e0' : '#f5f5f5',
                      // === DYNAMIC TEXT COLOR ===
                      // Matching text colors for good contrast
                      color:
                        (bike.usageStatus === 'available' || bike.availability === 'available') ? '#2e7d32' :
                        (bike.usageStatus === 'reserved' || bike.availability === 'reserved') ? '#f57c00' : '#666',
                      fontWeight: '500'
                    }}>
                      {/* === STATUS TEXT WITH FALLBACK === */}
                      {/* Handle different field names and provide default */}
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

      {/* === CSS ANIMATIONS === */}
      {/* Keyframe animation for loading spinner rotation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }    /* Start at 0 degrees */
            100% { transform: rotate(360deg); } /* Complete full rotation */
          }
        `}
      </style>
    </div>
  );
};

export default HubDetailCard;
