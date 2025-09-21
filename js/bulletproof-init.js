// Bulletproof Application Initialization
// Single source of truth for app startup - 100% reliable

const BulletproofInit = {
    // Initialization state
    initialized: false,
    initSteps: [],
    startTime: null,
    
    // Main initialization function
    async initialize() {
        // Prevent multiple initializations
        if (this.initialized || window.appFullyInitialized) {
            console.log('App already initialized');
            return true;
        }
        
        console.log('');
        console.log('='.repeat(60));
        console.log('BULLETPROOF APP INITIALIZATION STARTING');
        console.log('='.repeat(60));
        
        this.startTime = Date.now();
        
        try {
            // Step 1: Clear any problematic old data
            this.cleanupOldData();
            this.logStep('Cleanup', true);
            
            // Step 2: Initialize Local API (this includes data restoration)
            if (window.API && typeof window.API.init === 'function') {
                window.API.init();
                this.logStep('Local API', true);
            } else {
                console.error('Local API not found!');
                throw new Error('Local API module missing');
            }
            
            // Step 3: Initialize Authentication
            if (window.Auth && typeof window.Auth.init === 'function') {
                window.Auth.init();
                this.logStep('Authentication', true);
            } else {
                console.error('Auth module not found!');
                throw new Error('Authentication module missing');
            }
            
            // Step 4: Determine view based on auth status
            await this.determineInitialView();
            this.logStep('View Setup', true);
            
            // Step 5: Mark as fully initialized
            this.initialized = true;
            window.appFullyInitialized = true;
            
            const duration = Date.now() - this.startTime;
            console.log('='.repeat(60));
            console.log(`✅ APP INITIALIZATION COMPLETE (${duration}ms)`);
            console.log('Steps:', this.initSteps.join(' → '));
            console.log('='.repeat(60));
            console.log('');
            
            return true;
            
        } catch (error) {
            console.error('CRITICAL INITIALIZATION ERROR:', error);
            this.showCriticalError(error);
            return false;
        }
    },
    
    // Cleanup old problematic data
    cleanupOldData() {
        console.log('Cleaning up old data...');
        
        // Remove old problematic keys
        const oldKeys = [
            'ls_users', 'ls_activities', 'ls_goals', // Old localStorage API
            'users', 'activities', 'goals', // Even older format
            'mock_users', 'mock_activities', // Mock data
            'startup_initialized', 'app_initialized' // Old init flags
        ];
        
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`Removed old key: ${key}`);
            }
        });
        
        // Clear old session if it exists
        const oldSession = localStorage.getItem('spt_session');
        if (oldSession) {
            try {
                const session = JSON.parse(oldSession);
                // Check if it's an old format session
                if (!session.user || !session.user.id) {
                    localStorage.removeItem('spt_session');
                    console.log('Removed invalid old session');
                }
            } catch (e) {
                localStorage.removeItem('spt_session');
                console.log('Removed corrupted session');
            }
        }
    },
    
    // Determine initial view to show
    async determineInitialView() {
        console.log('Determining initial view...');
        
        // Hide loader
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Check authentication status
        const isAuthenticated = window.Auth && window.Auth.isAuthenticated && window.Auth.isAuthenticated();
        
        if (isAuthenticated) {
            console.log('User is authenticated - showing main app');
            await this.showMainApp();
        } else {
            console.log('User not authenticated - showing login');
            this.showLogin();
        }
    },
    
    // Show main application
    async showMainApp() {
        const mainApp = document.getElementById('main-app');
        const loginPage = document.getElementById('login-page');
        
        // Hide login
        if (loginPage) {
            loginPage.style.display = 'none';
        }
        
        // Show main app
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.opacity = '1';
            
            // Initialize app.js if available
            if (typeof window.initializeApp === 'function') {
                console.log('Initializing main app...');
                try {
                    await window.initializeApp();
                    console.log('Main app initialized');
                } catch (error) {
                    console.error('Main app initialization error:', error);
                    // Continue anyway - app might still work
                }
            }
            
            // Show dashboard by default
            setTimeout(() => {
                if (typeof window.showSection === 'function') {
                    try {
                        window.showSection('dashboard');
                        console.log('Dashboard displayed');
                    } catch (error) {
                        console.error('Failed to show dashboard:', error);
                    }
                }
            }, 100);
        } else {
            console.error('Main app container not found!');
        }
    },
    
    // Show login page
    showLogin() {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        // Hide main app
        if (mainApp) {
            mainApp.style.display = 'none';
        }
        
        // Show login
        if (window.Auth && typeof window.Auth.showLoginPage === 'function') {
            window.Auth.showLoginPage();
        } else if (loginPage) {
            loginPage.style.display = 'flex';
            loginPage.style.minHeight = '100vh';
            loginPage.style.alignItems = 'center';
            loginPage.style.justifyContent = 'center';
        } else {
            console.error('Login page not found!');
            this.showCriticalError(new Error('Login page missing'));
        }
    },
    
    // Show critical error screen
    showCriticalError(error) {
        console.error('Showing critical error screen');
        
        // Hide everything
        ['initial-loader', 'login-page', 'main-app'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.style.display = 'none';
        });
        
        // Remove any existing error display
        const existingError = document.getElementById('critical-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.id = 'critical-error';
        errorDiv.className = 'fixed inset-0 bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center p-8 z-50';
        errorDiv.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg text-center">
                <div class="mb-6">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500"></i>
                </div>
                
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Critical Error</h1>
                
                <p class="text-gray-600 mb-6">
                    The application encountered a critical error during initialization.
                </p>
                
                <div class="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                    <p class="text-sm font-mono text-gray-700">${error.message}</p>
                    <p class="text-xs text-gray-500 mt-2">Steps completed: ${this.initSteps.join(' → ') || 'None'}</p>
                </div>
                
                <div class="space-y-3">
                    <button onclick="location.reload()" 
                            class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                        <i class="fas fa-redo mr-2"></i>Reload Application
                    </button>
                    
                    <button onclick="BulletproofInit.emergencyReset()" 
                            class="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium transition-colors">
                        <i class="fas fa-trash-alt mr-2"></i>Reset Everything
                    </button>
                    
                    <button onclick="BulletproofInit.showDiagnostics()" 
                            class="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors">
                        <i class="fas fa-info-circle mr-2"></i>Show Diagnostics
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    },
    
    // Emergency reset - clear everything and start fresh
    async emergencyReset() {
        if (confirm('This will delete ALL data and reset the application to factory defaults. Continue?')) {
            console.log('Performing emergency reset...');
            
            // Clear all localStorage
            localStorage.clear();
            
            // Clear all sessionStorage
            sessionStorage.clear();
            
            // Reload page
            location.reload();
        }
    },
    
    // Show diagnostics information
    showDiagnostics() {
        const diagnostics = {
            'Browser': navigator.userAgent,
            'Local Storage Size': this.getStorageSize(),
            'Session Active': !!localStorage.getItem('spt_session'),
            'Users Count': this.countStoredItems('bp_users'),
            'Activities Count': this.countStoredItems('bp_activities'),
            'Goals Count': this.countStoredItems('bp_goals'),
            'API Module': !!window.API,
            'Auth Module': !!window.Auth,
            'App Module': !!window.initializeApp,
            'Initialization Time': this.startTime ? `${Date.now() - this.startTime}ms` : 'N/A',
            'Steps Completed': this.initSteps.join(', ') || 'None'
        };
        
        let diagnosticHTML = '<div class="bg-gray-100 rounded-lg p-4 text-left text-sm">';
        for (const [key, value] of Object.entries(diagnostics)) {
            diagnosticHTML += `<div class="mb-2"><strong>${key}:</strong> ${value}</div>`;
        }
        diagnosticHTML += '</div>';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-lg w-full max-h-96 overflow-y-auto">
                <h3 class="text-xl font-bold mb-4">System Diagnostics</h3>
                ${diagnosticHTML}
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // Get storage size
    getStorageSize() {
        let size = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage[key].length + key.length;
            }
        }
        return `${(size / 1024).toFixed(2)} KB`;
    },
    
    // Count stored items
    countStoredItems(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return 0;
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
            return 0;
        }
    },
    
    // Log initialization step
    logStep(step, success) {
        const icon = success ? '✅' : '❌';
        this.initSteps.push(`${step}${icon}`);
        console.log(`Step: ${step} - ${success ? 'SUCCESS' : 'FAILED'}`);
    }
};

// Auto-initialize when DOM is ready
function startBulletproofInit() {
    // Prevent multiple starts
    if (window.bulletproofInitStarted) {
        return;
    }
    window.bulletproofInitStarted = true;
    
    console.log('DOM Ready - Starting bulletproof initialization');
    
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        BulletproofInit.initialize();
    }, 100);
}

// Handle different loading scenarios
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBulletproofInit);
} else {
    // DOM already loaded
    startBulletproofInit();
}

// Export for global access
window.BulletproofInit = BulletproofInit;

console.log('✅ Bulletproof Init loaded and ready');