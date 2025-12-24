// Development Tools for Debugging
// These utilities help with debugging during development

import type { Bike } from '@goscoot/admin-dashboard-dto';

/**
 * Logs bike data in a formatted way
 */
export function logBikeData(bike: Bike, context?: string) {
  const prefix = context ? `[${context}]` : '[Bike Data]';
  console.log(`${prefix}`, {
    id: bike.id,
    name: bike.name,
    status: bike.status,
    battery: bike.battery,
    location: bike.location,
    lastUpdate: bike.lastUpdate
  });
}

/**
 * Logs MQTT message data
 */
export function logMqttMessage(topic: string, message: any) {
  console.log('[MQTT Message]', {
    topic,
    message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs WebSocket events
 */
export function logWebSocketEvent(event: string, data?: any) {
  console.log('[WebSocket]', {
    event,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs API calls
 */
export function logApiCall(method: string, url: string, data?: any) {
  console.log('[API Call]', {
    method,
    url,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs API responses
 */
export function logApiResponse(url: string, status: number, data?: any) {
  console.log('[API Response]', {
    url,
    status,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs errors with context
 */
export function logError(context: string, error: any) {
  console.error(`[Error - ${context}]`, {
    message: error.message,
    stack: error.stack,
    error,
    timestamp: new Date().toISOString()
  });
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
    console.log(`[Performance] ${label} - Started`);
  }

  end() {
    const duration = performance.now() - this.startTime;
    console.log(`[Performance] ${this.label} - Completed in ${duration.toFixed(2)}ms`);
    return duration;
  }
}
