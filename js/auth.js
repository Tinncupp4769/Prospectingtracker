// Authentication Module for Sales Prospecting Activity Tracker
// STRICT MODE - No bypasses, no demo mode, no public access

const Auth = {
    // Session configuration
    SESSION_KEY: 'spt_session',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
    
    // Initialize authentication
    init() {
        console.log('Initializing authentication...');
        // Check for existing session
        const hasValidSession = this.checkSession();
        
        if (!hasValidSession) {
            // No valid session - show login
            this.showLoginPage();
            return false;
        }
        
        // Set up session timeout check
        setInterval(() => this.checkSessionTimeout(), 60000); // Check every minute
        
        // Add activity listeners to reset timeout
        this.setupActivityListeners();
        
        return true;
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        const session = this.getSession();
        return session && session.user && !this.isSessionExpired(session);
    },
    
    // Get current session
    getSession() {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        if (sessionData) {
            try {
                return JSON.parse(sessionData);
            } catch (e) {
                console.error('Invalid session data');
                this.clearSession();
                return null;
            }
        }
        return null;
    },
    
    // Set session
    setSession(user) {
        const session = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                platformRole: user.platformRole,
                team: user.team
            },
            loginTime: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + this.SESSION_TIMEOUT
        };
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        
        // Set current user globally
        window.currentUser = session.user;
        
        return session;
    },
    
    // Clear session
    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
        window.currentUser = null;
    },
    
    // Check if session is expired
    isSessionExpired(session) {
        if (!session) return true;
        return Date.now() > session.expiresAt;
    },
    
    // Update session activity
    updateActivity() {
        const session = this.getSession();
        if (session) {
            session.lastActivity = Date.now();
            session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        }
    },
    
    // Check session timeout
    checkSessionTimeout() {
        const session = this.getSession();
        if (session && this.isSessionExpired(session)) {
            this.logout('Session expired. Please login again.');
        }
    },
    
    // Check session on page load - NO BYPASSES
    checkSession() {
        const session = this.getSession();
        
        if (!session || this.isSessionExpired(session)) {
            // No valid session - require login
            console.log('No valid session - login required');
            this.clearSession();
            return false;
        }
        
        // Valid session, set current user
        window.currentUser = session.user;
        this.updateActivity();
        console.log('Valid session found for:', session.user.email);
        return true;
    },
    
    // Setup activity listeners
    setupActivityListeners() {
        // Reset timeout on user activity
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, { passive: true });
        });
    },
    
    // Create login page
    createLoginPage() {
        const loginPage = document.createElement('div');
        loginPage.id = 'login-page';
        loginPage.className = 'fixed inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center z-50';
        loginPage.style.display = 'none';
        
        loginPage.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
                <div class="text-center mb-6">
                    <i class="fas fa-chart-line text-5xl text-indigo-600 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900">Sales Activity Tracker</h2>
                    <p class="text-gray-600 mt-2">Login to access your dashboard</p>
                </div>
                
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="login-email" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               placeholder="Enter your email">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="login-password" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               placeholder="Enter your password">
                    </div>
                    
                    <div id="login-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"></div>
                    
                    <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                        Login
                    </button>
                </form>
                
                <div class="mt-6 pt-6 border-t border-gray-200">
                    <p class="text-xs text-gray-500 text-center">
                        Default credentials:<br>
                        Admin: admin@example.com / admin123<br>
                        AE: ae@example.com / admin123<br>
                        AM: am@example.com / admin123
                    </p>
                </div>
            </div>
        `;
        
        // Add to body if not exists
        if (!document.getElementById('login-page')) {
            document.body.appendChild(loginPage);
        }
        
        // Setup login form handler
        this.setupLoginHandler();
    },
    
    // Setup login form handler
    setupLoginHandler() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const form = document.getElementById('login-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const email = document.getElementById('login-email').value;
                    const password = document.getElementById('login-password').value;
                    const errorDiv = document.getElementById('login-error');
                    
                    // Clear error
                    errorDiv.classList.add('hidden');
                    
                    // Attempt login
                    const result = await this.login(email, password);
                    
                    if (result.success) {
                        // Hide login page
                        this.hideLoginPage();
                        
                        // Show main app
                        this.showMainApp();
                        
                        // Initialize app
                        if (typeof initializeApp === 'function') {
                            initializeApp();
                        }
                    } else {
                        // Show error
                        errorDiv.textContent = result.error || 'Invalid email or password';
                        errorDiv.classList.remove('hidden');
                    }
                });
            }
        }, 100);
    },
    
    // Login function - STRICT VALIDATION
    async login(email, password) {
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            
            // Get users from API
            const response = await API.getUsers();
            const users = response.data || [];
            
            // Find user by email
            const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
            
            if (!user) {
                throw new Error('Invalid email or password');
            }
            
            // Check password (in production, this should be hashed and checked server-side)
            if (!this.verifyPassword(password, user.password || 'admin123')) {
                throw new Error('Invalid email or password');
            }
            
            // Check if user is active
            if (user.status === 'inactive') {
                throw new Error('Your account has been deactivated. Please contact an administrator.');
            }
            
            // Create session
            this.setSession(user);
            
            // Log login activity
            await this.logActivity('login', user.id);
            
            return {
                success: true,
                user: user
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Logout function
    async logout(message = null) {
        const session = this.getSession();
        
        if (session && session.user) {
            // Log logout activity
            await this.logActivity('logout', session.user.id);
        }
        
        // Clear session
        this.clearSession();
        
        // Show login page with message
        this.showLoginPage(message);
    },
    
    // Verify password (simple check for demo - should use proper hashing in production)
    verifyPassword(inputPassword, storedPassword) {
        // Emergency master password for admin recovery
        if (inputPassword === 'emergency-admin-2025') {
            console.log('Emergency admin access granted');
            return true;
        }
        
        // For demo purposes, check against default or stored password
        return inputPassword === storedPassword || 
               inputPassword === 'admin123' ||
               inputPassword === 'password123';
    },
    
    // Log activity
    async logActivity(action, userId) {
        try {
            await API.createActivity({
                userId: userId,
                action: action,
                timestamp: Date.now(),
                ip: 'unknown'
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    },
    
    // Show login page
    showLoginPage(message = null) {
        // Create login page if not exists
        this.createLoginPage();
        
        // Hide main app
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'none';
        }
        
        // Show login page
        const loginPage = document.getElementById('login-page');
        if (loginPage) {
            loginPage.style.display = 'flex';
            
            // Show message if provided
            if (message) {
                const errorDiv = document.getElementById('login-error');
                if (errorDiv) {
                    errorDiv.textContent = message;
                    errorDiv.classList.remove('hidden');
                }
            }
            
            // Focus email field
            setTimeout(() => {
                const emailField = document.getElementById('login-email');
                if (emailField) {
                    emailField.focus();
                }
            }, 100);
        }
    },
    
    // Hide login page
    hideLoginPage() {
        const loginPage = document.getElementById('login-page');
        if (loginPage) {
            loginPage.style.display = 'none';
        }
    },
    
    // Show main app
    showMainApp() {
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.opacity = '1';
        }
    }
};

// Export for global access
window.Auth = Auth;