// Sales Prospecting Activity Tracker - Main Application Logic

// Global state - currentUser will be set by Auth module
let currentUser = null;

let currentView = 'dashboard';
let dashboardView = 'ae';

// Get current week in YYYY-Wxx format
function getCurrentWeek() {
    const date = new Date();
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const days = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Set current date and time
function setCurrentDateTime() {
    const now = new Date();
    const dateTimeElements = document.querySelectorAll('[data-current-datetime]');
    dateTimeElements.forEach(element => {
        element.textContent = now.toLocaleString();
    });
}

// Initialize app on page load - coordinate with AppInitializer
if (!window.appJsInitialized) {
    window.appJsInitialized = true;
    
    document.addEventListener('DOMContentLoaded', function() {
        // Check if AppInitializer is handling initialization
        if (typeof AppInitializer !== 'undefined' && window.appInitializerStarted) {
            console.log('Initialization delegated to AppInitializer');
            // AppInitializer will call initializeApp when ready
            return;
        }
        
        // Fallback to original initialization if AppInitializer not available
        setTimeout(() => {
            if (!window.initialized && typeof AppInitializer === 'undefined') {
                console.log('Using fallback initialization');
                initializeAppSafely().then(() => {
                    console.log('App initialized via fallback');
                    window.initialized = true;
                }).catch(error => {
                    console.error('Fallback initialization failed:', error);
                    showInitializationError(error);
                });
            }
        }, 500);
    });
}

// Safe app initialization
async function initializeAppSafely() {
    try {
        // Check if error recovery is available
        if (typeof ErrorRecovery !== 'undefined') {
            ErrorRecovery.init();
        }
        
        // Check if performance optimizer is available
        if (typeof PerformanceOptimizer !== 'undefined') {
            PerformanceOptimizer.init();
        }
        
        // Initialize core app
        await initializeApp();
        
        // Initialize dashboard periods if function exists
        if (typeof initializeDashboardPeriods === 'function') {
            initializeDashboardPeriods();
        }
        
        // Show dashboard section on load
        showSection('dashboard');
        
        // Set current date/time if function exists
        if (typeof setCurrentDateTime === 'function') {
            setCurrentDateTime();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        throw error;
    }
}

// Show loading state
function showAppLoadingState() {
    const loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.className = 'fixed inset-0 bg-white z-50 flex items-center justify-center';
    loader.innerHTML = `
        <div class="text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
            <p class="text-gray-600">Loading application...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

// Hide loading state
function hideAppLoadingState() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 300);
    }
}

// Show initialization error
function showInitializationError(error) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'fixed inset-0 bg-white z-50 flex items-center justify-center p-8';
    errorContainer.innerHTML = `
        <div class="max-w-md text-center">
            <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Initialization Error</h2>
            <p class="text-gray-600 mb-6">The application encountered an error during startup. This might be due to connectivity issues or configuration problems.</p>
            <div class="space-y-3">
                <button onclick="location.reload()" class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                    <i class="fas fa-redo mr-2"></i>Refresh Page
                </button>
                <button onclick="tryOfflineMode()" class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                    <i class="fas fa-wifi-slash mr-2"></i>Continue Offline
                </button>
            </div>
            <details class="mt-6 text-left">
                <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">Technical Details</summary>
                <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">${error.toString()}</pre>
            </details>
        </div>
    `;
    document.body.appendChild(errorContainer);
}

// Try offline mode
function tryOfflineMode() {
    localStorage.setItem('offline_mode', 'true');
    location.reload();
}

// Update navigation visibility based on user role
function updateNavigationVisibility() {
    // Check if currentUser exists
    if (!currentUser) return;
    
    // ONLY platform admin should see admin features
    const isAdmin = currentUser.platformRole === 'admin';
    
    // Show/hide admin-only navigation items
    const goalsNav = document.querySelector('[onclick="showSection(\'goals\')"]');
    const usersNav = document.querySelector('[onclick="showSection(\'users\')"]');
    
    if (goalsNav) {
        const parentLi = goalsNav.closest('li');
        if (parentLi) {
            parentLi.style.display = isAdmin ? '' : 'none';
        } else {
            goalsNav.style.display = isAdmin ? '' : 'none';
        }
    }
    if (usersNav) {
        const parentLi = usersNav.closest('li');
        if (parentLi) {
            parentLi.style.display = isAdmin ? '' : 'none';
        } else {
            usersNav.style.display = isAdmin ? '' : 'none';
        }
    }
}

// Initialize application with better error handling
async function initializeApp() {
    try {
        // Check if we need authentication
        const needsAuth = window.APP_CONFIG ? APP_CONFIG.requireAuth : true;
        
        if (needsAuth) {
            // Check authentication
            if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
                if (typeof Auth !== 'undefined') {
                    Auth.showLoginPage();
                } else {
                    console.error('Auth module not loaded');
                    throw new Error('Authentication module not available');
                }
                return;
            }
        }
        
        // Get current user from session
        const session = Auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            window.currentUser = currentUser; // Make globally available
        }
        
        // Set user info
        updateUserInfo();
        
        // Load initial data with error handling
        await Promise.allSettled([
            loadUserDataSafely(),
            loadActivitiesSafely(),
            loadGoalsSafely()
        ]);
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize charts with delay and error handling
        requestIdleCallback(() => {
            if (typeof initializeCharts === 'function') {
                try {
                    initializeCharts();
                } catch (error) {
                    console.error('Chart initialization failed:', error);
                }
            }
        }, { timeout: 2000 });
        
        // Set initial view to dashboard
        currentView = 'dashboard';
        
        // Show main app
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'block';
        }
    } catch (error) {
        console.error('App initialization error:', error);
        throw error;
    }
}

// Safe data loading functions
async function loadUserDataSafely() {
    try {
        if (typeof loadUserData === 'function') {
            await loadUserData();
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
        // Continue with app even if user data fails
    }
}

async function loadActivitiesSafely() {
    try {
        if (typeof loadActivities === 'function') {
            await loadActivities();
        }
    } catch (error) {
        console.error('Failed to load activities:', error);
        // Continue with app even if activities fail
    }
}

async function loadGoalsSafely() {
    try {
        if (typeof loadGoals === 'function') {
            await loadGoals();
        }
    } catch (error) {
        console.error('Failed to load goals:', error);
        // Continue with app even if goals fail
    }
}

// Setup event listeners
function setupEventListeners() {
    // Role selector
    const roleSelector = document.getElementById('role-selector');
    if (roleSelector && currentUser) {
        roleSelector.addEventListener('change', function(e) {
            if (currentUser) {
                currentUser.role = e.target.value;
                updateUserInfo();
                refreshCurrentView();
            }
        });
    }
    
    // Set up activity input listeners for the new design
    setupActivityInputListeners();
    
    // Initialize week selector
    initializeWeekSelector();
}

// Update user info display
function updateUserInfo() {
    // Check if currentUser exists
    if (!currentUser) return;
    
    // Update navigation visibility based on role
    updateNavigationVisibility();
    const userNameEl = document.getElementById('current-user');
    const userRoleEl = document.getElementById('current-role');
    const userAvatarEl = document.getElementById('user-avatar');
    
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userRoleEl) {
        const roleNames = {
            'ae': 'Account Executive',
            'am': 'Account Manager',
            'admin': 'Administrator'
        };
        userRoleEl.textContent = roleNames[currentUser.role] || 'Account Executive';
    }
    
    // Update user avatar with initials
    if (userAvatarEl && currentUser.name) {
        const initials = currentUser.name.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2); // Take first 2 characters
        userAvatarEl.textContent = initials;
    }
    
    // Update role selector to match current role
    const roleSelector = document.getElementById('role-selector');
    if (roleSelector && currentUser && roleSelector.value !== currentUser.role) {
        roleSelector.value = currentUser.role;
    }
}

// Navigation functions
function showSection(sectionName) {
    // Check authentication first
    if (!Auth.isAuthenticated()) {
        Auth.showLoginPage('Please login to continue');
        return;
    }
    
    // Check route protection
    if (!Auth.protectRoute(sectionName)) {
        return;
    }
    
    // Additional check for admin-only sections
    if ((sectionName === 'goals' || sectionName === 'users') && 
        currentUser && currentUser.platformRole !== 'admin') {
        showAlert('Access Denied: Only platform administrators can access this section.', 'error');
        return;
    }
    
    currentView = sectionName;
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('animate-fadeIn', 'active');
    });
    
    // Show selected section immediately without delay
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
        selectedSection.classList.add('animate-fadeIn', 'active');
    }
    
    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    loadSectionData(sectionName);
}

// Load section data based on section name
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'analytics':
            // Initialize enhanced analytics dashboard
            if (typeof dashboardVisualizations !== 'undefined' && 
                typeof dashboardVisualizations.initializeEnhancedDashboard === 'function') {
                setTimeout(() => {
                    dashboardVisualizations.initializeEnhancedDashboard();
                }, 100);
            }
            break;
        case 'leaderboard':
            loadLeaderboard();
            break;
        case 'goals':
            if (typeof initializeGoals === 'function') {
                initializeGoals();
            }
            if (typeof switchGoalView === 'function') {
                switchGoalView('role');
            }
            break;
        case 'users':
            if (typeof initializeUserManagement === 'function') {
                initializeUserManagement();
            }
            if (typeof showUserView === 'function') {
                showUserView('list');
            }
            break;
        case 'activity-entry':
            initializeWeekSelector();
            setupActivityEntryView();
            // Update user name display
            const userNameDisplay = document.getElementById('user-name-display');
            if (userNameDisplay) {
                userNameDisplay.textContent = currentUser.name;
            }
            // Update summary after view is set up
            setTimeout(() => {
                updateWeeklySummary();
            }, 100);
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// Refresh current view when role changes
function refreshCurrentView() {
    // Reload the current section with new role
    loadSectionData(currentView);
    
    // Reload dashboard with new role
    if (currentView === 'dashboard') {
        loadDashboard();
    }
    
    // Special handling for activity entry
    if (currentView === 'activity-entry') {
        setupActivityEntryView();
        loadWeekData();
    }
}

// Admin view mode toggle
function toggleAdminViewMode(mode) {
    // Update button states
    document.querySelectorAll('.admin-view-mode-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });
    
    // Toggle selectors
    const userSelector = document.getElementById('admin-user-selector');
    const roleFilter = document.getElementById('admin-role-filter');
    
    if (mode === 'individual') {
        userSelector?.classList.remove('hidden');
        roleFilter?.classList.add('hidden');
    } else {
        userSelector?.classList.add('hidden');
        roleFilter?.classList.remove('hidden');
    }
    
    // Reload admin dashboard
    loadAdminDashboard();
}

// Load Admin Dashboard
async function loadAdminDashboard() {
    const viewMode = document.querySelector('.admin-view-mode-btn.bg-indigo-600')?.dataset.mode || 'individual';
    const adminDashboard = document.getElementById('admin-dashboard');
    
    if (!adminDashboard) return;
    
    if (viewMode === 'individual') {
        // Load individual user dashboard
        const selectedUser = document.getElementById('admin-selected-user')?.value;
        if (selectedUser) {
            // Load the selected user's dashboard data
            const users = await loadUsers();
            const userData = users.find(u => u.id === selectedUser);
            if (userData) {
                if (userData.role === 'ae') {
                    // Display AE dashboard for this user
                    await displayUserAEDashboard(userData);
                } else if (userData.role === 'am') {
                    // Display AM dashboard for this user
                    await displayUserAMDashboard(userData);
                }
            } else {
                adminDashboard.innerHTML = '<p class="text-center text-gray-500 py-8">Please select a user to view their dashboard</p>';
            }
        } else {
            adminDashboard.innerHTML = '<p class="text-center text-gray-500 py-8">Please select a user to view their dashboard</p>';
        }
    } else {
        // Load team view
        const selectedRole = document.getElementById('admin-selected-role')?.value || 'ae';
        await loadTeamDashboard(selectedRole);
    }
}

// Load Dashboard data
async function loadDashboard() {
    // Only proceed if we're actually on the dashboard section
    const dashboardSection = document.getElementById('dashboard-section');
    if (!dashboardSection || dashboardSection.classList.contains('hidden')) {
        return;
    }
    
    // Hide all dashboards first (within the dashboard section only)
    document.getElementById('ae-dashboard')?.classList.add('hidden');
    document.getElementById('am-dashboard')?.classList.add('hidden');
    document.getElementById('admin-dashboard')?.classList.add('hidden');
    document.getElementById('admin-dashboard-controls')?.classList.add('hidden');
    
    // Show appropriate dashboard based on role
    if (currentUser.role === 'am') {
        // Account Manager only sees AM dashboard
        document.getElementById('am-dashboard')?.classList.remove('hidden');
        loadAMDashboard();
    } else if (currentUser.role === 'ae') {
        // Account Executive only sees AE dashboard
        document.getElementById('ae-dashboard')?.classList.remove('hidden');
        loadAEDashboard();
    } else if (currentUser.role === 'admin' || currentUser.platformRole === 'admin') {
        // Admin sees appropriate dashboard - if they have AE role, show AE dashboard
        if (currentUser.role === 'ae') {
            document.getElementById('ae-dashboard')?.classList.remove('hidden');
            loadAEDashboard();
        } else if (currentUser.role === 'am') {
            document.getElementById('am-dashboard')?.classList.remove('hidden');
            loadAMDashboard();
        } else {
            // Pure admin role - show admin dashboard
            document.getElementById('admin-dashboard')?.classList.remove('hidden');
            document.getElementById('admin-dashboard-controls')?.classList.remove('hidden');
            
            // Populate user selector for admin
            if (typeof populateAdminUserSelector === 'function') {
                populateAdminUserSelector();
            }
            
            loadAdminDashboard();
        }
    }
}

// Load Account Executive Dashboard
async function loadAEDashboard() {
    // Update metrics with new dashboard structure
    updateAEDashboard();
    
    // Update charts if needed
    updateAECharts();
}

// Display individual AE dashboard for admin view
async function displayUserAEDashboard(userData) {
    const adminDashboard = document.getElementById('admin-dashboard');
    if (!adminDashboard) return;
    
    const currentWeek = getCurrentWeek();
    
    // Get activities for this user
    const activities = await loadActivities();
    const userActivities = activities.filter(a => a.userId === userData.id && a.week === currentWeek);
    
    // Calculate totals
    const metrics = {
        callsMade: userActivities.reduce((sum, a) => sum + (parseInt(a.callsMade) || 0), 0),
        emailsSent: userActivities.reduce((sum, a) => sum + (parseInt(a.emailsSent) || 0), 0),
        linkedinMessages: userActivities.reduce((sum, a) => sum + (parseInt(a.linkedinMessages) || 0), 0),
        abmCampaigns: userActivities.reduce((sum, a) => sum + (parseInt(a.abmCampaigns) || 0), 0),
        meetingsBooked: userActivities.reduce((sum, a) => sum + (parseInt(a.meetingsBooked) || 0), 0),
        successfulContacts: userActivities.reduce((sum, a) => sum + (parseInt(a.successfulContacts) || 0), 0),
        meetingsConducted: userActivities.reduce((sum, a) => sum + (parseInt(a.meetingsConducted) || 0), 0),
        opportunitiesGenerated: userActivities.reduce((sum, a) => sum + (parseInt(a.opportunitiesGenerated) || 0), 0),
        proposalsSent: userActivities.reduce((sum, a) => sum + (parseInt(a.proposalsSent) || 0), 0),
        revenueClosed: userActivities.reduce((sum, a) => sum + (parseInt(a.revenueClosed) || 0), 0)
    };
    
    // Create dashboard HTML
    adminDashboard.innerHTML = `
        <div class="mb-6">
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${userData.name}'s Dashboard</h3>
            <p class="text-gray-600">Account Executive - Week: ${currentWeek}</p>
        </div>
        
        <!-- Sales Activities Section -->
        <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4 text-gray-800">Sales Activities</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-phone text-blue-600 mr-2"></i>
                            <p class="text-sm text-gray-600">Calls Made</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">${metrics.callsMade}</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-envelope text-green-600 mr-2"></i>
                            <p class="text-sm text-gray-600">Emails Sent</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">${metrics.emailsSent}</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fab fa-linkedin text-indigo-600 mr-2"></i>
                            <p class="text-sm text-gray-600">LinkedIn Messages</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">${metrics.linkedinMessages}</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-bullseye text-purple-600 mr-2"></i>
                            <p class="text-sm text-gray-600">ABM Campaigns</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">${metrics.abmCampaigns}</p>
                </div>
            </div>
        </div>
        
        <!-- Sales Results Section -->
        <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4 text-gray-800">Sales Results</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-cyan-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-calendar-check text-cyan-600 mr-2"></i>
                            <p class="text-sm text-gray-600">Meetings Booked</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">${metrics.meetingsBooked}</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-teal-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-video text-teal-600 mr-2"></i>
                            <p class="text-sm text-gray-600">Meetings Conducted</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">${metrics.meetingsConducted}</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>
                            <p class="text-sm text-gray-600">Opportunities</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">${metrics.opportunitiesGenerated}</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-dollar-sign text-green-600 mr-2"></i>
                            <p class="text-sm text-gray-600">Revenue Closed</p>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">$${metrics.revenueClosed.toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;
}

// Display individual AM dashboard for admin view
async function displayUserAMDashboard(userData) {
    const adminDashboard = document.getElementById('admin-dashboard');
    if (!adminDashboard) return;
    
    const currentWeek = getCurrentWeek();
    
    // Get activities for this user
    const activities = await loadActivities();
    const userActivities = activities.filter(a => a.userId === userData.id && a.week === currentWeek);
    
    // Calculate totals for both categories
    const crossSellMetrics = {
        accountReviews: userActivities.reduce((sum, a) => sum + (parseInt(a.crossSellAccountReviews) || 0), 0),
        customerCheckIns: userActivities.reduce((sum, a) => sum + (parseInt(a.crossSellCustomerCheckIns) || 0), 0),
        opportunitiesIdentified: userActivities.reduce((sum, a) => sum + (parseInt(a.crossSellOpportunitiesIdentified) || 0), 0),
        referralsRequested: userActivities.reduce((sum, a) => sum + (parseInt(a.crossSellReferralsRequested) || 0), 0),
        proposalsSent: userActivities.reduce((sum, a) => sum + (parseInt(a.crossSellProposalsSent) || 0), 0),
        pipelineGenerated: userActivities.reduce((sum, a) => sum + (parseInt(a.crossSellPipelineGenerated) || 0), 0),
        revenueClosed: userActivities.reduce((sum, a) => sum + (parseInt(a.crossSellRevenueClosed) || 0), 0)
    };
    
    const upSellMetrics = {
        accountReviews: userActivities.reduce((sum, a) => sum + (parseInt(a.upSellAccountReviews) || 0), 0),
        customerCheckIns: userActivities.reduce((sum, a) => sum + (parseInt(a.upSellCustomerCheckIns) || 0), 0),
        opportunitiesIdentified: userActivities.reduce((sum, a) => sum + (parseInt(a.upSellOpportunitiesIdentified) || 0), 0),
        referralsRequested: userActivities.reduce((sum, a) => sum + (parseInt(a.upSellReferralsRequested) || 0), 0),
        proposalsSent: userActivities.reduce((sum, a) => sum + (parseInt(a.upSellProposalsSent) || 0), 0),
        pipelineGenerated: userActivities.reduce((sum, a) => sum + (parseInt(a.upSellPipelineGenerated) || 0), 0),
        revenueClosed: userActivities.reduce((sum, a) => sum + (parseInt(a.upSellRevenueClosed) || 0), 0)
    };
    
    // Create dashboard HTML
    adminDashboard.innerHTML = `
        <div class="mb-6">
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${userData.name}'s Dashboard</h3>
            <p class="text-gray-600">Account Manager - Week: ${currentWeek}</p>
        </div>
        
        <!-- Cross-Sell Activities -->
        <div class="mb-8">
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Cross-Sell Activities</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                    <p class="text-sm text-gray-600 mb-1">Account Reviews</p>
                    <p class="text-2xl font-bold text-gray-900">${crossSellMetrics.accountReviews}</p>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <p class="text-sm text-gray-600 mb-1">Check-ins</p>
                    <p class="text-2xl font-bold text-gray-900">${crossSellMetrics.customerCheckIns}</p>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                    <p class="text-sm text-gray-600 mb-1">Opportunities</p>
                    <p class="text-2xl font-bold text-gray-900">${crossSellMetrics.opportunitiesIdentified}</p>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                    <p class="text-sm text-gray-600 mb-1">Revenue</p>
                    <p class="text-2xl font-bold text-gray-900">$${crossSellMetrics.revenueClosed.toLocaleString()}</p>
                </div>
            </div>
        </div>
        
        <!-- Up-Sell Activities -->
        <div class="mb-8">
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Up-Sell Activities</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
                    <p class="text-sm text-gray-600 mb-1">Account Reviews</p>
                    <p class="text-2xl font-bold text-gray-900">${upSellMetrics.accountReviews}</p>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-pink-500">
                    <p class="text-sm text-gray-600 mb-1">Check-ins</p>
                    <p class="text-2xl font-bold text-gray-900">${upSellMetrics.customerCheckIns}</p>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
                    <p class="text-sm text-gray-600 mb-1">Opportunities</p>
                    <p class="text-2xl font-bold text-gray-900">${upSellMetrics.opportunitiesIdentified}</p>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-teal-500">
                    <p class="text-sm text-gray-600 mb-1">Revenue</p>
                    <p class="text-2xl font-bold text-gray-900">$${upSellMetrics.revenueClosed.toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;
}

// Load Account Manager Dashboard
async function loadAMDashboard() {
    // Initialize with dormant category by default
    switchAMDashboardCategory('dormant');
    
    // Initialize all AM charts
    initializeAMCharts();
}

// Switch AM Dashboard Category
function switchAMDashboardCategory(category) {
    // Update button states
    document.querySelectorAll('.am-dashboard-category-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });
    
    // Show/hide category dashboards
    document.querySelectorAll('.am-category-dashboard').forEach(dashboard => {
        dashboard.classList.add('hidden');
    });
    
    const targetDashboard = document.getElementById(`am-${category}-dashboard`);
    if (targetDashboard) {
        targetDashboard.classList.remove('hidden');
    }
    
    // Load data for the selected category
    loadAMCategoryDashboard(category);
}

// Initialize dashboard period selectors with current week
function initializeDashboardPeriods() {
    const currentWeek = getCurrentWeek();
    
    const aePeriodSelector = document.getElementById('ae-dashboard-period');
    if (aePeriodSelector) {
        aePeriodSelector.value = currentWeek;
    }
    
    const amPeriodSelector = document.getElementById('am-dashboard-period');
    if (amPeriodSelector) {
        amPeriodSelector.value = currentWeek;
    }
}

// Refresh AM Dashboard when period changes
function refreshAMDashboard() {
    const categoryBtn = document.querySelector('.am-dashboard-category-btn.bg-indigo-600');
    const currentCategory = categoryBtn ? categoryBtn.dataset.category : 'dormant';
    loadAMCategoryDashboard(currentCategory);
}

// Load team dashboard for admin view
async function loadTeamDashboard(role) {
    const adminDashboard = document.getElementById('admin-dashboard');
    if (!adminDashboard) return;
    
    // Clear existing content
    adminDashboard.innerHTML = '';
    
    if (role === 'all') {
        // Load combined metrics for all sales team
        await loadAllSalesTeamDashboard();
    } else if (role === 'ae') {
        // Load combined AE team metrics
        await loadAETeamDashboard();
    } else if (role === 'am') {
        // Load combined AM team metrics
        await loadAMTeamDashboard();
    }
}

// Load combined AM team dashboard
async function loadAMTeamDashboard() {
    // Get all AM users
    const amUsers = await API.getUsers({ role: 'am' });
    const periodSelector = document.getElementById('am-dashboard-period');
    const selectedWeek = periodSelector ? periodSelector.value : getCurrentWeek();
    
    // Aggregate metrics across all AMs and all categories
    const categories = ['dormant', 'cross-sell', 'up-sell'];
    const aggregatedMetrics = {};
    
    for (const user of amUsers.data) {
        for (const category of categories) {
            const activityType = `am_${category.replace('-', '_')}_summary`;
            const activities = await API.getActivities({
                userId: user.id,
                week: selectedWeek,
                type: activityType
            });
            
            if (activities.data && activities.data.length > 0) {
                const data = activities.data[0];
                // Sum up all metrics
                for (const [key, value] of Object.entries(data)) {
                    if (typeof value === 'number') {
                        aggregatedMetrics[key] = (aggregatedMetrics[key] || 0) + value;
                    }
                }
            }
        }
    }
    
    // Display aggregated dashboard
    displayTeamDashboard('Account Managers Team', aggregatedMetrics);
}

// Load combined AE team dashboard
async function loadAETeamDashboard() {
    // Get all AE users
    const aeUsers = await API.getUsers({ role: 'ae' });
    const periodSelector = document.getElementById('ae-dashboard-period');
    const selectedWeek = periodSelector ? periodSelector.value : getCurrentWeek();
    
    // Aggregate metrics across all AEs
    const aggregatedMetrics = {};
    
    for (const user of aeUsers.data) {
        const activities = await API.getActivities({
            userId: user.id,
            week: selectedWeek,
            type: 'ae_summary'
        });
        
        if (activities.data && activities.data.length > 0) {
            const data = activities.data[0];
            // Sum up all metrics
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'number') {
                    aggregatedMetrics[key] = (aggregatedMetrics[key] || 0) + value;
                }
            }
        }
    }
    
    // Display aggregated dashboard
    displayTeamDashboard('Account Executives Team', aggregatedMetrics);
}

// Display team dashboard with aggregated metrics
function displayTeamDashboard(teamName, metrics) {
    const adminDashboard = document.getElementById('admin-dashboard');
    if (!adminDashboard) return;
    
    // Create dashboard HTML similar to individual dashboards but with team totals
    adminDashboard.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900">${teamName} - Combined Metrics</h2>
        </div>
        
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${generateMetricCards(metrics)}
        </div>
        
        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold mb-4">Team Activity Mix</h3>
                <div style="height: 250px;">
                    <canvas id="admin-team-activity-chart"></canvas>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold mb-4">Team Performance Trend</h3>
                <div style="height: 250px;">
                    <canvas id="admin-team-trend-chart"></canvas>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold mb-4">Team Goal Progress</h3>
                <div style="height: 250px;">
                    <canvas id="admin-team-goal-chart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Initialize charts for team view
    setTimeout(() => initializeTeamCharts(metrics), 100);
}

// Generate metric cards HTML
function generateMetricCards(metrics) {
    const metricConfigs = [
        { key: 'calls_made', label: 'Calls Made', icon: 'fa-phone', color: 'blue' },
        { key: 'emails_sent', label: 'Emails Sent', icon: 'fa-envelope', color: 'green' },
        { key: 'linkedin_messages', label: 'LinkedIn Messages', icon: 'fa-linkedin', color: 'purple', brand: true },
        { key: 'meetings_booked', label: 'Meetings Booked', icon: 'fa-calendar-check', color: 'indigo' },
        { key: 'successful_contacts', label: 'Successful Contacts', icon: 'fa-user-check', color: 'teal' },
        { key: 'meetings_conducted', label: 'Meetings Conducted', icon: 'fa-video', color: 'cyan' },
        { key: 'opportunities_created', label: 'Opportunities', icon: 'fa-trophy', color: 'pink' },
        { key: 'pipeline_generated', label: 'Pipeline Generated', icon: 'fa-chart-line', color: 'emerald', currency: true },
        { key: 'revenue_closed', label: 'Revenue Closed', icon: 'fa-dollar-sign', color: 'amber', currency: true }
    ];
    
    return metricConfigs.map(config => {
        const value = metrics[config.key] || 0;
        const displayValue = config.currency ? `$${formatCurrency(value)}` : value;
        const iconClass = config.brand ? 'fab' : 'fas';
        
        return `
            <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-${config.color}-500">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                        <i class="${iconClass} ${config.icon} text-${config.color}-600 mr-2"></i>
                        <p class="text-sm text-gray-600">${config.label}</p>
                    </div>
                </div>
                <p class="text-3xl font-bold text-gray-900">${displayValue}</p>
            </div>
        `;
    }).join('');
}

// Load data for specific AM category dashboard
async function loadAMCategoryDashboard(category) {
    const periodSelector = document.getElementById('am-dashboard-period');
    const selectedWeek = periodSelector ? periodSelector.value : getCurrentWeek();
    const previousWeek = getPreviousWeek(selectedWeek);
    
    // Define metrics to load - now including tab-specific ABM and general ABM
    const metrics = [
        // Sales Activities
        { id: 'accounts-targeted', field: 'accountsTargeted', label: 'Accounts Targeted' },
        { id: 'calls', field: 'callsMade', label: 'Calls Made' },
        { id: 'emails', field: 'emailsSent', label: 'Emails Sent' },
        { id: 'linkedin', field: 'linkedinMessages', label: 'LinkedIn Messages' },
        { id: 'vidyard', field: 'vidyardVideos', label: 'Vidyard Videos Sent' },
        // Sales Results
        { id: 'meetings-booked', field: 'meetingsBooked', label: 'Meetings Booked' },
        { id: 'successful-contacts', field: 'successfulContacts', label: 'Successful Contacts' },
        { id: 'meetings-conducted', field: 'meetingsConducted', label: 'Meetings Conducted' },
        { id: 'opportunities', field: 'opportunitiesGenerated', label: 'Opportunities Generated' },
        { id: 'referrals', field: 'referralsGenerated', label: 'Referrals Generated' },
        // Financial Performance
        { id: 'pipeline', field: 'pipelineGenerated', label: 'Pipeline Generated', isCurrency: true },
        { id: 'revenue', field: 'revenueClosed', label: 'Revenue Closed', isCurrency: true },
        // Tab-specific ABM (5th box in Sales Activities)
        { id: `${category}-abm`, field: `${category.replace('-', '_')}AbmCampaigns`, label: `${category.charAt(0).toUpperCase() + category.slice(1)} ABM` },
        // General ABM (6th box in Sales Activities)
        { id: 'general-abm', field: 'generalAbmCampaigns', label: 'General ABM Campaigns' }
    ];
    
    // Load data for all metrics in parallel
    const updatePromises = metrics.map(metric => 
        updateDashboardMetric({
            role: 'am',
            category: category,
            metricId: metric.id,
            field: metric.field,
            currentWeek: selectedWeek,
            previousWeek: previousWeek,
            isCurrency: metric.isCurrency || false
        })
    );
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
}

// Update AE Dashboard metrics
async function updateAEDashboard() {
    const periodSelector = document.getElementById('ae-dashboard-period');
    const selectedWeek = periodSelector ? periodSelector.value : getCurrentWeek();
    const previousWeek = getPreviousWeek(selectedWeek);
    
    // Define metrics to load (using camelCase field names from activities table)
    const metrics = [
        // Sales Activities
        { id: 'calls', field: 'callsMade', label: 'Calls Made' },
        { id: 'emails', field: 'emailsSent', label: 'Emails Sent' },
        { id: 'linkedin', field: 'linkedinMessages', label: 'LinkedIn Messages' },
        { id: 'vidyard', field: 'vidyardVideos', label: 'Vidyard Videos Sent' },
        { id: 'abm', field: 'abmCampaigns', label: 'ABM Campaigns' },
        // Sales Results
        { id: 'meetings-booked', field: 'meetingsBooked', label: 'Meetings Booked' },
        { id: 'contacts', field: 'successfulContacts', label: 'Successful Contacts' },
        { id: 'meetings-conducted', field: 'meetingsConducted', label: 'Meetings Conducted' },
        { id: 'opportunities', field: 'opportunitiesGenerated', label: 'Opportunities Generated' },
        { id: 'referrals', field: 'referralsGenerated', label: 'Referrals Generated' },
        // Financial Performance
        { id: 'pipeline', field: 'pipelineGenerated', label: 'Pipeline Generated', isCurrency: true },
        { id: 'revenue', field: 'revenueClosed', label: 'Revenue Closed', isCurrency: true }
    ];
    
    // Load data for all metrics in parallel
    const updatePromises = metrics.map(metric => 
        updateDashboardMetric({
            role: 'ae',
            category: null,
            metricId: metric.id,
            field: metric.field,
            currentWeek: selectedWeek,
            previousWeek: previousWeek,
            isCurrency: metric.isCurrency || false
        })
    );
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
}

// Generic function to update a dashboard metric
async function updateDashboardMetric(config) {
    const { role, category, metricId, field, currentWeek, previousWeek, isCurrency } = config;
    
    // Build element ID prefix
    const prefix = category ? `${role}-${category}` : role;
    
    // Get DOM elements
    const valueElement = document.getElementById(`${prefix}-${metricId}-value`);
    const prevElement = document.getElementById(`${prefix}-${metricId}-prev`);
    const trendElement = document.getElementById(`${prefix}-${metricId}-trend`);
    const goalElement = document.getElementById(`${prefix}-${metricId}-goal`);
    
    if (!valueElement) return;
    
    try {
        // Determine activity type for data fetching
        let activityType = '';
        if (role === 'ae') {
            activityType = 'ae_summary';
        } else if (role === 'am' && category) {
            activityType = `am_${category.replace('-', '_')}_summary`;
        }
        
        // Fetch current week data
        const currentData = await API.getActivities({
            userId: currentUser.id,
            week: currentWeek,
            type: activityType
        });
        
        // Fetch previous week data
        const previousData = await API.getActivities({
            userId: currentUser.id,
            week: previousWeek,
            type: activityType
        });
        
        // Extract values
        let currentValue = 0;
        let previousValue = 0;
        
        if (currentData.data && currentData.data.length > 0) {
            currentValue = currentData.data[0][field] || 0;
        }
        
        if (previousData.data && previousData.data.length > 0) {
            previousValue = previousData.data[0][field] || 0;
        }
        
        // Calculate trend
        let trendPercent = 0;
        let trendIcon = 'fa-minus';
        let trendColor = 'text-gray-400';
        
        if (previousValue > 0) {
            trendPercent = ((currentValue - previousValue) / previousValue * 100).toFixed(1);
            if (trendPercent > 0) {
                trendIcon = 'fa-arrow-up';
                trendColor = 'text-green-600';
            } else if (trendPercent < 0) {
                trendIcon = 'fa-arrow-down';
                trendColor = 'text-red-600';
            }
        } else if (currentValue > 0) {
            trendIcon = 'fa-arrow-up';
            trendColor = 'text-green-600';
            trendPercent = 'New';
        }
        
        // Fetch goal for this metric
        const goalData = await API.getGoals({
            userId: currentUser.id,
            role: role,
            category: category,
            metric: field
        });
        
        let goalPercent = 0;
        if (goalData.data && goalData.data.length > 0 && goalData.data[0].target > 0) {
            goalPercent = Math.round((currentValue / goalData.data[0].target) * 100);
        }
        
        // Update DOM elements
        if (isCurrency) {
            valueElement.textContent = formatCurrency(currentValue);
            if (prevElement.nextSibling) {
                const prevSpan = prevElement.parentNode.querySelector(`#${prefix}-${metricId}-prev`);
                if (prevSpan) {
                    prevSpan.textContent = formatCurrency(previousValue);
                }
            }
        } else {
            valueElement.textContent = currentValue;
            prevElement.textContent = `Last week: ${previousValue}`;
        }
        
        // Update trend
        if (trendElement) {
            const trendText = trendPercent === 'New' ? 'New' : `${Math.abs(trendPercent)}%`;
            trendElement.innerHTML = `<i class="fas ${trendIcon} ${trendColor}"></i> ${trendText}`;
        }
        
        // Update goal attainment
        if (goalElement) {
            goalElement.textContent = `${goalPercent}% of goal`;
            
            // Update goal badge color based on performance
            goalElement.className = 'text-xs px-2 py-1 rounded-full ';
            if (goalPercent >= 100) {
                goalElement.className += 'bg-green-100 text-green-800';
            } else if (goalPercent >= 70) {
                goalElement.className += 'bg-yellow-100 text-yellow-800';
            } else {
                goalElement.className += 'bg-red-100 text-red-800';
            }
        }
        
    } catch (error) {
        console.error(`Error updating metric ${metricId}:`, error);
    }
}

