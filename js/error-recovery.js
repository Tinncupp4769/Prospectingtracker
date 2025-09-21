// Error Recovery and Resilience Module
// Handles API errors, connection issues, and provides fallback mechanisms

const ErrorRecovery = {
    // Configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // Start with 1 second
    OFFLINE_MODE: false,
    ERROR_LOG: [],
    
    // Initialize error recovery
    init() {
        this.setupGlobalErrorHandlers();
        this.checkConnectivity();
        this.initializeOfflineCache();
        console.log('Error Recovery Module initialized');
    },
    
    // Setup global error handlers
    setupGlobalErrorHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            this.logError('global', event.error);
            this.showErrorNotification('An unexpected error occurred. The app will try to recover.');
            event.preventDefault();
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError('promise', event.reason);
            
            // Only show notification for actual errors, not routine failures
            if (event.reason && event.reason.message && 
                !event.reason.message.includes('404') && 
                !event.reason.message.includes('NetworkError')) {
                this.showErrorNotification('A background operation failed. Please refresh if issues persist.');
            }
            
            event.preventDefault();
        });
        
        // Handle network status changes
        window.addEventListener('online', () => {
            this.OFFLINE_MODE = false;
            this.showSuccessNotification('Connection restored!');
        });
        
        window.addEventListener('offline', () => {
            this.OFFLINE_MODE = true;
            this.showWarningNotification('You are offline. Please check your connection.');
        });
    },
    
    // Check connectivity status
    checkConnectivity() {
        this.OFFLINE_MODE = !navigator.onLine;
        if (this.OFFLINE_MODE) {
            console.warn('Starting in offline mode');
        }
    },
    
    // Initialize offline cache
    initializeOfflineCache() {
        if (!localStorage.getItem('offline_cache')) {
            localStorage.setItem('offline_cache', JSON.stringify({
                activities: [],
                goals: [],
                users: [],
                timestamp: Date.now()
            }));
        }
    },
    
    // Enhanced API wrapper with retry logic
    async apiCallWithRetry(apiFunction, ...args) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                // Check if offline
                if (this.OFFLINE_MODE) {
                    return this.handleOfflineApiCall(apiFunction.name, args);
                }
                
                // Try the API call
                const result = await apiFunction.apply(API, args);
                
                // Success - clear any error state
                this.clearErrorState();
                return result;
                
            } catch (error) {
                lastError = error;
                console.warn(`API call failed (attempt ${attempt}/${this.MAX_RETRIES}):`, error);
                
                // Check if it's a recoverable error
                if (!this.isRecoverableError(error)) {
                    throw error;
                }
                
                // Wait before retry with exponential backoff
                if (attempt < this.MAX_RETRIES) {
                    await this.delay(this.RETRY_DELAY * Math.pow(2, attempt - 1));
                }
            }
        }
        
        // All retries failed
        this.handleApiFailure(lastError);
        throw lastError;
    },
    
    // Check if error is recoverable
    isRecoverableError(error) {
        const errorMessage = error.message || error.toString();
        
        // Network errors
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('Network') ||
            errorMessage.includes('timeout')) {
            return true;
        }
        
        // Server errors that might be temporary
        if (errorMessage.includes('500') || 
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504')) {
            return true;
        }
        
        // Rate limiting
        if (errorMessage.includes('429')) {
            return true;
        }
        
        return false;
    },
    
    // Handle offline API calls
    handleOfflineApiCall(functionName, args) {
        console.log('Handling offline API call:', functionName);
        
        const cache = JSON.parse(localStorage.getItem('offline_cache') || '{}');
        
        // Store operations for later sync
        if (functionName.includes('create') || functionName.includes('update')) {
            cache.pendingOperations = cache.pendingOperations || [];
            cache.pendingOperations.push({
                type: functionName,
                args: args,
                timestamp: Date.now()
            });
            localStorage.setItem('offline_cache', JSON.stringify(cache));
        }
        
        // Return cached data for read operations
        if (functionName.includes('get')) {
            const dataType = this.getDataTypeFromFunction(functionName);
            return { data: cache[dataType] || [] };
        }
        
        return { success: true, offline: true };
    },
    
    // Get data type from function name
    getDataTypeFromFunction(functionName) {
        if (functionName.includes('User')) return 'users';
        if (functionName.includes('Activity') || functionName.includes('Activities')) return 'activities';
        if (functionName.includes('Goal')) return 'goals';
        return 'unknown';
    },
    
    // Handle API failure
    handleApiFailure(error) {
        console.error('API call failed after all retries:', error);
        this.logError('api', error);
        
        // Show user-friendly error message
        const errorMessage = this.getUserFriendlyErrorMessage(error);
        this.showErrorNotification(errorMessage);
        
        // Try to recover gracefully
        this.attemptGracefulRecovery();
    },
    
    // Get user-friendly error message
    getUserFriendlyErrorMessage(error) {
        const errorString = error.message || error.toString();
        
        if (errorString.includes('500')) {
            return 'Server error detected. Please ensure the app is properly configured and try again.';
        }
        if (errorString.includes('Failed to fetch') || errorString.includes('Network')) {
            return 'Connection issue detected. Please check your internet connection.';
        }
        if (errorString.includes('401') || errorString.includes('403')) {
            return 'Access denied. Please check your permissions or login again.';
        }
        if (errorString.includes('404')) {
            return 'Requested data not found. It may have been deleted.';
        }
        
        return 'An error occurred. Please refresh the page and try again.';
    },
    
    // Attempt graceful recovery
    attemptGracefulRecovery() {
        // Try to use cached data
        const cache = JSON.parse(localStorage.getItem('offline_cache') || '{}');
        
        if (cache.timestamp && Date.now() - cache.timestamp < 3600000) { // 1 hour
            console.log('Using cached data for recovery');
            window.usesCachedData = true;
            this.showWarningNotification('Using cached data. Some information may be outdated.');
        }
    },
    
    // Sync offline data when back online
    async syncOfflineData() {
        const cache = JSON.parse(localStorage.getItem('offline_cache') || '{}');
        
        if (cache.pendingOperations && cache.pendingOperations.length > 0) {
            console.log('Syncing offline operations:', cache.pendingOperations.length);
            
            for (const operation of cache.pendingOperations) {
                try {
                    await API[operation.type](...operation.args);
                } catch (error) {
                    console.error('Failed to sync operation:', operation, error);
                }
            }
            
            // Clear pending operations
            cache.pendingOperations = [];
            localStorage.setItem('offline_cache', JSON.stringify(cache));
            
            this.showSuccessNotification('Offline changes synced successfully!');
        }
    },
    
    // Log error for debugging
    logError(type, error) {
        this.ERROR_LOG.push({
            type: type,
            error: error.toString(),
            stack: error.stack,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        });
        
        // Keep only last 50 errors
        if (this.ERROR_LOG.length > 50) {
            this.ERROR_LOG.shift();
        }
        
        // Store in localStorage for persistence
        localStorage.setItem('error_log', JSON.stringify(this.ERROR_LOG));
    },
    
    // Clear error state
    clearErrorState() {
        const errorBanner = document.getElementById('error-banner');
        if (errorBanner) {
            errorBanner.style.display = 'none';
        }
    },
    
    // Show error notification
    showErrorNotification(message) {
        this.showNotification(message, 'error');
    },
    
    // Show warning notification
    showWarningNotification(message) {
        this.showNotification(message, 'warning');
    },
    
    // Show success notification
    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    },
    
    // Generic notification display
    showNotification(message, type = 'info') {
        // Create or update error banner
        let banner = document.getElementById('error-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'error-banner';
            banner.className = 'fixed top-16 left-0 right-0 z-50 p-4 transition-all duration-300';
            document.body.appendChild(banner);
        }
        
        // Set styles based on type
        const styles = {
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            success: 'bg-green-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        banner.className = `fixed top-16 left-0 right-0 z-50 p-4 transition-all duration-300 ${styles[type]}`;
        banner.innerHTML = `
            <div class="container mx-auto flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-3"></i>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.style.display='none'" class="text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        banner.style.display = 'block';
        
        // Auto-hide after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                banner.style.display = 'none';
            }, 5000);
        }
    },
    
    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Export error log for debugging
    exportErrorLog() {
        const log = JSON.parse(localStorage.getItem('error_log') || '[]');
        const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ErrorRecovery.init());
} else {
    ErrorRecovery.init();
}