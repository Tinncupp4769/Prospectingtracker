// Unified App Controller - Single source of truth for the entire application
// This replaces ALL other initialization systems

const UnifiedApp = {
    // Core configuration
    config: {
        debugMode: true,
        sessionKey: 'spt_session',
        sessionDuration: 30 * 60 * 1000, // 30 minutes
        storagePrefix: 'unified_'
    },
    
    // Application state
    state: {
        initialized: false,
        authenticated: false,
        currentUser: null,
        currentView: 'dashboard'
    },
    
    // Initialize everything
    async init() {
        console.log('=== UNIFIED APP INITIALIZATION ===');
        
        // Prevent multiple initializations
        if (this.state.initialized) {
            console.log('App already initialized');
            return;
        }
        
        try {
            // Step 1: Setup data storage
            this.initStorage();
            
            // Step 2: Check authentication
            this.checkAuth();
            
            // Step 3: Setup UI
            this.setupUI();
            
            // Step 4: Show appropriate view
            if (this.state.authenticated) {
                this.showMainApp();
            } else {
                this.showLogin();
            }
            
            this.state.initialized = true;
            console.log('=== APP READY ===');
            
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError(error);
        }
    },
    
    // Initialize storage with default data
    initStorage() {
        console.log('Initializing storage...');
        
        // Check if we have users
        const users = this.getData('users');
        if (!users || users.length === 0) {
            this.setData('users', this.getDefaultUsers());
            console.log('Created default users');
        }
        
        // Check if we have goals
        const goals = this.getData('goals');
        if (!goals || goals.length === 0) {
            this.setData('goals', this.getDefaultGoals());
            console.log('Created default goals');
        }
        
        // Check if we have activities
        const activities = this.getData('activities');
        if (!activities || activities.length === 0) {
            this.setData('activities', this.generateSampleActivities());
            console.log('Created sample activities');
        }
    },
    
    // Get default users including Bryan Miller
    getDefaultUsers() {
        return [
            {
                id: 'bmiller-001',
                firstName: 'Bryan',
                lastName: 'Miller',
                name: 'Bryan Miller',
                email: 'bmiller@ascm.org',
                username: 'bmiller',
                password: 'admin123',
                role: 'admin',
                platformRole: 'admin',
                team: 'ASCM Leadership',
                status: 'active'
            },
            {
                id: 'admin-001',
                firstName: 'Admin',
                lastName: 'User',
                name: 'Admin User',
                email: 'admin@example.com',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                platformRole: 'admin',
                team: 'Management',
                status: 'active'
            },
            {
                id: 'ae-001',
                firstName: 'Sarah',
                lastName: 'Johnson',
                name: 'Sarah Johnson',
                email: 'sjohnson@example.com',
                username: 'sjohnson',
                password: 'password123',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team A',
                status: 'active'
            },
            {
                id: 'am-001',
                firstName: 'Michael',
                lastName: 'Chen',
                name: 'Michael Chen',
                email: 'mchen@example.com',
                username: 'mchen',
                password: 'password123',
                role: 'am',
                platformRole: 'user',
                team: 'Account Management',
                status: 'active'
            }
        ];
    },
    
    // Get default goals
    getDefaultGoals() {
        return [
            { id: 'goal-1', role: 'ae', metric: 'calls_made', target: 150, period: 'weekly' },
            { id: 'goal-2', role: 'ae', metric: 'emails_sent', target: 300, period: 'weekly' },
            { id: 'goal-3', role: 'ae', metric: 'meetings_booked', target: 15, period: 'weekly' },
            { id: 'goal-4', role: 'am', metric: 'calls_made', target: 100, period: 'weekly' },
            { id: 'goal-5', role: 'am', metric: 'emails_sent', target: 200, period: 'weekly' },
            { id: 'goal-6', role: 'am', metric: 'meetings_booked', target: 10, period: 'weekly' }
        ];
    },
    
    // Generate sample activities
    generateSampleActivities() {
        const activities = [];
        const users = this.getData('users').filter(u => u.role !== 'admin');
        const today = new Date();
        
        users.forEach(user => {
            // Generate activities for last 4 weeks
            for (let week = 0; week < 4; week++) {
                activities.push({
                    id: `activity-${user.id}-week${week}`,
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    week: week,
                    calls_made: Math.floor(Math.random() * 50) + 20,
                    emails_sent: Math.floor(Math.random() * 100) + 50,
                    meetings_booked: Math.floor(Math.random() * 10) + 2,
                    createdAt: Date.now() - (week * 7 * 24 * 60 * 60 * 1000)
                });
            }
        });
        
        return activities;
    },
    
    // Check authentication
    checkAuth() {
        console.log('Checking authentication...');
        
        const sessionStr = localStorage.getItem(this.config.sessionKey);
        if (!sessionStr) {
            this.state.authenticated = false;
            return;
        }
        
        try {
            const session = JSON.parse(sessionStr);
            
            // Check if expired
            if (Date.now() > session.expiresAt) {
                console.log('Session expired');
                localStorage.removeItem(this.config.sessionKey);
                this.state.authenticated = false;
                return;
            }
            
            this.state.authenticated = true;
            this.state.currentUser = session.user;
            console.log('User authenticated:', session.user.name);
            
        } catch (e) {
            console.error('Invalid session');
            localStorage.removeItem(this.config.sessionKey);
            this.state.authenticated = false;
        }
    },
    
    // Setup UI
    setupUI() {
        console.log('Setting up UI...');
        
        // Hide initial loader
        const loader = document.getElementById('initial-loader');
        if (loader) loader.style.display = 'none';
        
        // Setup login form if it exists
        const loginForm = document.getElementById('login-form');
        if (loginForm && !loginForm.hasAttribute('data-initialized')) {
            loginForm.setAttribute('data-initialized', 'true');
            loginForm.onsubmit = (e) => this.handleLogin(e);
        }
        
        // Setup logout buttons
        document.querySelectorAll('[onclick*="logout"]').forEach(btn => {
            btn.onclick = () => this.logout();
        });
    },
    
    // Show login page
    showLogin() {
        console.log('Showing login page...');
        
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (mainApp) mainApp.style.display = 'none';
        
        if (!loginPage) {
            console.error('Login page not found - creating one');
            this.createLoginPage();
            return;
        }
        
        loginPage.style.display = 'flex';
        loginPage.style.position = 'fixed';
        loginPage.style.top = '0';
        loginPage.style.left = '0';
        loginPage.style.right = '0';
        loginPage.style.bottom = '0';
        loginPage.style.alignItems = 'center';
        loginPage.style.justifyContent = 'center';
        loginPage.style.background = 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
        loginPage.style.zIndex = '9999';
        loginPage.innerHTML = this.getLoginHTML();
        
        // Setup form handler
        setTimeout(() => {
            const form = document.getElementById('login-form');
            if (form) {
                form.onsubmit = (e) => this.handleLogin(e);
            }
        }, 100);
    },
    
    // Create login page if missing
    createLoginPage() {
        const loginDiv = document.createElement('div');
        loginDiv.id = 'login-page';
        loginDiv.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;min-height:100vh;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);z-index:9999;';
        loginDiv.innerHTML = this.getLoginHTML();
        document.body.appendChild(loginDiv);
        
        // Setup form handler
        setTimeout(() => {
            const form = document.getElementById('login-form');
            if (form) {
                form.onsubmit = (e) => this.handleLogin(e);
            }
        }, 100);
    },
    
    // Get login HTML
    getLoginHTML() {
        return `
            <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-900">Sales Tracker</h1>
                    <p class="text-gray-600 mt-2">Sign in to continue</p>
                </div>
                
                <form id="login-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="login-email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="login-password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    </div>
                    
                    <div id="login-error" class="hidden mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm"></div>
                    
                    <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 font-medium">
                        Sign In
                    </button>
                </form>
                
                <div class="mt-6 pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600 text-center mb-4">Quick access:</p>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="UnifiedApp.quickLogin('bmiller@ascm.org', 'admin123')" class="bg-purple-100 text-purple-700 px-3 py-2 rounded text-sm hover:bg-purple-200">
                            Bryan Miller
                        </button>
                        <button onclick="UnifiedApp.quickLogin('admin@example.com', 'admin123')" class="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200">
                            Admin
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Handle login
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        console.log('Attempting login:', email);
        
        // Get users
        const users = this.getData('users');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            this.showLoginError('Invalid email or password');
            return;
        }
        
        // Create session
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
            expiresAt: Date.now() + this.config.sessionDuration
        };
        
        localStorage.setItem(this.config.sessionKey, JSON.stringify(session));
        
        this.state.authenticated = true;
        this.state.currentUser = session.user;
        
        console.log('Login successful');
        this.showMainApp();
    },
    
    // Quick login
    quickLogin(email, password) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
        document.getElementById('login-form').dispatchEvent(new Event('submit'));
    },
    
    // Show login error
    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    },
    
    // Show main app
    showMainApp() {
        console.log('Showing main app...');
        
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage) loginPage.style.display = 'none';
        
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.opacity = '1';
            
            // Initialize app components
            this.initializeComponents();
            
            // Show dashboard
            setTimeout(() => {
                if (typeof showSection === 'function') {
                    showSection('dashboard');
                }
            }, 100);
        }
    },
    
    // Initialize app components
    initializeComponents() {
        console.log('Initializing components...');
        
        // Setup global API
        window.API = this.createAPI();
        
        // Initialize app.js if available
        if (typeof initializeApp === 'function') {
            try {
                initializeApp();
            } catch (e) {
                console.warn('App.js init failed:', e);
            }
        }
        
        // Update user display
        this.updateUserDisplay();
    },
    
    // Create API interface
    createAPI() {
        const self = this;
        return {
            async getUsers(filters = {}) {
                await self.delay();
                let users = self.getData('users');
                if (filters.role) users = users.filter(u => u.role === filters.role);
                return { data: users, total: users.length };
            },
            
            async getUser(userId) {
                await self.delay();
                const users = self.getData('users');
                const user = users.find(u => u.id === userId);
                return { data: user };
            },
            
            async createUser(userData) {
                await self.delay();
                const users = self.getData('users');
                userData.id = userData.id || `user-${Date.now()}`;
                users.push(userData);
                self.setData('users', users);
                return userData;
            },
            
            async updateUser(userId, userData) {
                await self.delay();
                const users = self.getData('users');
                const index = users.findIndex(u => u.id === userId);
                if (index >= 0) {
                    users[index] = { ...users[index], ...userData };
                    self.setData('users', users);
                    return users[index];
                }
                throw new Error('User not found');
            },
            
            async deleteUser(userId) {
                await self.delay();
                const users = self.getData('users');
                const filtered = users.filter(u => u.id !== userId);
                self.setData('users', filtered);
                return null;
            },
            
            async getActivities(filters = {}) {
                await self.delay();
                let activities = self.getData('activities');
                if (filters.userId) activities = activities.filter(a => a.userId === filters.userId);
                return { data: activities, total: activities.length };
            },
            
            async createActivity(data) {
                await self.delay();
                const activities = self.getData('activities');
                data.id = data.id || `activity-${Date.now()}`;
                activities.push(data);
                self.setData('activities', activities);
                return data;
            },
            
            async updateActivity(id, data) {
                await self.delay();
                const activities = self.getData('activities');
                const index = activities.findIndex(a => a.id === id);
                if (index >= 0) {
                    activities[index] = { ...activities[index], ...data };
                    self.setData('activities', activities);
                    return activities[index];
                }
                throw new Error('Activity not found');
            },
            
            async deleteActivity(id) {
                await self.delay();
                const activities = self.getData('activities');
                const filtered = activities.filter(a => a.id !== id);
                self.setData('activities', filtered);
                return null;
            },
            
            async getGoals(filters = {}) {
                await self.delay();
                let goals = self.getData('goals');
                if (filters.role) goals = goals.filter(g => g.role === filters.role);
                return { data: goals, total: goals.length };
            },
            
            async createGoal(data) {
                await self.delay();
                const goals = self.getData('goals');
                data.id = data.id || `goal-${Date.now()}`;
                goals.push(data);
                self.setData('goals', goals);
                return data;
            },
            
            async updateGoal(id, data) {
                await self.delay();
                const goals = self.getData('goals');
                const index = goals.findIndex(g => g.id === id);
                if (index >= 0) {
                    goals[index] = { ...goals[index], ...data };
                    self.setData('goals', goals);
                    return goals[index];
                }
                throw new Error('Goal not found');
            },
            
            async deleteGoal(id) {
                await self.delay();
                const goals = self.getData('goals');
                const filtered = goals.filter(g => g.id !== id);
                self.setData('goals', filtered);
                return null;
            }
        };
    },
    
    // Update user display
    updateUserDisplay() {
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');
        
        if (userNameEl && this.state.currentUser) {
            userNameEl.textContent = this.state.currentUser.name;
        }
        
        if (userRoleEl && this.state.currentUser) {
            const roleLabels = {
                'admin': 'Administrator',
                'ae': 'Account Executive',
                'am': 'Account Manager'
            };
            userRoleEl.textContent = roleLabels[this.state.currentUser.role] || 'User';
        }
    },
    
    // Logout
    logout() {
        console.log('Logging out...');
        localStorage.removeItem(this.config.sessionKey);
        this.state.authenticated = false;
        this.state.currentUser = null;
        location.reload();
    },
    
    // Show error
    showError(error) {
        console.error('Showing error screen:', error);
        
        // Hide everything
        ['initial-loader', 'login-page', 'main-app'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 bg-red-50 flex items-center justify-center p-8';
        errorDiv.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-8 max-w-lg text-center">
                <h2 class="text-2xl font-bold text-red-600 mb-4">Initialization Error</h2>
                <p class="text-gray-600 mb-6">${error.message}</p>
                <button onclick="location.reload()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Reload Page
                </button>
                <button onclick="UnifiedApp.reset()" class="ml-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                    Reset App
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    },
    
    // Reset application
    reset() {
        if (confirm('This will clear all data. Continue?')) {
            localStorage.clear();
            location.reload();
        }
    },
    
    // Utility functions
    getData(key) {
        try {
            const data = localStorage.getItem(this.config.storagePrefix + key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error getting data:', e);
            return [];
        }
    },
    
    setData(key, value) {
        try {
            localStorage.setItem(this.config.storagePrefix + key, JSON.stringify(value));
        } catch (e) {
            console.error('Error setting data:', e);
        }
    },
    
    async delay(ms = 50) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UnifiedApp.init());
} else {
    UnifiedApp.init();
}

// Make globally available
window.UnifiedApp = UnifiedApp;

// Create APP_CONFIG for compatibility
window.APP_CONFIG = {
    environment: 'production',
    apiBaseUrl: '',
    requireAuth: true
};

// Override any conflicting Auth object
window.Auth = {
    isAuthenticated: () => UnifiedApp.state.authenticated,
    getCurrentUser: () => UnifiedApp.state.currentUser,
    logout: () => UnifiedApp.logout(),
    showLoginPage: (message) => {
        if (message) console.log('Login required:', message);
        UnifiedApp.showLogin();
    },
    getSession: () => {
        const sessionStr = localStorage.getItem(UnifiedApp.config.sessionKey);
        return sessionStr ? JSON.parse(sessionStr) : null;
    },
    createLoginPage: () => {}, // No-op, already created
    init: () => {}, // No-op, already initialized
    protectRoute: (route) => {
        // Check if user is authenticated
        if (!UnifiedApp.state.authenticated) {
            UnifiedApp.showLogin();
            return false;
        }
        return true;
    },
    hasPermission: (action) => {
        // Check permissions based on user role
        const user = UnifiedApp.state.currentUser;
        if (!user) return false;
        
        // Admins have all permissions
        if (user.platformRole === 'admin' || user.role === 'admin') {
            return true;
        }
        
        // Check specific permissions
        const permissions = {
            'view_goals': true,
            'edit_goals': user.platformRole === 'admin',
            'view_users': true,
            'edit_users': user.platformRole === 'admin',
            'view_dashboard': true,
            'view_leaderboard': true
        };
        
        return permissions[action] || false;
    }
};

console.log('✅ Unified App Controller Loaded');