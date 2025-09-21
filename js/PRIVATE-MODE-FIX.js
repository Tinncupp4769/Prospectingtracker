// ========================================
// PRIVATE MODE FIX FOR GENSPARK SPARKS
// Fixes blank screen issue in private access mode
// ========================================

console.log('🔐 PRIVATE MODE FIX LOADING...');

(function() {
    'use strict';
    
    // ================================
    // DIAGNOSIS & DEBUG SYSTEM
    // ================================
    const PrivateModeDebugger = {
        logs: [],
        startTime: Date.now(),
        
        log: function(message, type = 'info', data = null) {
            const timestamp = Date.now() - this.startTime;
            const logEntry = {
                timestamp,
                type,
                message,
                data,
                time: new Date().toISOString()
            };
            
            this.logs.push(logEntry);
            
            // Console output with styling
            const styles = {
                info: 'color: #3B82F6',
                success: 'color: #10B981',
                warning: 'color: #F59E0B',
                error: 'color: #EF4444',
                critical: 'color: #DC2626; font-weight: bold'
            };
            
            console.log(`%c[PRIVATE-MODE ${timestamp}ms] ${message}`, styles[type] || '', data || '');
            
            // Update on-screen debug panel if exists
            this.updateDebugPanel();
        },
        
        updateDebugPanel: function() {
            const panel = document.getElementById('private-mode-debug-panel');
            if (panel) {
                const recentLogs = this.logs.slice(-10).reverse();
                const logsHtml = recentLogs.map(log => {
                    const colorClass = {
                        info: 'text-blue-600',
                        success: 'text-green-600',
                        warning: 'text-yellow-600',
                        error: 'text-red-600',
                        critical: 'text-red-800 font-bold'
                    }[log.type] || 'text-gray-600';
                    
                    return `<div class="${colorClass} text-xs font-mono">
                        [${log.timestamp}ms] ${log.message}
                    </div>`;
                }).join('');
                
                panel.innerHTML = logsHtml;
            }
        },
        
        createDebugPanel: function() {
            if (!document.getElementById('private-mode-debug-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'private-mode-debug-overlay';
                overlay.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        width: 400px;
                        max-height: 200px;
                        background: rgba(255, 255, 255, 0.95);
                        border: 2px solid #4F46E5;
                        border-radius: 8px;
                        padding: 10px;
                        z-index: 999999;
                        font-family: monospace;
                        font-size: 11px;
                        overflow-y: auto;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                            <strong style="color: #4F46E5;">🔍 Private Mode Debug</strong>
                            <button onclick="document.getElementById('private-mode-debug-overlay').style.display='none'" 
                                    style="float: right; background: #EF4444; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer;">×</button>
                        </div>
                        <div id="private-mode-debug-panel" style="max-height: 150px; overflow-y: auto;"></div>
                    </div>
                `;
                document.body.appendChild(overlay);
            }
        }
    };
    
    // ================================
    // AUTHENTICATION CHECK SYSTEM
    // ================================
    const AuthenticationManager = {
        isAuthenticated: false,
        authCheckComplete: false,
        
        checkAuthentication: async function() {
            PrivateModeDebugger.log('Checking authentication status...', 'info');
            
            try {
                // Check multiple authentication methods
                const checks = {
                    localStorage: this.checkLocalStorage(),
                    sessionStorage: this.checkSessionStorage(),
                    cookies: this.checkCookies(),
                    genspark: await this.checkGensparkAuth()
                };
                
                // Determine if user is authenticated
                this.isAuthenticated = checks.localStorage || 
                                      checks.sessionStorage || 
                                      checks.cookies || 
                                      checks.genspark;
                
                this.authCheckComplete = true;
                
                PrivateModeDebugger.log(
                    `Authentication check complete: ${this.isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`,
                    this.isAuthenticated ? 'success' : 'warning',
                    checks
                );
                
                return this.isAuthenticated;
                
            } catch (error) {
                PrivateModeDebugger.log('Authentication check failed', 'error', error.message);
                this.authCheckComplete = true;
                return false;
            }
        },
        
        checkLocalStorage: function() {
            const authTokens = [
                'spt_authenticated',
                'spt_session',
                'auth_token',
                'user_session',
                'genspark_auth'
            ];
            
            for (const token of authTokens) {
                const value = localStorage.getItem(token);
                if (value && value !== 'false') {
                    PrivateModeDebugger.log(`Found auth token in localStorage: ${token}`, 'success');
                    return true;
                }
            }
            return false;
        },
        
        checkSessionStorage: function() {
            const authTokens = [
                'authenticated',
                'session_id',
                'user_token'
            ];
            
            for (const token of authTokens) {
                const value = sessionStorage.getItem(token);
                if (value && value !== 'false') {
                    PrivateModeDebugger.log(`Found auth token in sessionStorage: ${token}`, 'success');
                    return true;
                }
            }
            return false;
        },
        
        checkCookies: function() {
            const cookies = document.cookie.split(';');
            const authCookies = ['auth', 'session', 'token', 'user', 'genspark'];
            
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (authCookies.some(authName => name.toLowerCase().includes(authName)) && value) {
                    PrivateModeDebugger.log(`Found auth cookie: ${name}`, 'success');
                    return true;
                }
            }
            return false;
        },
        
        checkGensparkAuth: async function() {
            // Check for Genspark-specific authentication
            try {
                // Check if we're in Genspark environment
                if (window.parent !== window) {
                    // We're in an iframe, might be Genspark
                    PrivateModeDebugger.log('Detected iframe environment (possible Genspark)', 'info');
                    
                    // Try to communicate with parent
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => resolve(false), 1000);
                        
                        window.addEventListener('message', function handler(e) {
                            if (e.data && e.data.type === 'genspark-auth-response') {
                                clearTimeout(timeout);
                                window.removeEventListener('message', handler);
                                resolve(e.data.authenticated || false);
                            }
                        });
                        
                        window.parent.postMessage({ type: 'genspark-auth-check' }, '*');
                    });
                }
            } catch (error) {
                PrivateModeDebugger.log('Genspark auth check error', 'warning', error.message);
            }
            return false;
        },
        
        showAuthenticationPrompt: function() {
            PrivateModeDebugger.log('Showing authentication prompt', 'info');
            
            // Remove loading screen if exists
            const loader = document.getElementById('initial-loader');
            if (loader) {
                loader.style.display = 'none';
            }
            
            // Create authentication prompt
            const authPrompt = document.createElement('div');
            authPrompt.id = 'private-mode-auth-prompt';
            authPrompt.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999998;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            `;
            
            authPrompt.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    text-align: center;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                    ">
                        <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    
                    <h1 style="
                        font-size: 24px;
                        font-weight: 700;
                        color: #1a202c;
                        margin: 0 0 10px 0;
                    ">Authentication Required</h1>
                    
                    <p style="
                        color: #718096;
                        font-size: 16px;
                        line-height: 1.5;
                        margin: 0 0 30px 0;
                    ">
                        This Spark is set to private access.<br>
                        Please log in to access the Sales Activity Prospecting Tracker.
                    </p>
                    
                    <button onclick="window.location.reload()" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s;
                        margin: 0 5px;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        Try Again
                    </button>
                    
                    <button onclick="handleLoginRedirect()" style="
                        background: white;
                        color: #667eea;
                        border: 2px solid #667eea;
                        padding: 12px 30px;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        margin: 0 5px;
                    " onmouseover="this.style.background='#667eea'; this.style.color='white';" 
                       onmouseout="this.style.background='white'; this.style.color='#667eea';">
                        Log In
                    </button>
                    
                    <div style="
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                        color: #a0aec0;
                        font-size: 12px;
                    ">
                        <p>Having trouble? Contact your administrator or try:</p>
                        <ul style="list-style: none; padding: 0; margin: 10px 0 0 0;">
                            <li>• Clear your browser cache</li>
                            <li>• Check your network connection</li>
                            <li>• Ensure cookies are enabled</li>
                        </ul>
                    </div>
                </div>
            `;
            
            document.body.appendChild(authPrompt);
            
            // Add login redirect handler
            window.handleLoginRedirect = function() {
                // Try to show the login page
                const loginPage = document.getElementById('login-page');
                if (loginPage) {
                    authPrompt.style.display = 'none';
                    loginPage.style.display = 'block';
                } else {
                    // Fallback: reload and try to trigger login
                    localStorage.removeItem('spt_authenticated');
                    sessionStorage.clear();
                    window.location.reload();
                }
            };
        }
    };
    
    // ================================
    // RESOURCE LOADER WITH FALLBACKS
    // ================================
    const ResourceLoader = {
        failedResources: [],
        criticalResourcesLoaded: false,
        
        checkResources: async function() {
            PrivateModeDebugger.log('Checking resource loading...', 'info');
            
            const resources = {
                scripts: await this.checkScripts(),
                styles: await this.checkStyles(),
                data: await this.checkDataAccess(),
                dom: this.checkDOMElements()
            };
            
            this.criticalResourcesLoaded = resources.scripts && resources.styles && resources.dom;
            
            if (!this.criticalResourcesLoaded) {
                PrivateModeDebugger.log('Critical resources failed to load', 'error', this.failedResources);
                this.loadFallbackContent();
            } else {
                PrivateModeDebugger.log('All critical resources loaded successfully', 'success');
            }
            
            return this.criticalResourcesLoaded;
        },
        
        checkScripts: async function() {
            const criticalScripts = [
                'js/unified-app.js',
                'js/app.js'
            ];
            
            let allLoaded = true;
            
            for (const scriptPath of criticalScripts) {
                const script = document.querySelector(`script[src*="${scriptPath}"]`);
                if (!script) {
                    PrivateModeDebugger.log(`Script not found: ${scriptPath}`, 'warning');
                    this.failedResources.push({ type: 'script', path: scriptPath });
                    allLoaded = false;
                }
            }
            
            // Check if critical functions exist
            const criticalFunctions = ['showSection', 'loadDashboard'];
            for (const func of criticalFunctions) {
                if (typeof window[func] !== 'function') {
                    PrivateModeDebugger.log(`Critical function missing: ${func}`, 'warning');
                    this.failedResources.push({ type: 'function', name: func });
                    allLoaded = false;
                }
            }
            
            return allLoaded;
        },
        
        checkStyles: async function() {
            // Check if styles are loaded
            const hasStyles = document.styleSheets.length > 0;
            
            if (!hasStyles) {
                PrivateModeDebugger.log('No stylesheets loaded', 'warning');
                this.injectFallbackStyles();
            }
            
            return true; // Styles are non-critical
        },
        
        checkDataAccess: async function() {
            try {
                // Test localStorage access
                const testKey = 'private_mode_test';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                
                PrivateModeDebugger.log('localStorage access OK', 'success');
                return true;
            } catch (error) {
                PrivateModeDebugger.log('localStorage access blocked', 'error', error.message);
                this.failedResources.push({ type: 'storage', error: error.message });
                
                // Use memory storage as fallback
                this.setupMemoryStorage();
                return false;
            }
        },
        
        checkDOMElements: function() {
            const criticalElements = [
                'main-app',
                'login-page',
                'dashboard-section'
            ];
            
            let elementsFound = 0;
            
            for (const elementId of criticalElements) {
                const element = document.getElementById(elementId);
                if (element) {
                    elementsFound++;
                } else {
                    PrivateModeDebugger.log(`DOM element missing: ${elementId}`, 'warning');
                }
            }
            
            return elementsFound > 0; // At least one critical element should exist
        },
        
        injectFallbackStyles: function() {
            const fallbackStyles = document.createElement('style');
            fallbackStyles.innerHTML = `
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background: #f7fafc;
                    margin: 0;
                    padding: 0;
                }
                .fallback-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .fallback-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .fallback-button {
                    background: #4F46E5;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                }
                .fallback-button:hover {
                    background: #4338CA;
                }
            `;
            document.head.appendChild(fallbackStyles);
            PrivateModeDebugger.log('Fallback styles injected', 'info');
        },
        
        setupMemoryStorage: function() {
            window.memoryStorage = {};
            
            // Override localStorage with memory storage
            const originalLocalStorage = window.localStorage;
            
            window.localStorage = {
                getItem: function(key) {
                    return window.memoryStorage[key] || null;
                },
                setItem: function(key, value) {
                    window.memoryStorage[key] = value;
                },
                removeItem: function(key) {
                    delete window.memoryStorage[key];
                },
                clear: function() {
                    window.memoryStorage = {};
                }
            };
            
            PrivateModeDebugger.log('Memory storage fallback activated', 'info');
        },
        
        loadFallbackContent: function() {
            PrivateModeDebugger.log('Loading fallback content', 'info');
            
            const fallbackHTML = `
                <div class="fallback-container">
                    <div class="fallback-card">
                        <h1 style="color: #1a202c; margin-top: 0;">Sales Activity Prospecting Tracker</h1>
                        <p style="color: #718096;">Limited functionality mode - Some features may not be available</p>
                        
                        <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 6px; padding: 15px; margin: 20px 0;">
                            <strong style="color: #92400E;">⚠️ Resource Loading Issues Detected</strong>
                            <ul style="margin: 10px 0 0 20px; color: #78350F;">
                                ${this.failedResources.map(r => `<li>${r.type}: ${r.path || r.name || r.error}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <button class="fallback-button" onclick="location.reload()">
                                Retry Loading
                            </button>
                            <button class="fallback-button" style="background: #6B7280; margin-left: 10px;" 
                                    onclick="document.getElementById('private-mode-debug-overlay').style.display='block'">
                                Show Debug Info
                            </button>
                        </div>
                    </div>
                    
                    <div class="fallback-card">
                        <h2 style="color: #1a202c;">Basic Functionality</h2>
                        <p style="color: #718096;">You can still access basic features:</p>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                            <button class="fallback-button" onclick="showFallbackDashboard()">Dashboard</button>
                            <button class="fallback-button" onclick="showFallbackActivities()">Activities</button>
                            <button class="fallback-button" onclick="showFallbackUsers()">Users</button>
                            <button class="fallback-button" onclick="showFallbackSettings()">Settings</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Clear body and add fallback content
            document.body.innerHTML = fallbackHTML;
            
            // Re-add debug panel
            PrivateModeDebugger.createDebugPanel();
            
            // Define fallback functions
            window.showFallbackDashboard = () => alert('Dashboard functionality limited in fallback mode');
            window.showFallbackActivities = () => alert('Activities functionality limited in fallback mode');
            window.showFallbackUsers = () => alert('Users functionality limited in fallback mode');
            window.showFallbackSettings = () => alert('Settings functionality limited in fallback mode');
        }
    };
    
    // ================================
    // ERROR BOUNDARY SYSTEM
    // ================================
    const ErrorBoundary = {
        setup: function() {
            // Global error handler
            window.addEventListener('error', (e) => {
                PrivateModeDebugger.log(`Global error: ${e.message}`, 'error', {
                    filename: e.filename,
                    line: e.lineno,
                    column: e.colno
                });
                
                // Show error message on screen
                this.showErrorMessage(e.message);
                
                // Prevent default error handling in private mode
                if (this.isPrivateMode()) {
                    e.preventDefault();
                }
            });
            
            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (e) => {
                PrivateModeDebugger.log(`Unhandled promise rejection: ${e.reason}`, 'error');
                this.showErrorMessage(`Promise rejected: ${e.reason}`);
                e.preventDefault();
            });
        },
        
        isPrivateMode: function() {
            // Check various indicators of private mode
            try {
                // Check if localStorage is available
                const testKey = '__private_mode_test__';
                localStorage.setItem(testKey, '1');
                localStorage.removeItem(testKey);
                return false;
            } catch {
                return true;
            }
        },
        
        showErrorMessage: function(message) {
            // Don't show multiple error messages
            if (document.getElementById('private-mode-error-message')) return;
            
            const errorDiv = document.createElement('div');
            errorDiv.id = 'private-mode-error-message';
            errorDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #FEE;
                color: #C00;
                padding: 15px 20px;
                border-radius: 8px;
                border: 1px solid #FCC;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 999997;
                max-width: 500px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            `;
            
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <strong style="margin-right: 10px;">⚠️ Loading Error:</strong>
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="margin-left: auto; background: none; border: none; color: #C00; font-size: 20px; cursor: pointer;">
                        ×
                    </button>
                </div>
            `;
            
            document.body.appendChild(errorDiv);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 10000);
        }
    };
    
    // ================================
    // MAIN INITIALIZATION
    // ================================
    async function initializePrivateModeSupport() {
        console.log('🔐 Initializing Private Mode Support...');
        
        // Step 1: Setup error boundary
        ErrorBoundary.setup();
        
        // Step 2: Create debug panel
        PrivateModeDebugger.createDebugPanel();
        PrivateModeDebugger.log('Private mode support initializing...', 'info');
        
        // Step 3: Check authentication
        const isAuthenticated = await AuthenticationManager.checkAuthentication();
        
        if (!isAuthenticated) {
            PrivateModeDebugger.log('User not authenticated - showing prompt', 'warning');
            AuthenticationManager.showAuthenticationPrompt();
            return;
        }
        
        // Step 4: Check and load resources
        const resourcesLoaded = await ResourceLoader.checkResources();
        
        if (!resourcesLoaded) {
            PrivateModeDebugger.log('Resource loading failed - using fallback', 'warning');
            return;
        }
        
        // Step 5: Initialize main application
        PrivateModeDebugger.log('Initializing main application...', 'info');
        
        // Ensure main app is visible
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.opacity = '1';
        }
        
        // Hide loader
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Try to initialize the app
        if (typeof window.UnifiedApp !== 'undefined' && typeof window.UnifiedApp.init === 'function') {
            try {
                await window.UnifiedApp.init();
                PrivateModeDebugger.log('Application initialized successfully', 'success');
            } catch (error) {
                PrivateModeDebugger.log('Application initialization failed', 'error', error.message);
                ResourceLoader.loadFallbackContent();
            }
        } else {
            PrivateModeDebugger.log('UnifiedApp not found - attempting direct initialization', 'warning');
            
            // Try direct initialization
            if (typeof window.initApp === 'function') {
                window.initApp();
            } else {
                // Show the app anyway
                document.body.style.visibility = 'visible';
            }
        }
        
        PrivateModeDebugger.log('Private mode initialization complete', 'success');
    }
    
    // ================================
    // PLATFORM-SPECIFIC WORKAROUNDS
    // ================================
    const PlatformWorkarounds = {
        applyGensparkFixes: function() {
            // Fix for Genspark iframe communication
            if (window.parent !== window) {
                PrivateModeDebugger.log('Applying Genspark iframe fixes', 'info');
                
                // Listen for parent messages
                window.addEventListener('message', (e) => {
                    if (e.data && e.data.type === 'genspark-visibility-change') {
                        if (e.data.visible) {
                            document.body.style.display = 'block';
                        }
                    }
                });
                
                // Notify parent that we're ready
                window.parent.postMessage({ type: 'spark-ready' }, '*');
            }
        },
        
        fixCORSIssues: function() {
            // Add CORS headers to fetch requests
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const [url, options = {}] = args;
                
                // Add credentials for same-origin requests
                if (url.startsWith('/') || url.startsWith(window.location.origin)) {
                    options.credentials = 'same-origin';
                }
                
                return originalFetch(url, options).catch(error => {
                    PrivateModeDebugger.log(`Fetch failed: ${url}`, 'error', error.message);
                    throw error;
                });
            };
        }
    };
    
    // ================================
    // START INITIALIZATION
    // ================================
    
    // Apply platform fixes immediately
    PlatformWorkarounds.applyGensparkFixes();
    PlatformWorkarounds.fixCORSIssues();
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePrivateModeSupport);
    } else {
        // DOM already loaded
        initializePrivateModeSupport();
    }
    
    // Export for debugging
    window.PrivateModeDebugger = PrivateModeDebugger;
    window.AuthenticationManager = AuthenticationManager;
    window.ResourceLoader = ResourceLoader;
    
    console.log('✅ Private Mode Fix loaded successfully');
})();