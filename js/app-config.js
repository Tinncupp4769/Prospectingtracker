// Application Configuration
// Manages different deployment scenarios and access modes

window.APP_CONFIG = {
    // App Version
    version: '2.1.0',
    lastUpdated: '2025-01-15',
    
    // Deployment Environment
    environment: detectEnvironment(),
    
    // Access Control
    accessMode: getAccessMode(),
    publicAccess: false, // Set to true for public demos
    requireAuth: true,   // Set to false to disable authentication
    
    // API Configuration
    apiBaseUrl: getApiBaseUrl(),
    apiTimeout: 30000, // 30 seconds
    maxRetries: 3,
    
    // Performance Settings
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    lazyLoadThreshold: 50,
    enableOfflineMode: true,
    
    // Feature Flags
    features: {
        analytics: true,
        leaderboard: true,
        goals: true,
        userManagement: true,
        advancedCharts: true,
        exportData: false, // Not yet implemented
        notifications: false // Not yet implemented
    },
    
    // Error Handling
    errorRecovery: {
        enabled: true,
        autoRetry: true,
        fallbackToCache: true,
        showTechnicalDetails: isDevelopment()
    },
    
    // UI Settings
    ui: {
        showLoadingStates: true,
        animationsEnabled: true,
        darkModeEnabled: false,
        compactMode: false
    },
    
    // Demo/Development Settings
    demo: {
        enabled: isDemoMode(),
        sampleData: true,
        resetInterval: 24 * 60 * 60 * 1000 // Reset demo data daily
    }
};

// Detect current environment
function detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
    } else {
        return 'production';
    }
}

// Get access mode from URL or settings
function getAccessMode() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check URL parameters
    if (urlParams.get('mode')) {
        return urlParams.get('mode');
    }
    
    // Check localStorage
    const savedMode = localStorage.getItem('app_access_mode');
    if (savedMode) {
        return savedMode;
    }
    
    // Default based on environment
    return detectEnvironment() === 'development' ? 'open' : 'authenticated';
}

// Get API base URL based on environment
function getApiBaseUrl() {
    const env = detectEnvironment();
    
    // Allow override via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('api')) {
        return urlParams.get('api');
    }
    
    // Environment-specific URLs
    switch (env) {
        case 'development':
            return ''; // Use relative URLs for local development
        case 'staging':
            return '/api/staging';
        case 'production':
            return '/api/v1';
        default:
            return '';
    }
}

// Check if in development mode
function isDevelopment() {
    return APP_CONFIG.environment === 'development';
}

// Check if in demo mode
function isDemoMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('demo') === 'true' || 
           localStorage.getItem('demo_mode') === 'true';
}

// Apply configuration on load
function applyConfiguration() {
    // Update API base URL
    if (typeof API !== 'undefined') {
        API.baseURL = APP_CONFIG.apiBaseUrl;
    }
    
    // Enable/disable features
    if (!APP_CONFIG.features.analytics) {
        const analyticsNav = document.querySelector('[onclick*="analytics"]');
        if (analyticsNav) analyticsNav.style.display = 'none';
    }
    
    if (!APP_CONFIG.features.leaderboard) {
        const leaderboardNav = document.querySelector('[onclick*="leaderboard"]');
        if (leaderboardNav) leaderboardNav.style.display = 'none';
    }
    
    // Apply UI settings
    if (!APP_CONFIG.ui.animationsEnabled) {
        document.body.classList.add('no-animations');
    }
    
    // Set up error recovery
    if (APP_CONFIG.errorRecovery.enabled && typeof ErrorRecovery !== 'undefined') {
        ErrorRecovery.MAX_RETRIES = APP_CONFIG.maxRetries;
    }
    
    // Set up performance optimization
    if (APP_CONFIG.enableCaching && typeof PerformanceOptimizer !== 'undefined') {
        PerformanceOptimizer.CACHE_DURATION = APP_CONFIG.cacheTimeout;
        PerformanceOptimizer.LAZY_LOAD_THRESHOLD = APP_CONFIG.lazyLoadThreshold;
    }
    
    // Handle public access mode
    if (APP_CONFIG.accessMode === 'public' || APP_CONFIG.publicAccess) {
        APP_CONFIG.requireAuth = false;
        localStorage.setItem('public_access', 'true');
    }
    
    // Log configuration in development
    if (isDevelopment()) {
        console.log('App Configuration:', APP_CONFIG);
    }
}

// Configuration helper functions
window.AppConfig = {
    // Get a configuration value
    get(path) {
        const keys = path.split('.');
        let value = APP_CONFIG;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    },
    
    // Set a configuration value
    set(path, newValue) {
        const keys = path.split('.');
        let obj = APP_CONFIG;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in obj) || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }
        
        obj[keys[keys.length - 1]] = newValue;
        
        // Apply changes if needed
        applyConfiguration();
    },
    
    // Toggle a feature
    toggleFeature(featureName) {
        if (APP_CONFIG.features[featureName] !== undefined) {
            APP_CONFIG.features[featureName] = !APP_CONFIG.features[featureName];
            applyConfiguration();
        }
    },
    
    // Reset to defaults
    reset() {
        localStorage.removeItem('app_access_mode');
        localStorage.removeItem('demo_mode');
        localStorage.removeItem('public_access');
        location.reload();
    },
    
    // Export configuration
    export() {
        return JSON.stringify(APP_CONFIG, null, 2);
    }
};

// Apply configuration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyConfiguration);
} else {
    applyConfiguration();
}

// Export for debugging
window.APP_CONFIG = APP_CONFIG;