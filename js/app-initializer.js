// Application Initializer - Handles startup and ensures proper loading
// This module coordinates all initialization to prevent errors

const AppInitializer = {
    initialized: false,
    initAttempts: 0,
    maxAttempts: 3,
    modules: {
        config: false,
        api: false,
        auth: false,
        errorRecovery: false,
        performance: false
    },
    
    // Main initialization function
    async initialize() {
        console.log('Starting application initialization...');
        
        // Prevent multiple initializations
        if (this.initialized) {
            console.log('App already initialized');
            return true;
        }
        
        // Show loading state
        this.showLoadingState();
        
        try {
            // Step 1: Load core configuration
            await this.loadConfiguration();
            
            // Step 2: Initialize API with proper config
            await this.initializeAPI();
            
            // Step 3: Setup authentication based on mode
            await this.setupAuthentication();
            
            // Step 4: Initialize optional modules
            await this.initializeOptionalModules();
            
            // Step 5: Load initial data
            await this.loadInitialData();
            
            // Step 6: Setup UI
            await this.setupUI();
            
            this.initialized = true;
            console.log('✅ Application initialized successfully');
            
            // Hide loading state and show app
            this.hideLoadingState();
            this.showApplication();
            
            return true;
            
        } catch (error) {
            console.error('Initialization failed:', error);
            this.handleInitializationError(error);
            return false;
        }
    },
    
    // Load configuration
    async loadConfiguration() {
        console.log('Loading configuration...');
        
        // Set default configuration if not present
        if (typeof APP_CONFIG === 'undefined') {
            window.APP_CONFIG = {
                environment: this.detectEnvironment(),
                accessMode: this.detectAccessMode(),
                publicAccess: false,
                requireAuth: true,
                apiBaseUrl: '',
                apiTimeout: 30000,
                maxRetries: 3,
                enableCaching: true,
                enableOfflineMode: true
            };
        }
        
        // Apply access mode from URL or storage
        this.applyAccessMode();
        
        this.modules.config = true;
        console.log('Configuration loaded:', APP_CONFIG.accessMode, 'mode');
    },
    
    // Detect environment
    detectEnvironment() {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        return 'production';
    },
    
    // Detect access mode
    detectAccessMode() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check URL parameters first
        if (urlParams.get('public') === 'true') {
            return 'public';
        }
        if (urlParams.get('demo') === 'true') {
            return 'demo';
        }
        
        // Check stored preference
        const storedMode = localStorage.getItem('app_access_mode');
        if (storedMode) {
            return storedMode;
        }
        
        // Default based on environment
        return this.detectEnvironment() === 'development' ? 'development' : 'authenticated';
    },
    
    // Apply access mode settings
    applyAccessMode() {
        const mode = APP_CONFIG.accessMode;
        
        switch(mode) {
            case 'public':
            case 'demo':
            case 'development':
                APP_CONFIG.requireAuth = false;
                APP_CONFIG.publicAccess = true;
                console.log(`Running in ${mode} mode - authentication disabled`);
                break;
            case 'authenticated':
            default:
                APP_CONFIG.requireAuth = true;
                APP_CONFIG.publicAccess = false;
                console.log('Running in authenticated mode - login required');
                break;
        }
    },
    
    // Initialize API module
    async initializeAPI() {
        console.log('Initializing API...');
        
        // Wait for API module to be available
        let attempts = 0;
        while (typeof API === 'undefined' && attempts < 10) {
            await this.delay(100);
            attempts++;
        }
        
        if (typeof API === 'undefined') {
            throw new Error('API module not loaded');
        }
        
        // Configure API
        API.baseURL = APP_CONFIG.apiBaseUrl || '';
        
        // Test API connectivity
        try {
            // Use a lightweight endpoint for testing
            const testResponse = await fetch(`${API.baseURL}tables/users?limit=1`);
            if (!testResponse.ok && testResponse.status !== 404) {
                console.warn('API may not be fully available:', testResponse.status);
                // Don't throw error, allow offline mode
            }
        } catch (error) {
            console.warn('API connectivity test failed, enabling offline mode:', error);
            APP_CONFIG.enableOfflineMode = true;
        }
        
        this.modules.api = true;
        console.log('API initialized');
    },
    
    // Setup authentication
    async setupAuthentication() {
        console.log('Setting up authentication...');
        
        // Wait for Auth module
        let attempts = 0;
        while (typeof Auth === 'undefined' && attempts < 10) {
            await this.delay(100);
            attempts++;
        }
        
        if (typeof Auth === 'undefined') {
            console.warn('Auth module not loaded, creating fallback');
            // Create minimal auth fallback
            window.Auth = {
                isAuthenticated: () => !APP_CONFIG.requireAuth,
                getSession: () => ({ user: this.getDefaultUser() }),
                showLoginPage: () => console.log('Login page requested'),
                protectRoute: () => true
            };
        }
        
        // Initialize Auth
        if (Auth.init) {
            Auth.init();
        }
        
        // Handle authentication based on mode
        if (!APP_CONFIG.requireAuth) {
            // Create automatic session for public/demo/dev modes
            const defaultUser = this.getDefaultUser();
            if (Auth.setSession) {
                Auth.setSession(defaultUser);
            }
            window.currentUser = defaultUser;
            console.log('Auto-login enabled for', APP_CONFIG.accessMode, 'mode');
        } else {
            // Check for existing session
            if (!Auth.isAuthenticated()) {
                console.log('Authentication required');
                // Don't throw error, let Auth module handle login
            }
        }
        
        this.modules.auth = true;
        console.log('Authentication setup complete');
    },
    
    // Get default user for non-authenticated modes
    getDefaultUser() {
        const mode = APP_CONFIG.accessMode;
        
        switch(mode) {
            case 'demo':
                return {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@example.com',
                    role: 'ae',
                    platformRole: 'admin',
                    team: 'Demo Team'
                };
            case 'public':
                return {
                    id: 'public-user',
                    name: 'Public Viewer',
                    email: 'public@example.com',
                    role: 'ae',
                    platformRole: 'user',
                    team: 'Public'
                };
            case 'development':
                return {
                    id: 'dev-user',
                    name: 'Developer',
                    email: 'dev@localhost',
                    role: 'admin',
                    platformRole: 'admin',
                    team: 'Development'
                };
            default:
                return null;
        }
    },
    
    // Initialize optional modules
    async initializeOptionalModules() {
        console.log('Initializing optional modules...');
        
        // Error Recovery
        if (typeof ErrorRecovery !== 'undefined') {
            ErrorRecovery.init();
            this.modules.errorRecovery = true;
            console.log('Error recovery enabled');
        }
        
        // Performance Optimizer - wrap in try-catch to prevent failures
        if (typeof PerformanceOptimizer !== 'undefined') {
            try {
                PerformanceOptimizer.init();
                this.modules.performance = true;
                console.log('Performance optimizer enabled');
            } catch (error) {
                console.warn('Performance optimizer failed (non-fatal):', error);
                // Continue without performance optimization
            }
        }
        
        // View Cache Manager (for fast switching)
        if (typeof ViewCacheManager === 'undefined') {
            // Create it if it doesn't exist
            window.ViewCacheManager = this.createViewCacheManager();
        }
        ViewCacheManager.init();
        console.log('View cache manager enabled');
    },
    
    // Create view cache manager for fast page/view switching
    createViewCacheManager() {
        return {
            cache: new Map(),
            maxAge: 60000, // 1 minute
            
            init() {
                console.log('View cache manager initialized');
            },
            
            get(key) {
                const item = this.cache.get(key);
                if (item && Date.now() - item.timestamp < this.maxAge) {
                    console.log('Cache hit for:', key);
                    return item.data;
                }
                return null;
            },
            
            set(key, data) {
                this.cache.set(key, {
                    data: data,
                    timestamp: Date.now()
                });
                
                // Limit cache size
                if (this.cache.size > 50) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
            },
            
            clear() {
                this.cache.clear();
            },
            
            clearOld() {
                const now = Date.now();
                for (const [key, item] of this.cache.entries()) {
                    if (now - item.timestamp > this.maxAge) {
                        this.cache.delete(key);
                    }
                }
            }
        };
    },
    
    // Load initial data
    async loadInitialData() {
        console.log('Loading initial data...');
        
        // Only load if authenticated or in demo mode
        if (!APP_CONFIG.requireAuth || (Auth && Auth.isAuthenticated())) {
            try {
                // Load in parallel but don't fail if any single load fails
                await Promise.allSettled([
                    this.loadUserData(),
                    this.loadDashboardData(),
                    this.loadGoalsData()
                ]);
            } catch (error) {
                console.warn('Some initial data failed to load:', error);
                // Continue anyway
            }
        }
        
        console.log('Initial data loaded');
    },
    
    // Load user data safely
    async loadUserData() {
        try {
            if (typeof loadUserData === 'function') {
                await loadUserData();
            } else if (typeof API !== 'undefined' && API.getUsers) {
                const users = await API.getUsers();
                window.allUsers = users.data || [];
            }
        } catch (error) {
            console.warn('Failed to load user data:', error);
            window.allUsers = [];
        }
    },
    
    // Load dashboard data safely
    async loadDashboardData() {
        try {
            if (typeof loadDashboardMetrics === 'function') {
                await loadDashboardMetrics();
            }
        } catch (error) {
            console.warn('Failed to load dashboard data:', error);
        }
    },
    
    // Load goals data safely
    async loadGoalsData() {
        try {
            if (typeof loadGoals === 'function') {
                await loadGoals();
            }
        } catch (error) {
            console.warn('Failed to load goals data:', error);
        }
    },
    
    // Setup UI
    async setupUI() {
        console.log('Setting up UI...');
        
        // Update user info if available
        if (typeof updateUserInfo === 'function') {
            updateUserInfo();
        }
        
        // Setup event listeners if available
        if (typeof setupEventListeners === 'function') {
            setupEventListeners();
        }
        
        // Initialize charts after a delay
        setTimeout(() => {
            if (typeof initializeCharts === 'function') {
                try {
                    initializeCharts();
                } catch (error) {
                    console.warn('Chart initialization failed:', error);
                }
            }
        }, 500);
        
        console.log('UI setup complete');
    },
    
    // Show loading state
    showLoadingState() {
        // Use existing loader or create one
        let loader = document.getElementById('app-loader') || document.getElementById('initial-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'app-loader';
            loader.className = 'fixed inset-0 bg-white z-50 flex items-center justify-center';
            loader.innerHTML = `
                <div class="text-center">
                    <div class="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div class="w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin absolute -mt-16" 
                         style="border-right-color: transparent; border-bottom-color: transparent;"></div>
                    <p class="mt-4 text-gray-600">Initializing application...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    },
    
    // Hide loading state
    hideLoadingState() {
        const loaders = ['app-loader', 'initial-loader'].map(id => document.getElementById(id)).filter(Boolean);
        loaders.forEach(loader => {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        });
    },
    
    // Show application
    showApplication() {
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.opacity = '1';
        }
        
        // Show dashboard by default
        if (typeof showSection === 'function') {
            showSection('dashboard');
        }
    },
    
    // Handle initialization error
    handleInitializationError(error) {
        console.error('Failed to initialize application:', error);
        
        this.initAttempts++;
        
        if (this.initAttempts < this.maxAttempts) {
            console.log(`Retrying initialization (attempt ${this.initAttempts + 1}/${this.maxAttempts})...`);
            setTimeout(() => {
                this.initialize();
            }, 2000);
        } else {
            this.showErrorPage(error);
        }
    },
    
    // Show error page
    showErrorPage(error) {
        this.hideLoadingState();
        
        const errorPage = document.createElement('div');
        errorPage.className = 'fixed inset-0 bg-white z-50 flex items-center justify-center p-8';
        errorPage.innerHTML = `
            <div class="max-w-md text-center">
                <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Initialization Failed</h2>
                <p class="text-gray-600 mb-6">The application couldn't start properly. This might be temporary.</p>
                
                <div class="space-y-3">
                    <button onclick="location.reload()" class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                        <i class="fas fa-redo mr-2"></i>Try Again
                    </button>
                    <button onclick="AppInitializer.tryOfflineMode()" class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300">
                        <i class="fas fa-wifi-slash mr-2"></i>Continue Offline
                    </button>
                    <button onclick="AppInitializer.tryPublicMode()" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
                        <i class="fas fa-globe mr-2"></i>Try Public Mode
                    </button>
                </div>
                
                <details class="mt-6 text-left">
                    <summary class="cursor-pointer text-sm text-gray-500">Technical Details</summary>
                    <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">${error.toString()}</pre>
                </details>
            </div>
        `;
        document.body.appendChild(errorPage);
    },
    
    // Try offline mode
    tryOfflineMode() {
        localStorage.setItem('app_access_mode', 'demo');
        localStorage.setItem('offline_mode', 'true');
        location.reload();
    },
    
    // Try public mode
    tryPublicMode() {
        localStorage.setItem('app_access_mode', 'public');
        location.reload();
    },
    
    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// DISABLED - Using StartupCoordinator instead
// AppInitializer is now available but not auto-starting
window.appInitializerStarted = true; // Prevent auto-start
console.log('AppInitializer available but not auto-starting (using StartupCoordinator)');

// Export for global access
window.AppInitializer = AppInitializer;