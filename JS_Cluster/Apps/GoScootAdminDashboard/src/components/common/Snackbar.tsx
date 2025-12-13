import React, { useEffect, useState } from 'react';

interface SnackbarProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'error' | 'success' | 'warning' | 'info';
}

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  isVisible,
  onClose,
  duration = 4000,
  type = 'error'
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      case 'error':
      default: return '#F44336';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'error':
      default: return '❌';
    }
  };

  if (!isVisible && !show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: `translateX(-50%) translateY(${show ? '0' : '100px'})`,
        zIndex: 10000,
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '400px',
        minWidth: '200px',
        opacity: show ? 1 : 0,
        transition: 'all 0.3s ease',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      <span>{getIcon()}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => {
          setShow(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '0',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Snackbar;