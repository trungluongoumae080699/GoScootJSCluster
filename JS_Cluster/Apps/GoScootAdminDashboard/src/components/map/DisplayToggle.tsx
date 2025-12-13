import React from 'react';

export type DisplayMode = 'both' | 'bikes' | 'hubs';

interface DisplayToggleProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

const DisplayToggle: React.FC<DisplayToggleProps> = ({
  displayMode,
  onDisplayModeChange
}) => {
  const options = [
    { value: 'both' as DisplayMode, label: 'Both', icon: '🚲🏢' },
    { value: 'bikes' as DisplayMode, label: 'Bikes Only', icon: '🚲' },
    { value: 'hubs' as DisplayMode, label: 'Hubs Only', icon: '🏢' }
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '4px'
    }}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onDisplayModeChange(option.value)}
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '500',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: displayMode === option.value ? '#2196F3' : 'transparent',
            color: displayMode === option.value ? 'white' : '#666',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            if (displayMode !== option.value) {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }
          }}
          onMouseLeave={(e) => {
            if (displayMode !== option.value) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default DisplayToggle;