import React, { useEffect, useState } from 'react';

interface BikeHubProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const BikeHub: React.FC<BikeHubProps> = ({ 
  message, 
  type = 'error', 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'error': return '#F44336';
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#F44336';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error': return '❌';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❌';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '400px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      <span>{getIcon()}</span>
      <span>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
          marginLeft: '8px',
          padding: '0',
          opacity: 0.8
        }}
      >
        ×
      </button>
    </div>
  );
};

export default BikeHub;