// Format currency values
function formatCurrency(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    } else {
        return value.toFixed(0);
    }
}

// Get previous week from a given week
function getPreviousWeek(weekString) {
    const [year, week] = weekString.split('-W');
    const weekNum = parseInt(week);
    
    if (weekNum > 1) {
        return `${year}-W${String(weekNum - 1).padStart(2, '0')}`;
    } else {
        // Previous year's last week (assume 52 weeks)
        return `${parseInt(year) - 1}-W52`;
    }
}

// Update AE metrics
async function updateAEMetrics() {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's activities
    const activities = await API.getActivities({ 
        userId: currentUser.id,
        date: today 
    });
    
    // Update quick stats
    const calls = activities.data.filter(a => a.type === 'call').length;
    const emails = activities.data.filter(a => a.type === 'email').length;
    const meetings = activities.data.filter(a => a.type === 'meeting').length;
    
    document.getElementById('quick-calls').textContent = calls;
    document.getElementById('quick-emails').textContent = emails;
    document.getElementById('quick-meetings').textContent = meetings;
}

// Display recent activities
function displayRecentActivities(activities) {
    const tbody = document.getElementById('ae-recent-activities');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No recent activities</td></tr>';
        return;
    }
    
    activities.forEach(activity => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">
                <span class="activity-badge-${activity.type}">${activity.type}</span>
            </td>
            <td class="py-3 px-4">${activity.prospectName || '-'}</td>
            <td class="py-3 px-4">${activity.contactName || '-'}</td>
            <td class="py-3 px-4">
                <span class="text-sm">${activity.outcome || '-'}</span>
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
                ${formatDateTime(activity.date)}
            </td>
            <td class="py-3 px-4 text-sm">${activity.nextSteps || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Load team performance for AM dashboard
async function loadTeamPerformance() {
    const tbody = document.getElementById('team-performance-table');
    if (!tbody) return;
    
    // Get team members (Account Executives that report to this AM)
    const teamMembers = await API.getUsers({ team: currentUser.team, role: 'ae' });
    
    tbody.innerHTML = '';
    
    if (teamMembers.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No team members found</td></tr>';
        return;
    }
    
    for (const member of teamMembers.data) {
        // Get weekly summary activities for AEs
        const activities = await API.getActivities({ 
            userId: member.id,
            type: 'weekly_summary'
        });
        
        const goals = await API.getGoals({ userId: member.id, type: 'daily' });
        
        let calls = 0, emails = 0, meetings = 0;
        
        // Aggregate activity data
        if (activities.data && activities.data.length > 0) {
            activities.data.forEach(activity => {
                calls += activity.callsMade || 0;
                emails += activity.emailsSent || 0;
                meetings += (activity.meetingsConducted || 0) + (activity.meetingsBooked || 0);
            });
        }
        
        const total = calls + emails + meetings;
        
        const goalProgress = goals.data.length > 0 ? 
            Math.round((total / goals.data[0].target) * 100) : 0;
        
        const status = goalProgress >= 100 ? 'on-track' : 
                      goalProgress >= 70 ? 'at-risk' : 'behind';
        
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4 font-medium">${member.name}</td>
            <td class="py-3 px-4">${calls}</td>
            <td class="py-3 px-4">${emails}</td>
            <td class="py-3 px-4">${meetings}</td>
            <td class="py-3 px-4 font-semibold">${total}</td>
            <td class="py-3 px-4">${goalProgress}%</td>
            <td class="py-3 px-4">
                <span class="status-${status}">${status.replace('-', ' ')}</span>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// Load Leaderboard
async function loadLeaderboard() {
    try {
        // Only proceed if we're on the leaderboard section
        const leaderboardSection = document.getElementById('leaderboard-section');
        if (!leaderboardSection || leaderboardSection.classList.contains('hidden')) {
            return;
        }
        
        // Initialize leaderboard with role-based permissions
        if (typeof initializeLeaderboard === 'function') {
            initializeLeaderboard();
        }
        
        // Update leaderboard data
        if (typeof updateLeaderboard === 'function') {
            updateLeaderboard();
        }
        
        // Check if user is available
        if (!window.currentUser) {
            console.error('No current user found');
            return;
        }
        
        // Determine which role to show in leaderboard based on current user role
        const targetRole = currentUser.role === 'am' ? 'am' : 'ae';
        
        // Get users based on role
        const response = await API.getUsers({ role: targetRole });
        if (!response || !response.data) {
            console.warn('No users data received');
            return;
        }
        
        const users = response;
        const leaderboardData = [];
    
    for (const user of users.data) {
        let calls = 0, emails = 0, meetings = 0, total = 0, points = 0;
        
        if (targetRole === 'am') {
            // For Account Managers, aggregate all category data
            const categories = ['dormant', 'cross-sell', 'up-sell'];
            for (const category of categories) {
                const activities = await API.getActivities({ 
                    userId: user.id,
                    type: `am_${category}_summary`
                });
                
                if (activities.data && activities.data.length > 0) {
                    activities.data.forEach(activity => {
                        calls += activity.callsMade || 0;
                        emails += activity.emailsSent || 0;
                        meetings += (activity.meetingsConducted || 0) + (activity.meetingsBooked || 0);
                    });
                }
            }
        } else {
            // For Account Executives
            const activities = await API.getActivities({ 
                userId: user.id,
                type: 'weekly_summary'
            });
            
            if (activities.data && activities.data.length > 0) {
                activities.data.forEach(activity => {
                    calls += activity.callsMade || 0;
                    emails += activity.emailsSent || 0;
                    meetings += (activity.meetingsConducted || 0) + (activity.meetingsBooked || 0);
                });
            }
        }
        
        total = calls + emails + meetings;
        // Calculate points (weighted scoring)
        points = (calls * 5) + (emails * 2) + (meetings * 10);
        
        leaderboardData.push({
            name: user.name,
            role: targetRole === 'am' ? 'Account Manager' : 'Account Executive',
            calls,
            emails,
            meetings,
            total,
            points
        });
    }
    
    // Sort by points
    leaderboardData.sort((a, b) => b.points - a.points);
    
    // Display leaderboard
    tbody.innerHTML = '';
    leaderboardData.forEach((user, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">
                <span class="${rankClass}">${rank}</span>
            </td>
            <td class="py-3 px-4 font-medium">${user.name}</td>
            <td class="py-3 px-4">${user.role}</td>
            <td class="py-3 px-4">${user.calls}</td>
            <td class="py-3 px-4">${user.emails}</td>
            <td class="py-3 px-4">${user.meetings}</td>
            <td class="py-3 px-4 font-semibold">${user.total}</td>
            <td class="py-3 px-4 font-bold text-indigo-600">${user.points}</td>
        `;
        tbody.appendChild(row);
    });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Show user-friendly error message
        const leaderboardSection = document.getElementById('leaderboard-section');
        if (leaderboardSection) {
            const errorDiv = leaderboardSection.querySelector('.error-message') || document.createElement('div');
            errorDiv.className = 'error-message bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Unable to load leaderboard data. Please check your connection and try again.
            `;
            if (!errorDiv.parentNode) {
                leaderboardSection.insertBefore(errorDiv, leaderboardSection.firstChild);
            }
        }
    }
}

// Activity Entry Functions - Redesigned for new format
let weeklyData = {
    callsMade: 0,
    emailsSent: 0,
    linkedinMessages: 0,
    abmCampaigns: 0,
    meetingsBooked: 0,
    successfulContacts: 0,
    meetingsConducted: 0,
    opportunitiesGenerated: 0,
    pipelineGenerated: 0,
    revenueClosed: 0
};

let currentAMCategory = 'dormant'; // Track current AM category

// Initialize week selector with current week
function initializeWeekSelector() {
    const weekSelector = document.getElementById('week-selector');
    if (weekSelector) {
        const now = new Date();
        const year = now.getFullYear();
        const week = getWeekNumber(now);
        weekSelector.value = `${year}-W${week.toString().padStart(2, '0')}`;
        loadWeekData();
    }
}

// Get week number from date
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Load week data from storage
async function loadWeekData() {
    const weekSelector = document.getElementById('week-selector');
    if (!weekSelector) return;
    
    try {
        if (currentUser.role === 'am') {
            // Load AM data for current category
            const activities = await API.getActivities({ 
                userId: currentUser.id,
                week: weekSelector.value,
                type: `am_${currentAMCategory}_summary`
            });
            
            const prefix = currentAMCategory === 'dormant' ? 'dormant' : 
                          currentAMCategory === 'cross-sell' ? 'cross' : 'upsell';
            
            if (activities.data && activities.data.length > 0) {
                const weekData = activities.data[0];
                
                // Load category-specific data
                const setFieldValue = (fieldId, value) => {
                    const el = document.getElementById(fieldId);
                    if (el) el.value = value || 0;
                };
                
                setFieldValue(`${prefix}-accounts-targeted`, weekData.accountsTargeted);
                setFieldValue(`${prefix}-calls-made`, weekData.callsMade);
                setFieldValue(`${prefix}-emails-sent`, weekData.emailsSent);
                setFieldValue(`${prefix}-linkedin-messages`, weekData.linkedinMessages);
                setFieldValue(`${prefix}-meetings-booked`, weekData.meetingsBooked);
                setFieldValue(`${prefix}-successful-contacts`, weekData.successfulContacts);
                setFieldValue(`${prefix}-meetings-conducted`, weekData.meetingsConducted);
                setFieldValue(`${prefix}-opportunities`, weekData.opportunitiesGenerated);
                setFieldValue(`${prefix}-pipeline-generated`, weekData.pipelineGenerated);
                setFieldValue(`${prefix}-revenue-closed`, weekData.revenueClosed);
                
                // Load ABM data
                setFieldValue('general-abm-campaigns', weekData.generalAbmCampaigns);
                setFieldValue('dormant-abm-campaigns', weekData.dormantAbmCampaigns);
                setFieldValue('cross-sell-abm-campaigns', weekData.crossSellAbmCampaigns);
                setFieldValue('up-sell-abm-campaigns', weekData.upSellAbmCampaigns);
            } else {
                // Clear form fields if no data
                clearFormFields();
            }
        } else {
            // Load AE data
            const activities = await API.getActivities({ 
                userId: currentUser.id,
                week: weekSelector.value,
                type: 'weekly_summary'
            });
            
            if (activities.data && activities.data.length > 0) {
                const weekData = activities.data[0];
                const setFieldValue = (fieldId, value) => {
                    const el = document.getElementById(fieldId);
                    if (el) el.value = value || 0;
                };
                
                setFieldValue('calls-made', weekData.callsMade);
                setFieldValue('emails-sent', weekData.emailsSent);
                setFieldValue('linkedin-messages', weekData.linkedinMessages);
                setFieldValue('abm-campaigns', weekData.abmCampaigns);
                setFieldValue('meetings-booked', weekData.meetingsBooked);
                setFieldValue('successful-contacts', weekData.successfulContacts);
                setFieldValue('meetings-conducted', weekData.meetingsConducted);
                setFieldValue('opportunities-generated', weekData.opportunitiesGenerated);
                setFieldValue('pipeline-generated', weekData.pipelineGenerated);
                setFieldValue('revenue-closed', weekData.revenueClosed);
            } else {
                // Clear form fields if no data
                clearFormFields();
            }
        }
        
        updateWeeklySummary();
    } catch (error) {
        console.error('Error loading week data:', error);
        clearFormFields();
    }
}

// Reset week data - clears the stored data for the week and resets form to 0
async function resetWeekData() {
    if (!window.confirm('Are you sure you want to reset this week\'s data? This will delete all saved data for this week and cannot be undone.')) {
        return;
    }
    
    const weekSelector = document.getElementById('week-selector');
    if (!weekSelector) return;
    
    try {
        // Show loading state immediately
        showAlert('Resetting week data...', 'info');
        
        // Delete existing data for this week
        if (currentUser.role === 'am') {
            // Delete AM data for current category
            const existing = await API.getActivities({ 
                userId: currentUser.id,
                week: weekSelector.value,
                type: `am_${currentAMCategory}_summary`
            });
            
            if (existing.data && existing.data.length > 0) {
                await API.deleteActivity(existing.data[0].id);
            }
        } else {
            // Delete AE data (using correct type)
            const existing = await API.getActivities({ 
                userId: currentUser.id,
                week: weekSelector.value,
                type: 'ae_summary'
            });
            
            if (existing.data && existing.data.length > 0) {
                await API.deleteActivity(existing.data[0].id);
            }
        }
        
        // Clear form fields and update summary without delay
        clearFormFields();
        updateWeeklySummary();
        showAlert('Week\'s data has been reset successfully', 'success');
        
    } catch (error) {
        console.error('Error resetting week data:', error);
        showAlert('Failed to reset week data. Please try again.', 'error');
    }
}

// Clear form fields only (doesn't delete saved data)
function clearFormFields() {
    // Use querySelectorAll for batch operations - much faster
    if (currentUser.role === 'am') {
        // Clear AM fields based on current category
        const prefix = currentAMCategory === 'dormant' ? 'dormant' : 
                      currentAMCategory === 'cross-sell' ? 'cross' : 'upsell';
        
        // Batch clear all input fields for the current category
        const inputs = document.querySelectorAll(`#${currentAMCategory}-section input[type="number"]`);
        inputs.forEach(input => input.value = 0);
        
        // Clear ABM fields
        const abmInputs = document.querySelectorAll('[id$="-abm-campaigns"]');
        abmInputs.forEach(input => input.value = 0);
    } else {
        // Clear all AE input fields at once
        const aeInputs = document.querySelectorAll('#ae-activity-cards input[type="number"]');
        aeInputs.forEach(input => input.value = 0);
        
        // Clear pipeline/revenue fields separately if they exist
        const fields = ['pipeline-generated', 'revenue-closed'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = 0;
        });
    }
}

// Add to week total (incremental update)
async function addToWeekTotal() {
    const weekSelector = document.getElementById('week-selector');
    if (!weekSelector) return;
    
    // Collect current form values
    let currentValues = {};
    let activityData = {
        userId: currentUser.id,
        userName: currentUser.name,
        week: weekSelector.value,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    if (currentUser.role === 'am') {
        // Collect AM data
        const prefix = currentAMCategory === 'dormant' ? 'dormant' : 
                      currentAMCategory === 'cross-sell' ? 'cross' : 'upsell';
        
        activityData.type = `am_${currentAMCategory.replace('-', '_')}_summary`;
        activityData.category = currentAMCategory;
        
        currentValues = {
            accountsTargeted: parseInt(document.getElementById(`${prefix}-accounts-targeted`)?.value) || 0,
            callsMade: parseInt(document.getElementById(`${prefix}-calls-made`)?.value) || 0,
            emailsSent: parseInt(document.getElementById(`${prefix}-emails-sent`)?.value) || 0,
            linkedinMessages: parseInt(document.getElementById(`${prefix}-linkedin-messages`)?.value) || 0,
            vidyardVideos: parseInt(document.getElementById(`${prefix}-vidyard-videos`)?.value) || 0,
            meetingsBooked: parseInt(document.getElementById(`${prefix}-meetings-booked`)?.value) || 0,
            successfulContacts: parseInt(document.getElementById(`${prefix}-successful-contacts`)?.value) || 0,
            meetingsConducted: parseInt(document.getElementById(`${prefix}-meetings-conducted`)?.value) || 0,
            opportunitiesGenerated: parseInt(document.getElementById(`${prefix}-opportunities`)?.value) || 0,
            referralsGenerated: parseInt(document.getElementById(`${prefix}-referrals-generated`)?.value) || 0,
            pipelineGenerated: parseFloat(document.getElementById(`${prefix}-pipeline-generated`)?.value) || 0,
            revenueClosed: parseFloat(document.getElementById(`${prefix}-revenue-closed`)?.value) || 0,
            generalAbmCampaigns: parseInt(document.getElementById('general-abm-campaigns')?.value) || 0,
            dormantAbmCampaigns: parseInt(document.getElementById('dormant-abm-campaigns')?.value) || 0,
            crossSellAbmCampaigns: parseInt(document.getElementById('cross-sell-abm-campaigns')?.value) || 0,
            upSellAbmCampaigns: parseInt(document.getElementById('up-sell-abm-campaigns')?.value) || 0
        };
    } else {
        // Collect AE data
        activityData.type = 'weekly_summary';
        
        currentValues = {
            callsMade: parseInt(document.getElementById('calls-made')?.value) || 0,
            emailsSent: parseInt(document.getElementById('emails-sent')?.value) || 0,
            linkedinMessages: parseInt(document.getElementById('linkedin-messages')?.value) || 0,
            vidyardVideos: parseInt(document.getElementById('vidyard-videos')?.value) || 0,
            abmCampaigns: parseInt(document.getElementById('abm-campaigns')?.value) || 0,
            meetingsBooked: parseInt(document.getElementById('meetings-booked')?.value) || 0,
            successfulContacts: parseInt(document.getElementById('successful-contacts')?.value) || 0,
            meetingsConducted: parseInt(document.getElementById('meetings-conducted')?.value) || 0,
            opportunitiesGenerated: parseInt(document.getElementById('opportunities-generated')?.value) || 0,
            referralsGenerated: parseInt(document.getElementById('referrals-generated')?.value) || 0,
            pipelineGenerated: parseFloat(document.getElementById('pipeline-generated')?.value) || 0,
            revenueClosed: parseFloat(document.getElementById('revenue-closed')?.value) || 0
        };
    }
    
    try {
        // Check if we have existing data for this week
        const existing = await API.getActivities({ 
            userId: currentUser.id,
            week: weekSelector.value,
            type: activityData.type
        });
        
        if (existing.data && existing.data.length > 0) {
            // Add current values to existing totals
            const existingData = existing.data[0];
            
            // Add each field to existing values
            Object.keys(currentValues).forEach(key => {
                activityData[key] = (currentValues[key] || 0) + (existingData[key] || 0);
            });
            
            // Update the existing record with new totals
            await API.updateActivity(existingData.id, activityData);
            showAlert('Added to week\'s total successfully!', 'success');
        } else {
            // No existing data, create new record with current values
            Object.assign(activityData, currentValues);
            await API.createActivity(activityData);
            showAlert('Week data saved successfully!', 'success');
        }
        
        // Clear the form fields after adding
        clearFormFields();
        
        // Update summary to show new totals
        updateWeeklySummary();
        
        // Update dashboard and charts based on user role
        if (currentUser.role === 'am') {
            await loadAMCategoryDashboard(currentAMCategory);
            if (typeof updateAMCharts === 'function') {
                await updateAMCharts();
            }
        } else {
            await updateAEDashboard();
            if (typeof updateAECharts === 'function') {
                await updateAECharts();
            }
        }
        
    } catch (error) {
        showAlert('Failed to add to week total. Please try again.', 'error');
        console.error('Error adding to week total:', error);
    }
}

// Save week data (only for first entry of the week)
async function saveWeekData() {
    const weekSelector = document.getElementById('week-selector');
    if (!weekSelector) return;
    
    // Check if any values are entered
    let hasData = false;
    
    let activityData = {
        userId: currentUser.id,
        userName: currentUser.name,
        week: weekSelector.value,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    if (currentUser.role === 'am') {
        // Save AM data with category
        const prefix = currentAMCategory === 'dormant' ? 'dormant' : 
                      currentAMCategory === 'cross-sell' ? 'cross' : 'upsell';
        
        activityData.type = `am_${currentAMCategory.replace('-', '_')}_summary`;
        activityData.category = currentAMCategory;
        activityData.accountsTargeted = parseInt(document.getElementById(`${prefix}-accounts-targeted`)?.value) || 0;
        activityData.callsMade = parseInt(document.getElementById(`${prefix}-calls-made`)?.value) || 0;
        activityData.emailsSent = parseInt(document.getElementById(`${prefix}-emails-sent`)?.value) || 0;
        activityData.linkedinMessages = parseInt(document.getElementById(`${prefix}-linkedin-messages`)?.value) || 0;
        activityData.vidyardVideos = parseInt(document.getElementById(`${prefix}-vidyard-videos`)?.value) || 0;
        activityData.meetingsBooked = parseInt(document.getElementById(`${prefix}-meetings-booked`)?.value) || 0;
        activityData.successfulContacts = parseInt(document.getElementById(`${prefix}-successful-contacts`)?.value) || 0;
        activityData.meetingsConducted = parseInt(document.getElementById(`${prefix}-meetings-conducted`)?.value) || 0;
        activityData.opportunitiesGenerated = parseInt(document.getElementById(`${prefix}-opportunities`)?.value) || 0;
        activityData.referralsGenerated = parseInt(document.getElementById(`${prefix}-referrals-generated`)?.value) || 0;
        activityData.pipelineGenerated = parseFloat(document.getElementById(`${prefix}-pipeline-generated`)?.value) || 0;
        activityData.revenueClosed = parseFloat(document.getElementById(`${prefix}-revenue-closed`)?.value) || 0;
        
        // ABM Campaigns
        activityData.generalAbmCampaigns = parseInt(document.getElementById('general-abm-campaigns')?.value) || 0;
        activityData.dormantAbmCampaigns = parseInt(document.getElementById('dormant-abm-campaigns')?.value) || 0;
        activityData.crossSellAbmCampaigns = parseInt(document.getElementById('cross-sell-abm-campaigns')?.value) || 0;
        activityData.upSellAbmCampaigns = parseInt(document.getElementById('up-sell-abm-campaigns')?.value) || 0;
        
        // Check if any data was entered
        hasData = activityData.accountsTargeted > 0 || activityData.callsMade > 0 || 
                 activityData.emailsSent > 0 || activityData.linkedinMessages > 0 ||
                 activityData.vidyardVideos > 0 || activityData.meetingsBooked > 0 || activityData.successfulContacts > 0 ||
                 activityData.meetingsConducted > 0 || activityData.opportunitiesGenerated > 0 || activityData.referralsGenerated > 0 ||
                 activityData.pipelineGenerated > 0 || activityData.revenueClosed > 0 ||
                 activityData.generalAbmCampaigns > 0 || activityData.dormantAbmCampaigns > 0 ||
                 activityData.crossSellAbmCampaigns > 0 || activityData.upSellAbmCampaigns > 0;
    } else {
        // Save AE data
        activityData.type = 'ae_summary';
        activityData.callsMade = parseInt(document.getElementById('calls-made')?.value) || 0;
        activityData.emailsSent = parseInt(document.getElementById('emails-sent')?.value) || 0;
        activityData.linkedinMessages = parseInt(document.getElementById('linkedin-messages')?.value) || 0;
        activityData.vidyardVideos = parseInt(document.getElementById('vidyard-videos')?.value) || 0;
        activityData.abmCampaigns = parseInt(document.getElementById('abm-campaigns')?.value) || 0;
        activityData.meetingsBooked = parseInt(document.getElementById('meetings-booked')?.value) || 0;
        activityData.successfulContacts = parseInt(document.getElementById('successful-contacts')?.value) || 0;
        activityData.meetingsConducted = parseInt(document.getElementById('meetings-conducted')?.value) || 0;
        activityData.opportunitiesGenerated = parseInt(document.getElementById('opportunities-generated')?.value) || 0;
        activityData.referralsGenerated = parseInt(document.getElementById('referrals-generated')?.value) || 0;
        activityData.pipelineGenerated = parseFloat(document.getElementById('pipeline-generated')?.value) || 0;
        activityData.revenueClosed = parseFloat(document.getElementById('revenue-closed')?.value) || 0;
        
        // Check if any data was entered
        hasData = activityData.callsMade > 0 || activityData.emailsSent > 0 || 
                 activityData.linkedinMessages > 0 || activityData.vidyardVideos > 0 || activityData.abmCampaigns > 0 ||
                 activityData.meetingsBooked > 0 || activityData.successfulContacts > 0 ||
                 activityData.meetingsConducted > 0 || activityData.opportunitiesGenerated > 0 || activityData.referralsGenerated > 0 ||
                 activityData.pipelineGenerated > 0 || activityData.revenueClosed > 0;
    }
    
    // Don't save if no data entered
    if (!hasData) {
        showAlert('Please enter at least one activity before saving.', 'warning');
        return;
    }
    
    try {
        // Double-check for existing data
        const existing = await API.getActivities({ 
            userId: currentUser.id,
            week: weekSelector.value,
            type: activityData.type
        });
        
        // Filter out any deleted records (safety check)
        const activeRecords = existing.data ? existing.data.filter(record => !record.deleted) : [];
        
        if (activeRecords.length > 0) {
            // Data already exists for this week
            showAlert('Data already exists for this week. Use "Add to Week\'s Total" to add more activities.', 'warning');
            return;
        } else {
            // Create new record
            await API.createActivity(activityData);
            showAlert('Week data saved successfully!', 'success');
            
            // Clear form fields but keep summary updated
            clearFormFields();
            
            // Update summary to show the saved totals
            updateWeeklySummary();
        }
        
        // Update dashboard and charts based on user role
        if (currentUser.role === 'am') {
            await loadAMCategoryDashboard(currentAMCategory);
            if (typeof updateAMCharts === 'function') {
                await updateAMCharts();
            }
        } else {
            await updateAEDashboard();
            if (typeof updateAECharts === 'function') {
                await updateAECharts();
            }
        }
        
        // Also refresh charts if available
        if (typeof refreshCharts === 'function') {
            refreshCharts();
        }
        
        console.log('Charts updated after saving activity data');
    } catch (error) {
        showAlert('Failed to save week data. Please try again.', 'error');
        console.error('Error saving week data:', error);
    }
}

// Setup Activity Entry View based on role
function setupActivityEntryView() {
    const roleDisplay = document.getElementById('user-role-display');
    const descriptionEl = document.getElementById('activity-description');
    const aeCards = document.getElementById('ae-activity-cards');
    const amCards = document.getElementById('am-activity-cards');
    const amCategorySelector = document.getElementById('am-category-selector');
    
    if (currentUser.role === 'am') {
        // Show Account Manager view
        if (roleDisplay) roleDisplay.textContent = 'manager';
        if (descriptionEl) descriptionEl.textContent = 'Track your weekly account management activities';
        if (aeCards) aeCards.classList.add('hidden');
        if (amCards) amCards.classList.remove('hidden');
        if (amCategorySelector) amCategorySelector.classList.remove('hidden');
        
        // Initialize with dormant category if not already selected
        if (!currentAMCategory) {
            currentAMCategory = 'dormant';
        }
        selectAMCategory(currentAMCategory);
    } else {
        // Show Account Executive view (for both 'ae' and 'admin' roles)
        if (roleDisplay) roleDisplay.textContent = currentUser.role === 'admin' ? 'admin' : 'executive';
        if (descriptionEl) descriptionEl.textContent = 'Track your weekly sales activities and results';
        if (aeCards) aeCards.classList.remove('hidden');
        if (amCards) amCards.classList.add('hidden');
        if (amCategorySelector) amCategorySelector.classList.add('hidden');
    }
    
    // Reload data for the current week
    loadWeekData();
}

// Select AM Category
function selectAMCategory(category) {
    currentAMCategory = category;
    
    // Update button states
    const buttons = document.querySelectorAll('.am-category-btn');
    buttons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.remove('bg-gray-400');
            if (category === 'dormant') btn.classList.add('bg-red-600');
            else if (category === 'cross-sell') btn.classList.add('bg-blue-600');
            else if (category === 'up-sell') btn.classList.add('bg-purple-600');
        } else {
            btn.classList.remove('bg-red-600', 'bg-blue-600', 'bg-purple-600');
            btn.classList.add('bg-gray-400');
        }
    });
    
    // Show/hide sections
    const dormantSection = document.getElementById('dormant-section');
    const crossSellSection = document.getElementById('cross-sell-section');
    const upSellSection = document.getElementById('up-sell-section');
    
    if (dormantSection) dormantSection.classList.toggle('hidden', category !== 'dormant');
    if (crossSellSection) crossSellSection.classList.toggle('hidden', category !== 'cross-sell');
    if (upSellSection) upSellSection.classList.toggle('hidden', category !== 'up-sell');
    
    // Load data for selected category
    loadWeekData();
}

// Update weekly summary display - loads from saved data
async function updateWeeklySummary() {
    const weekSelector = document.getElementById('week-selector');
    if (!weekSelector) return;
    
    let totalActivities = 0;
    let totalResults = 0;
    let pipelineValue = 0;
    let revenueValue = 0;
    
    try {
        // Load saved data for the week to show in summary
        if (currentUser.role === 'am') {
            // Load AM data for current category
            const existing = await API.getActivities({ 
                userId: currentUser.id,
                week: weekSelector.value,
                type: `am_${currentAMCategory}_summary`
            });
            
            if (existing.data && existing.data.length > 0) {
                const savedData = existing.data[0];
                totalActivities = 
                    (savedData.accountsTargeted || 0) +
                    (savedData.callsMade || 0) +
                    (savedData.emailsSent || 0) +
                    (savedData.linkedinMessages || 0) +
                    (savedData.generalAbmCampaigns || 0) +
                    (savedData.dormantAbmCampaigns || 0) +
                    (savedData.crossSellAbmCampaigns || 0) +
                    (savedData.upSellAbmCampaigns || 0);
                
                totalResults = 
                    (savedData.meetingsBooked || 0) +
                    (savedData.successfulContacts || 0) +
                    (savedData.meetingsConducted || 0) +
                    (savedData.opportunitiesGenerated || 0);
                
                pipelineValue = savedData.pipelineGenerated || 0;
                revenueValue = savedData.revenueClosed || 0;
            }
        } else {
            // Load AE data
            const existing = await API.getActivities({ 
                userId: currentUser.id,
                week: weekSelector.value,
                type: 'weekly_summary'
            });
            
            if (existing.data && existing.data.length > 0) {
                const savedData = existing.data[0];
                totalActivities = 
                    (savedData.callsMade || 0) +
                    (savedData.emailsSent || 0) +
                    (savedData.linkedinMessages || 0) +
                    (savedData.abmCampaigns || 0);
                
                totalResults = 
                    (savedData.meetingsBooked || 0) +
                    (savedData.successfulContacts || 0) +
                    (savedData.meetingsConducted || 0) +
                    (savedData.opportunitiesGenerated || 0);
                
                pipelineValue = savedData.pipelineGenerated || 0;
                revenueValue = savedData.revenueClosed || 0;
            }
        }
    } catch (error) {
        console.error('Error loading summary data:', error);
    }
    
    // Update summary displays
    const summaryEls = {
        'total-activities-summary': totalActivities,
        'total-results-summary': totalResults,
        'pipeline-summary': '$' + pipelineValue.toLocaleString(),
        'revenue-summary': '$' + revenueValue.toLocaleString()
    };
    
    Object.keys(summaryEls).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = summaryEls[id];
    });
}

// Set up event listeners for real-time summary updates
function setupActivityInputListeners() {
    // Account Executive inputs
    const aeInputs = [
        'calls-made', 'emails-sent', 'linkedin-messages', 'abm-campaigns',
        'meetings-booked', 'successful-contacts', 'meetings-conducted', 'opportunities-generated',
        'pipeline-generated', 'revenue-closed'
    ];
    
    // Account Manager inputs
    const amPrefixes = ['dormant', 'cross', 'upsell'];
    const amMetrics = [
        'accounts-targeted', 'calls-made', 'emails-sent', 'linkedin-messages',
        'meetings-booked', 'successful-contacts', 'meetings-conducted', 'opportunities',
        'pipeline-generated', 'revenue-closed'
    ];
    const abmInputs = [
        'general-abm-campaigns', 'dormant-abm-campaigns', 
        'cross-sell-abm-campaigns', 'up-sell-abm-campaigns'
    ];
    
    // Add AE listeners
    aeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateWeeklySummary);
        }
    });
    
    // Add AM listeners
    amPrefixes.forEach(prefix => {
        amMetrics.forEach(metric => {
            const id = `${prefix}-${metric}`;
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updateWeeklySummary);
            }
        });
    });
    
    // Add ABM listeners
    abmInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateWeeklySummary);
        }
    });
    
    // Week selector change
    const weekSelector = document.getElementById('week-selector');
    if (weekSelector) {
        weekSelector.addEventListener('change', loadWeekData);
    }
}

