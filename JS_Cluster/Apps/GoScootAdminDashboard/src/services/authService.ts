/**
 * Authentication Service
 * Handles secure storage of session credentials and MQTT password
 * 
 * Security approach:
 * - Session ID: Stored in sessionStorage (cleared when browser closes)
 * - MQTT Password: Stored in memory only (most secure, not persisted)
 */

import type {
  Request_DashboardLogInDTO,
  Response_DashboardLogInDTO,
  DashboardStaff,
} from '@trungthao/admin_dashboard_dto';

/** Storage keys */
const SESSION_KEY = 'goscoot_session_id';
const STAFF_PROFILE_KEY = 'goscoot_staff_profile';

/** 
 * Get the API base URL - in development, use relative path for Vite proxy
 * The proxy in vite.config.ts handles forwarding to the actual ngrok server
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env.VITE_API_BASE_URL || 'https://still-simply-katydid.ngrok.app/GoScoot/Server';
  
  // In development, extract just the path for the Vite proxy to work
  if ((import.meta as any).env.DEV) {
    try {
      const url = new URL(envUrl);
      return url.pathname; // Returns '/GoScoot/Server'
    } catch {
      return envUrl;
    }
  }
  
  return envUrl;
}

const API_BASE_URL = getApiBaseUrl();

/**
 * In-memory storage for sensitive MQTT credentials
 * This is intentionally NOT persisted to localStorage/sessionStorage for security
 */
let mqttPassword: string | null = null;

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  sessionId: string | null;
  staffProfile: DashboardStaff | null;
  mqttPassword: string | null;
}

/**
 * Get the current session ID from storage
 */
export function getSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Store session ID in session storage
 */
export function setSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_KEY, sessionId);
}

/**
 * Get the MQTT password (stored in memory only)
 */
export function getMqttPassword(): string | null {
  return mqttPassword;
}

/**
 * Store MQTT password in memory (not persisted for security)
 */
export function setMqttPassword(password: string | null): void {
  mqttPassword = password;
}

/**
 * Get stored staff profile
 */
export function getStaffProfile(): DashboardStaff | null {
  const stored = sessionStorage.getItem(STAFF_PROFILE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Store staff profile
 */
export function setStaffProfile(profile: DashboardStaff): void {
  sessionStorage.setItem(STAFF_PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(STAFF_PROFILE_KEY);
  mqttPassword = null;
}

/**
 * Get current authentication state
 */
export function getAuthState(): AuthState {
  const sessionId = getSessionId();
  return {
    isAuthenticated: !!sessionId,
    sessionId,
    staffProfile: getStaffProfile(),
    mqttPassword: getMqttPassword(),
  };
}

/**
 * Store all credentials from login response
 */
function storeCredentials(response: Response_DashboardLogInDTO): void {
  setSessionId(response.sessionId);
  setStaffProfile(response.staffProfile);
  if (response.mqtt_password) {
    setMqttPassword(response.mqtt_password);
  }
}

/**
 * Sign in with email and password
 * POST /dashboard/auth/signIn
 */
export async function signIn(credentials: Request_DashboardLogInDTO): Promise<Response_DashboardLogInDTO> {
  const response = await fetch(`${API_BASE_URL}/dashboard/auth/signIn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Required for ngrok tunnels
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Sign in failed: ${response.status}`);
  }

  const data: Response_DashboardLogInDTO = await response.json();
  
  // Store credentials securely
  storeCredentials(data);
  return data;
}

/**
 * Formless sign in - restore session if user has previously logged in
 * GET /dashboard/auth/signIn/session
 * 
 * This should be called on app load to check if the user has a valid session
 */
export async function formlessSignIn(): Promise<Response_DashboardLogInDTO | null> {
  const sessionId = getSessionId();
  
  if (!sessionId) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/auth/signIn/session`, {
      method: 'GET',
      headers: {
        'authorization': sessionId,
        'ngrok-skip-browser-warning': 'true', // Required for ngrok tunnels
      },
    });

    if (!response.ok) {
      // Session is invalid or expired
      if (response.status === 401) {
        console.log('⚠️ Session expired, clearing stored credentials');
        clearAuth();
        return null;
      }
      throw new Error(`Formless sign in failed: ${response.status}`);
    }

    const data: Response_DashboardLogInDTO = await response.json();
    
    // Update stored credentials (session ID might be refreshed)
    storeCredentials(data);

    return data;
  } catch (error) {
    // Clear invalid session on error
    clearAuth();
    return null;
  }
}

/**
 * Sign out - clear all stored credentials
 */
export async function signOut(): Promise<void> {
  const sessionId = getSessionId();
  
  // Try to invalidate session on server (optional, fail silently)
  if (sessionId) {
    try {
      await fetch(`${API_BASE_URL}/dashboard/auth/signIn/session`, {
        method: 'DELETE',
        headers: {
          'authorization': sessionId,
        },
      });
    } catch (error) {
      console.warn('Failed to invalidate session on server:', error);
    }
  }

  // Always clear local credentials
  clearAuth();
  console.log('✅ Signed out, credentials cleared');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getSessionId();
}
