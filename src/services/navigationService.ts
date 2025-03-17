
/**
 * A dedicated service to handle critical navigation operations
 * This centralizes all redirection logic into a single authoritative source
 */

// Track redirection state to prevent multiple attempts
let redirectionInProgress = false;
let lastRedirectTime = 0;
let redirectionCooldown = 2000; // 2 seconds cooldown between redirects

/**
 * Force navigation to dashboard using direct window.location
 * This bypasses React Router entirely for guaranteed navigation
 */
export const forceToDashboard = (source: string = 'unknown') => {
  const currentTime = Date.now();
  const currentPath = window.location.pathname;
  
  // Only redirect if we're not already on dashboard and not in cooldown period
  if (currentPath === '/dashboard') {
    console.log(`🚀 NAVIGATION: Already on dashboard (requested by ${source})`);
    return false;
  }
  
  // Prevent multiple redirects in rapid succession
  if (redirectionInProgress) {
    console.log(`🚀 NAVIGATION: Redirection already in progress (requested by ${source})`);
    return false;
  }
  
  // Check for cooldown
  if (currentTime - lastRedirectTime < redirectionCooldown) {
    console.log(`🚀 NAVIGATION: In cooldown period (requested by ${source})`);
    return false;
  }
  
  // Set redirection flags
  redirectionInProgress = true;
  lastRedirectTime = currentTime;
  
  console.log(`🚀 NAVIGATION: Forcing navigation to dashboard (requested by ${source})`);
  
  // Store successful auth in localStorage for other components to detect
  localStorage.setItem('auth_success', 'true');
  localStorage.setItem('auth_timestamp', currentTime.toString());
  
  // Direct location change for most reliable redirection
  window.location.href = '/dashboard';
  
  // Reset flag after a delay
  setTimeout(() => {
    redirectionInProgress = false;
  }, redirectionCooldown);
  
  return true;
};

/**
 * Force navigation to login using direct window.location
 * This bypasses React Router entirely for guaranteed navigation
 */
export const forceToLogin = (source: string = 'unknown') => {
  const currentTime = Date.now();
  const currentPath = window.location.pathname;
  
  // Only redirect if we're not already on login and not in cooldown period
  if (currentPath === '/login') {
    console.log(`🚀 NAVIGATION: Already on login (requested by ${source})`);
    return false;
  }
  
  // Prevent multiple redirects in rapid succession
  if (redirectionInProgress) {
    console.log(`🚀 NAVIGATION: Redirection already in progress (requested by ${source})`);
    return false;
  }
  
  // Check for cooldown
  if (currentTime - lastRedirectTime < redirectionCooldown) {
    console.log(`🚀 NAVIGATION: In cooldown period (requested by ${source})`);
    return false;
  }
  
  // Set redirection flags
  redirectionInProgress = true;
  lastRedirectTime = currentTime;
  
  console.log(`🚀 NAVIGATION: Forcing navigation to login (requested by ${source})`);
  
  // Clear auth-related localStorage
  localStorage.removeItem('auth_success');
  localStorage.removeItem('auth_timestamp');
  
  // Direct location change for most reliable redirection
  window.location.href = '/login';
  
  // Reset flag after a delay
  setTimeout(() => {
    redirectionInProgress = false;
  }, redirectionCooldown);
  
  return true;
};

/**
 * Check if the user should be on dashboard based on auth status
 * This is a utility function that can be called from any component
 */
export const checkAuthRedirect = async () => {
  const authSuccess = localStorage.getItem('auth_success');
  const authTimestamp = localStorage.getItem('auth_timestamp');
  const currentPath = window.location.pathname;
  
  // If we're already on the appropriate page, do nothing
  if (
    (authSuccess === 'true' && currentPath === '/dashboard') || 
    (authSuccess !== 'true' && currentPath === '/login')
  ) {
    return false;
  }
  
  // If we have a recent successful auth, redirect to dashboard
  if (authSuccess === 'true' && authTimestamp) {
    const timestamp = parseInt(authTimestamp, 10);
    const fiveMinutesMs = 5 * 60 * 1000;
    
    if (Date.now() - timestamp < fiveMinutesMs) {
      // If on login page, redirect to dashboard
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        return forceToDashboard('checkAuthRedirect');
      }
    } else {
      // Auth is stale, clear it
      localStorage.removeItem('auth_success');
      localStorage.removeItem('auth_timestamp');
    }
  }
  
  return false;
};

/**
 * Navigate to a specific route within the application
 * Using direct window.location for maximum reliability
 */
export const navigateTo = (route: string, source: string = 'unknown') => {
  const currentTime = Date.now();
  const currentPath = window.location.pathname;
  
  // Only navigate if we're not already on the route and not in cooldown period
  if (currentPath === route) {
    console.log(`🚀 NAVIGATION: Already on ${route} (requested by ${source})`);
    return false;
  }
  
  // Prevent multiple navigations in rapid succession
  if (redirectionInProgress) {
    console.log(`🚀 NAVIGATION: Navigation already in progress (requested by ${source})`);
    return false;
  }
  
  // Check for cooldown
  if (currentTime - lastRedirectTime < redirectionCooldown) {
    console.log(`🚀 NAVIGATION: In cooldown period (requested by ${source})`);
    return false;
  }
  
  // Set navigation flags
  redirectionInProgress = true;
  lastRedirectTime = currentTime;
  
  console.log(`🚀 NAVIGATION: Navigating to ${route} (requested by ${source})`);
  
  // Direct location change for reliable navigation
  window.location.href = route;
  
  // Reset flag after a delay
  setTimeout(() => {
    redirectionInProgress = false;
  }, redirectionCooldown);
  
  return true;
};
