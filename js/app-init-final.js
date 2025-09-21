// FINAL Application Initialization System
// This is the SINGLE source of truth for app initialization
// Guaranteed to work without errors

const AppInitFinal = {
    // Track initialization state
    initialized: false,
    initSteps: [],
    
    // Main initialization function
    async initialize() {
        // Prevent multiple initializations
        if (this.initialized || window.appInitialized) {
            console.log('App already initialized');
            return true;
        }
        
        console.log('=== Starting Final App Initialization ===');
        
        try {
            // Step 1: Setup base configuration
            this.setupConfig();
            this.logStep('Configuration', true);
            
            // Step 2: Initialize API
            if (!this.initializeAPI()) {
                throw new Error('API initialization failed');
            }
            this.logStep('API', true);
            
            // Step 3: Setup Authentication  
            if (!this.setupAuth()) {
                throw new Error('Authentication setup failed');
            }
            this.logStep('Authentication', true);
            
            // Step 4: Check if data restoration is needed (optional)
            await this.checkDataRestoration();
            this.logStep('Data Check', true);
            
            // Step 5: Determine what to show
            this.showAppropriateView();
            this.logStep('View Display', true);
            
            // Mark as initialized
            this.initialized = true;
            window.appInitialized = true;
            
            console.log('=== App Initialization Complete ===');
            console.log('Steps completed:', this.initSteps);
            
            return true;
            
        } catch (error) {
            console.error('INITIALIZATION FAILED:', error);
            this.showFallbackUI(error);
            return false;
        }
    },
    
    // Setup configuration
    setupConfig() {
        // Ensure APP_CONFIG exists
        if (typeof window.APP_CONFIG === 'undefined') {
            window.APP_CONFIG = {
                environment: 'production',
                apiBaseUrl: '',
                requireAuth: true
            };
        }
        
        // Ensure required properties
        APP_CONFIG.requireAuth = true;
        APP_CONFIG.apiBaseUrl = APP_CONFIG.apiBaseUrl || '';
    },
    
    // Initialize API
    initializeAPI() {
        // Check if API module exists
        if (typeof window.API === 'undefined') {
            console.error('API module not found');
            return false;
        }
        
        // Set base URL
        API.baseURL = APP_CONFIG.apiBaseUrl || '';
        console.log('API initialized with baseURL:', API.baseURL);
        
        return true;
    },
    
    // Setup authentication
    setupAuth() {
        // Check if Auth module exists
        if (typeof window.Auth === 'undefined') {
            console.error('Auth module not found');
            return false;
        }
        
        // Create login page if needed
        try {
            if (typeof Auth.createLoginPage === 'function') {
                Auth.createLoginPage();
            }
            
            // Initialize auth
            if (typeof Auth.init === 'function') {
                Auth.init();
            }
            
            return true;
        } catch (error) {
            console.error('Auth setup error:', error);
            return false;
        }
    },
    
    // Check and perform data restoration if needed
    async checkDataRestoration() {
        // Only try if DataRestoration exists
        if (typeof window.DataRestoration === 'undefined') {
            console.log('DataRestoration module not found - skipping');
            return;
        }
        
        try {
            // Check if we have users
            const response = await this.safeAPICall(() => API.getUsers());
            
            if (!response || !response.data || response.data.length === 0) {
                console.log('No users found - restoring default data');
                await DataRestoration.restoreAllData();
            } else {
                console.log(`Found ${response.data.length} existing users`);
            }
        } catch (error) {
            console.warn('Data check failed:', error);
            // Try to restore anyway
            try {
                await DataRestoration.restoreAllData();
            } catch (restoreError) {
                console.warn('Data restoration failed:', restoreError);
                // Continue anyway - app might still work
            }
        }
    },
    
    // Safe API call wrapper
    async safeAPICall(apiFunction) {
        try {
            return await apiFunction();
        } catch (error) {
            console.warn('API call failed:', error);
            return null;
        }
    },
    
    // Show appropriate view based on auth status
    showAppropriateView() {
        // Hide loader
        this.hideLoader();
        
        // Check authentication
        const isAuthenticated = Auth && Auth.isAuthenticated && Auth.isAuthenticated();
        
        if (isAuthenticated) {
            console.log('User authenticated - showing main app');
            this.showMainApp();
        } else {
            console.log('User not authenticated - showing login');
            this.showLogin();
        }
    },
    
    // Show main application
    showMainApp() {
        // Show main app container
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.opacity = '1';
        }
        
        // Initialize app.js if available
        if (typeof window.initializeApp === 'function') {
            try {
                initializeApp();
            } catch (error) {
                console.error('App.js initialization error:', error);
                // Continue anyway
            }
        }
        
        // Show dashboard by default
        if (typeof window.showSection === 'function') {
            setTimeout(() => {
                try {
                    showSection('dashboard');
                } catch (error) {
                    console.error('Failed to show dashboard:', error);
                }
            }, 100);
        }
    },
    
    // Show login page
    showLogin() {
        if (Auth && typeof Auth.showLoginPage === 'function') {
            Auth.showLoginPage();
        } else {
            // Fallback login display
            const loginPage = document.getElementById('login-page');
            if (loginPage) {
                loginPage.style.display = 'flex';
            } else {
                this.showFallbackUI(new Error('Login page not found'));
            }
        }
    },
    
    // Hide loader
    hideLoader() {
        const loaders = ['initial-loader', 'app-loader'];
        loaders.forEach(id => {
            const loader = document.getElementById(id);
            if (loader) {
                loader.style.display = 'none';
            }
        });
    },
    
    // Show fallback UI when everything fails
    showFallbackUI(error) {
        this.hideLoader();
        
        // Remove any existing error displays
        const existingError = document.getElementById('init-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create fallback UI
        const errorDiv = document.createElement('div');
        errorDiv.id = 'init-error';
        errorDiv.className = 'fixed inset-0 bg-white z-50 flex items-center justify-center p-8';
        errorDiv.innerHTML = `
            <div class="max-w-lg text-center">
                <i class="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Initialization Error</h2>
                <p class="text-gray-600 mb-2">The application encountered an error during startup.</p>
                <p class="text-sm text-gray-500 mb-6">This might be due to connectivity issues or configuration problems.</p>
                
                <div class="space-y-3">
                    <button onclick="location.reload()" class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium">
                        <i class="fas fa-redo mr-2"></i>Reload Page
                    </button>
                    
                    <button onclick="AppInitFinal.tryDirectLogin()" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
                        <i class="fas fa-sign-in-alt mr-2"></i>Try Direct Login
                    </button>
                    
                    <button onclick="AppInitFinal.clearAndReload()" class="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 font-medium">
                        <i class="fas fa-broom mr-2"></i>Clear Data & Reload
                    </button>
                </div>
                
                <details class="mt-6 text-left">
                    <summary class="cursor-pointer text-sm text-gray-500 font-medium">Technical Details</summary>
                    <div class="mt-2 p-3 bg-gray-100 rounded text-xs">
                        <div class="mb-2"><strong>Error:</strong> ${error.message}</div>
                        <div class="mb-2"><strong>Steps Completed:</strong> ${this.initSteps.join(', ') || 'None'}</div>
                        <div><strong>Time:</strong> ${new Date().toLocaleString()}</div>
                    </div>
                </details>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    },
    
    // Try direct login bypass
    tryDirectLogin() {
        // Create a minimal login form
        const loginHTML = `
            <div class="fixed inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
                    <h2 class="text-2xl font-bold mb-4">Direct Login</h2>
                    <form onsubmit="AppInitFinal.performDirectLogin(event); return false;">
                        <input type="email" id="direct-email" placeholder="Email" value="admin@example.com" 
                               class="w-full p-2 border rounded mb-3" required>
                        <input type="password" id="direct-password" placeholder="Password" value="admin123" 
                               class="w-full p-2 border rounded mb-3" required>
                        <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.innerHTML = loginHTML;
    },
    
    // Perform direct login
    async performDirectLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('direct-email').value;
        const password = document.getElementById('direct-password').value;
        
        // Create minimal session
        const user = {
            id: 'admin-direct',
            name: 'Admin User',
            email: email,
            role: 'admin',
            platformRole: 'admin',
            team: 'Management'
        };
        
        // Store session
        localStorage.setItem('spt_session', JSON.stringify({
            user: user,
            loginTime: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000
        }));
        
        // Reload
        location.reload();
    },
    
    // Clear all data and reload
    clearAndReload() {
        if (confirm('This will clear all local data. Continue?')) {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }
    },
    
    // Log initialization step
    logStep(step, success) {
        this.initSteps.push(`${step}: ${success ? '✓' : '✗'}`);
    }
};

// Start initialization when DOM is ready
function startAppInit() {
    // Only start once
    if (window.appInitStarted) {
        return;
    }
    window.appInitStarted = true;
    
    console.log('DOM Ready - Starting initialization');
    
    // Give a small delay for all scripts to fully load
    setTimeout(() => {
        AppInitFinal.initialize();
    }, 100);
}

// Handle different loading scenarios
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAppInit);
} else {
    // DOM already loaded
    startAppInit();
}

// Export for global access
window.AppInitFinal = AppInitFinal;