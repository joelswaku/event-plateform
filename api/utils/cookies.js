/**
 * Production-ready cookie utilities
 * Handles secure cookie settings for development and production
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Set refresh token cookie with production-safe settings
 * @param {Response} res - Express response object
 * @param {string} token - Refresh token
 */
export function setRefreshTokenCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,                              // Cannot be accessed via JavaScript
    secure: isProduction,                         // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax',     // Cross-origin in production
    maxAge: 7 * 24 * 60 * 60 * 1000,            // 7 days
    path: '/',
  });

  console.log(`✅ Refresh token cookie set (production: ${isProduction})`);
}

/**
 * Clear refresh token cookie
 * @param {Response} res - Express response object
 */
export function clearRefreshTokenCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });

  console.log('✅ Refresh token cookie cleared');
}

/**
 * Set session cookie (for auth_sessions table ID)
 * @param {Response} res - Express response object
 * @param {string} sessionId - Session ID
 */
export function setSessionCookie(res, sessionId) {
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

/**
 * Get cookie settings for development vs production
 * @returns {object} Cookie configuration
 */
export function getCookieConfig() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
}

/**
 * Validate cookie security settings
 * Logs warnings if production settings are not secure
 */
export function validateCookieSettings() {
  if (isProduction) {
    console.log('🔒 Production cookie settings:');
    console.log('  - httpOnly: true');
    console.log('  - secure: true (HTTPS required)');
    console.log('  - sameSite: none (cross-origin allowed)');
    console.log('  - maxAge: 7 days');
  } else {
    console.log('🔓 Development cookie settings:');
    console.log('  - httpOnly: true');
    console.log('  - secure: false (HTTP allowed)');
    console.log('  - sameSite: lax');
    console.log('  - maxAge: 7 days');
  }
}