// Goal Management
async function loadGoals() {
    try {
        console.log('Loading goals...');
        const response = await fetch('tables/goals');
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error loading goals:', error);
        return [];
    }
}

// User Management
async function loadUsers() {
    try {
        console.log('Loading users...');
        const response = await API.getUsers();
        return response.data || [];
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

// Load user data
async function loadUserData() {
    try {
        const users = await API.getUsers();
        // Process user data as needed
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load activities
async function loadActivities() {
    try {
        const response = await API.getActivities();
        return response.data || [];
    } catch (error) {
        console.error('Error loading activities:', error);
        return [];
    }
}

// Utility Functions
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
               ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
}

function showAlert(message, type = 'success') {
    // Create alert element
    const alert = document.createElement('div');
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle'
    };
    alert.className = `alert-${type} fixed top-20 right-4 z-50 max-w-md`;
    alert.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${iconMap[type] || 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Export all functions globally so they can be called from HTML
window.showSection = showSection;
window.loadSectionData = loadSectionData;
window.loadDashboardData = loadDashboardData;
window.updateDashboardStats = updateDashboardStats;
window.loadWeeklyProgress = loadWeeklyProgress;
window.saveActivityData = saveActivityData;
window.showAlert = showAlert;
window.updateUserRole = updateUserRole;
window.deleteUser = deleteUser;
window.resetPassword = resetPassword;
window.updateGoal = updateGoal;
window.deleteGoal = deleteGoal;
window.initializeApp = initializeApp;
window.getCurrentWeek = getCurrentWeek;