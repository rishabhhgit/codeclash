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
 * Get or generate a persistent unique authentication token for guest or logged-in users.
 * Ensures two independent guests NEVER collide on the same socket userId or player slot.
 */
export function getClientAuthToken(): string {
  if (typeof window === 'undefined') return 'guest-' + Math.random().toString(36).substring(2, 10);
  let token = localStorage.getItem('token');
  if (!token) {
    let guestId = localStorage.getItem('codeclash_guest_id');
    if (!guestId || guestId === 'guest-token') {
      guestId = 'guest-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('codeclash_guest_id', guestId);
    }
    token = guestId;
  }
  return token;
}

/**
 * Get or generate a persistent username/handle for battles.
 */
export function getClientUsername(): string {
  if (typeof window === 'undefined') return 'Coder_' + Math.floor(1000 + Math.random() * 9000);
  let name = localStorage.getItem('battle_username') || localStorage.getItem('codeclash_username');
  if (!name || name === 'Player') {
    name = 'Coder_' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('battle_username', name);
  }
  return name;
}

