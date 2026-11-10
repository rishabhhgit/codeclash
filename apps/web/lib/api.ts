/**
 * Get the WebSocket URL for Socket.IO connections
 * In development: http://localhost:3001
 * In production: wss://your-api.up.railway.app
 */
export function getWsUrl(): string {
  // If explicitly set, use that
  if (typeof window !== 'undefined') {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) return wsUrl;
  }

  // In browser, derive from API URL
  if (typeof window !== 'undefined') {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Convert http(s) to ws(s)
    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://');
    } else if (apiUrl.startsWith('http://')) {
      return apiUrl.replace('http://', 'ws://');
    }
    return apiUrl;
  }

  // Server-side fallback
  return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
}

/**
 * Get the API URL for fetch requests
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

/**
 * Get or generate a per-tab unique session ID.
 * Kept in sessionStorage so each tab has an isolated identifier.
 */
export function getTabSessionId(): string {
  if (typeof window === 'undefined') return 'server_tab';
  try {
    let tabId = sessionStorage.getItem('codeclash_tab_id');
    if (!tabId) {
      tabId = 'tab_' + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('codeclash_tab_id', tabId);
    }
    return tabId;
  } catch {
    return 'tab_' + Math.random().toString(36).substring(2, 8);
  }
}

/**
 * Get or generate a unique authentication token for guest or logged-in users.
 * Uses sessionStorage for guest tokens so each tab can act as a distinct guest combatant
 * during multi-tab testing, preventing cross-tab collisions.
 */
export function getClientAuthToken(): string {
  if (typeof window === 'undefined') return 'guest-' + Math.random().toString(36).substring(2, 10);
  try {
    const token = localStorage.getItem('token');
    if (token) return token;

    // Use sessionStorage for guest identity so two open tabs get distinct guest fighters
    let guestId = sessionStorage.getItem('codeclash_guest_id');
    if (!guestId || guestId === 'guest-token') {
      const tabSeed = getTabSessionId();
      guestId = `guest-${tabSeed}-${Date.now().toString(36).slice(-4)}`;
      sessionStorage.setItem('codeclash_guest_id', guestId);
    }
    return guestId;
  } catch {
    return 'guest-' + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Get or generate a persistent username/handle for battles.
 * Tab-aware so multi-tab testing produces distinct names.
 */
export function getClientUsername(): string {
  if (typeof window === 'undefined') return 'Coder_' + Math.floor(1000 + Math.random() * 9000);
  try {
    const accountUser = localStorage.getItem('codeclash_username');
    const tabId = getTabSessionId();

    let name = sessionStorage.getItem('battle_username');
    if (!name) {
      if (accountUser) {
        // If account username exists, use it
        name = accountUser;
      } else {
        const hex = tabId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
        name = 'Coder_' + (hex || Math.floor(1000 + Math.random() * 9000));
      }
      sessionStorage.setItem('battle_username', name);
    }
    return name;
  } catch {
    return 'Coder_' + Math.floor(1000 + Math.random() * 9000);
  }
}
