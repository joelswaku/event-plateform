/**
 * Cross-tab authentication synchronization
 * Ensures all tabs logout when one tab logs out, and stay in sync
 */

const AUTH_CHANNEL = 'auth_sync_channel';
const STORAGE_KEY = 'auth_event';

class AuthSync {
  constructor() {
    this.channel = null;
    this.listeners = new Set();
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Use BroadcastChannel if available (modern browsers)
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(AUTH_CHANNEL);
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } else {
      // Fallback to localStorage events for older browsers
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleMessage(data);
            // Clean up immediately
            localStorage.removeItem(STORAGE_KEY);
          } catch (err) {
            console.error('Auth sync parse error:', err);
          }
        }
      });
    }
  }

  handleMessage(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Auth sync listener error:', err);
      }
    });
  }

  /**
   * Broadcast authentication event to all tabs
   * @param {string} type - 'login' | 'logout' | 'token_refresh'
   * @param {object} payload - Additional data
   */
  broadcast(type, payload = {}) {
    if (typeof window === 'undefined') return;

    const message = { type, payload, timestamp: Date.now() };

    if (this.channel) {
      // BroadcastChannel
      this.channel.postMessage(message);
    } else {
      // localStorage fallback
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('Auth sync broadcast error:', err);
      }
    }
  }

  /**
   * Subscribe to auth events from other tabs
   * @param {function} listener - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

export const authSync = new AuthSync();
