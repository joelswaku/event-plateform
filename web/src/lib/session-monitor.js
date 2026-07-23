/**
 * Session monitoring for automatic logout on inactivity and token expiry
 */

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL = 60 * 1000; // Check every minute

class SessionMonitor {
  constructor() {
    this.lastActivity = Date.now();
    this.checkInterval = null;
    this.onTimeout = null;
    this.isMonitoring = false;
  }

  /**
   * Start monitoring user activity
   * @param {function} onTimeout - Callback when session times out
   */
  start(onTimeout) {
    if (typeof window === 'undefined') return;
    if (this.isMonitoring) return;

    this.onTimeout = onTimeout;
    this.lastActivity = Date.now();
    this.isMonitoring = true;

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, this.updateActivity, { passive: true });
    });

    // Check for inactivity periodically
    this.checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;

      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        console.log('Session timeout due to inactivity');
        this.stop();
        if (this.onTimeout) {
          this.onTimeout('inactivity');
        }
      }
    }, CHECK_INTERVAL);

    // Check when tab becomes visible again
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  updateActivity = () => {
    this.lastActivity = Date.now();
  };

  handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const timeSinceActivity = Date.now() - this.lastActivity;

      // If user was inactive for too long while tab was hidden
      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        console.log('Session expired while tab was hidden');
        this.stop();
        if (this.onTimeout) {
          this.onTimeout('expiry');
        }
      } else {
        // Update activity when tab becomes visible
        this.updateActivity();
      }
    }
  };

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => {
      window.removeEventListener(event, this.updateActivity);
    });

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.isMonitoring = false;
  }

  /**
   * Get time since last activity in seconds
   */
  getTimeSinceActivity() {
    return Math.floor((Date.now() - this.lastActivity) / 1000);
  }

  /**
   * Reset activity timer
   */
  reset() {
    this.lastActivity = Date.now();
  }
}

export const sessionMonitor = new SessionMonitor();
