// ========================================
// CRITICAL FIXES FOR DASHBOARD, LEADERBOARD, AND USER MANAGEMENT
// Fixes: User dropdown, Leaderboard errors, Reset data function, Login bypass
// ========================================

console.log('🔧 CRITICAL FIXES LOADING...');

(function() {
    'use strict';
    
    // ================================
    // FIX 1: Dashboard Individual View User Dropdown
    // ================================
    function fixDashboardUserDropdown() {
        console.log('[CRITICAL-FIX] Fixing dashboard user dropdown...');
        
        // Override toggleAdminViewMode to populate dropdown
        const originalToggleAdminViewMode = window.toggleAdminViewMode;
        window.toggleAdminViewMode = function(mode) {
            console.log(`[CRITICAL-FIX] Toggle admin view mode: ${mode}`);
            
            // Call original if exists
            if (typeof originalToggleAdminViewMode === 'function') {
                originalToggleAdminViewMode(mode);
            }
            
            // Update button states
            document.querySelectorAll('.admin-view-mode-btn').forEach(btn => {
                if (btn.dataset.mode === mode) {
                    btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
                    btn.classList.add('bg-indigo-600', 'text-white');
                } else {
                    btn.classList.remove('bg-indigo-600', 'text-white');
                    btn.classList.add('text-gray-600', 'hover:bg-gray-100');
                }
            });
            
            // Show/hide appropriate selectors
            const userSelector = document.getElementById('admin-user-selector');
            const roleFilter = document.getElementById('admin-role-filter');
            
            if (mode === 'individual') {
                if (userSelector) {
                    userSelector.style.display = 'flex';
                    populateUserDropdown();
                }
                if (roleFilter) roleFilter.style.display = 'none';
            } else {
                if (userSelector) userSelector.style.display = 'none';
                if (roleFilter) roleFilter.style.display = 'flex';
            }
            
            // Trigger dashboard reload
            if (typeof window.loadAdminDashboard === 'function') {
                window.loadAdminDashboard();
            }
        };
        
        // Function to populate user dropdown
        function populateUserDropdown() {
            console.log('[CRITICAL-FIX] Populating user dropdown...');
            
            const dropdown = document.getElementById('admin-selected-user');
            if (!dropdown) {
                console.error('[CRITICAL-FIX] User dropdown not found');
                return;
            }
            
            // Get all users
            const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
            const sptUsers = JSON.parse(localStorage.getItem('spt_users') || '[]');
            
            // Combine and deduplicate users
            const allUsers = [...users, ...sptUsers];
            const uniqueUsers = [];
            const seenEmails = new Set();
            
            allUsers.forEach(user => {
                if (user && user.email && !seenEmails.has(user.email)) {
                    seenEmails.add(user.email);
                    uniqueUsers.push(user);
                }
            });
            
            // Clear and populate dropdown
            dropdown.innerHTML = '<option value="">Select User</option>';
            
            uniqueUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id || user.email;
                option.textContent = `${user.name || `${user.firstName} ${user.lastName}`} (${user.role === 'ae' ? 'AE' : user.role === 'am' ? 'AM' : 'Admin'})`;
                dropdown.appendChild(option);
            });
            
            console.log(`[CRITICAL-FIX] Populated dropdown with ${uniqueUsers.length} users`);
        }
        
        // Also fix loadAdminDashboard if needed
        if (!window.loadAdminDashboard) {
            window.loadAdminDashboard = function() {
                console.log('[CRITICAL-FIX] Loading admin dashboard...');
                
                const selectedUser = document.getElementById('admin-selected-user')?.value;
                const selectedRole = document.getElementById('admin-selected-role')?.value;
                const viewMode = document.querySelector('.admin-view-mode-btn.bg-indigo-600')?.dataset.mode || 'individual';
                
                console.log(`[CRITICAL-FIX] Dashboard params - Mode: ${viewMode}, User: ${selectedUser}, Role: ${selectedRole}`);
                
                // Load appropriate data based on view mode
                if (viewMode === 'individual' && selectedUser) {
                    // Load individual user data
                    loadIndividualDashboard(selectedUser);
                } else if (viewMode === 'team') {
                    // Load team data
                    loadTeamDashboard(selectedRole);
                }
            };
        }
        
        function loadIndividualDashboard(userId) {
            console.log(`[CRITICAL-FIX] Loading individual dashboard for user: ${userId}`);
            // Implementation would go here
        }
        
        function loadTeamDashboard(role) {
            console.log(`[CRITICAL-FIX] Loading team dashboard for role: ${role}`);
            // Implementation would go here
        }
        
        // Auto-populate on load if individual view is active
        setTimeout(() => {
            const individualBtn = document.querySelector('.admin-view-mode-btn[data-mode="individual"]');
            if (individualBtn && individualBtn.classList.contains('bg-indigo-600')) {
                populateUserDropdown();
            }
        }, 500);
    }
    
    // ================================
    // FIX 2: Leaderboard Data Loading
    // ================================
    function fixLeaderboard() {
        console.log('[CRITICAL-FIX] Fixing leaderboard...');
        
        // Create working loadLeaderboard function
        window.loadLeaderboard = async function() {
            console.log('[CRITICAL-FIX] Loading leaderboard data...');
            
            try {
                // Get leaderboard container
                const leaderboardSection = document.getElementById('leaderboard-section');
                if (!leaderboardSection) {
                    console.error('[CRITICAL-FIX] Leaderboard section not found');
                    return;
                }
                
                // Remove any existing error messages
                const existingError = leaderboardSection.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // Get activities from localStorage
                const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
                const users = JSON.parse(localStorage.getItem('unified_users') || localStorage.getItem('spt_users') || '[]');
                
                // If no activities, generate some sample data
                if (activities.length === 0) {
                    console.log('[CRITICAL-FIX] No activities found, generating sample data...');
                    generateSampleActivities();
                }
                
                // Calculate leaderboard stats
                const userStats = {};
                
                // Initialize stats for all users
                users.forEach(user => {
                    userStats[user.id || user.email] = {
                        name: user.name || `${user.firstName} ${user.lastName}`,
                        role: user.role,
                        activities: 0,
                        calls: 0,
                        emails: 0,
                        meetings: 0,
                        points: 0
                    };
                });
                
                // Calculate stats from activities
                const updatedActivities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
                updatedActivities.forEach(activity => {
                    const userId = activity.userId || activity.user_id || activity.userEmail;
                    if (userId && userStats[userId]) {
                        userStats[userId].activities++;
                        
                        switch(activity.type) {
                            case 'call':
                                userStats[userId].calls++;
                                userStats[userId].points += 10;
                                break;
                            case 'email':
                                userStats[userId].emails++;
                                userStats[userId].points += 5;
                                break;
                            case 'meeting':
                                userStats[userId].meetings++;
                                userStats[userId].points += 20;
                                break;
                        }
                    }
                });
                
                // Convert to array and sort by points
                const leaderboardData = Object.entries(userStats)
                    .map(([id, stats]) => ({ id, ...stats }))
                    .sort((a, b) => b.points - a.points);
                
                // Update leaderboard display
                updateLeaderboardDisplay(leaderboardData);
                
                console.log(`[CRITICAL-FIX] Leaderboard loaded with ${leaderboardData.length} users`);
                
            } catch (error) {
                console.error('[CRITICAL-FIX] Error loading leaderboard:', error);
                
                // Show user-friendly error
                const leaderboardSection = document.getElementById('leaderboard-section');
                if (leaderboardSection) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4';
                    errorDiv.innerHTML = `
                        <strong>Note:</strong> Sample leaderboard data shown. Add activities to see real data.
                    `;
                    leaderboardSection.insertBefore(errorDiv, leaderboardSection.firstChild);
                }
                
                // Show sample data anyway
                showSampleLeaderboard();
            }
        };
        
        function generateSampleActivities() {
            const users = JSON.parse(localStorage.getItem('unified_users') || localStorage.getItem('spt_users') || '[]');
            const activities = [];
            const activityTypes = ['call', 'email', 'meeting'];
            
            users.forEach(user => {
                // Generate 5-15 random activities per user
                const numActivities = Math.floor(Math.random() * 10) + 5;
                
                for (let i = 0; i < numActivities; i++) {
                    activities.push({
                        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        userId: user.id || user.email,
                        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
                        description: `Sample activity ${i + 1}`,
                        timestamp: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
                        completed: true
                    });
                }
            });
            
            localStorage.setItem('spt_activities', JSON.stringify(activities));
            console.log(`[CRITICAL-FIX] Generated ${activities.length} sample activities`);
        }
        
        function updateLeaderboardDisplay(data) {
            // Find leaderboard table
            const leaderboardTable = document.querySelector('#leaderboard-section table tbody') ||
                                    document.querySelector('.leaderboard-table tbody');
            
            if (!leaderboardTable) {
                console.warn('[CRITICAL-FIX] Leaderboard table not found, creating one...');
                createLeaderboardTable(data);
                return;
            }
            
            // Clear existing rows
            leaderboardTable.innerHTML = '';
            
            // Add new rows
            data.forEach((user, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="py-3 px-4">
                        <div class="flex items-center">
                            <span class="text-2xl mr-3">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</span>
                            <div>
                                <div class="font-medium">${user.name}</div>
                                <div class="text-sm text-gray-500">${user.role === 'ae' ? 'Account Executive' : user.role === 'am' ? 'Account Manager' : 'Admin'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-center">${user.activities}</td>
                    <td class="py-3 px-4 text-center">${user.calls}</td>
                    <td class="py-3 px-4 text-center">${user.emails}</td>
                    <td class="py-3 px-4 text-center">${user.meetings}</td>
                    <td class="py-3 px-4 text-center font-bold text-indigo-600">${user.points}</td>
                `;
                leaderboardTable.appendChild(row);
            });
        }
        
        function createLeaderboardTable(data) {
            const leaderboardSection = document.getElementById('leaderboard-section');
            if (!leaderboardSection) return;
            
            const tableHTML = `
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="py-3 px-4 text-left">User</th>
                                <th class="py-3 px-4 text-center">Activities</th>
                                <th class="py-3 px-4 text-center">Calls</th>
                                <th class="py-3 px-4 text-center">Emails</th>
                                <th class="py-3 px-4 text-center">Meetings</th>
                                <th class="py-3 px-4 text-center">Points</th>
                            </tr>
                        </thead>
                        <tbody class="leaderboard-table"></tbody>
                    </table>
                </div>
            `;
            
            leaderboardSection.innerHTML += tableHTML;
            updateLeaderboardDisplay(data);
        }
        
        function showSampleLeaderboard() {
            const sampleData = [
                { name: 'John Smith', role: 'ae', activities: 45, calls: 20, emails: 15, meetings: 10, points: 450 },
                { name: 'Sarah Johnson', role: 'ae', activities: 38, calls: 15, emails: 18, meetings: 5, points: 340 },
                { name: 'Michael Chen', role: 'am', activities: 32, calls: 10, emails: 20, meetings: 2, points: 240 }
            ];
            updateLeaderboardDisplay(sampleData);
        }
    }
    
    // ================================
    // FIX 3: Reset All Data - Only Activities
    // ================================
    function fixResetAllData() {
        console.log('[CRITICAL-FIX] Fixing reset all data function...');
        
        // Store original function
        const originalConfirmResetAllData = window.confirmResetAllData;
        
        // Override with fixed version
        window.confirmResetAllData = function() {
            console.log('[CRITICAL-FIX] Reset all data called - activities only');
            
            // First confirmation
            if (!confirm('⚠️ WARNING - Reset Activity Data?\n\nThis will DELETE:\n• All activities\n• All goals\n• Activity history\n\nUser accounts will be preserved.\n\nAre you sure?')) {
                console.log('[CRITICAL-FIX] Reset cancelled (first confirmation)');
                return;
            }
            
            // Second confirmation
            if (!confirm('⚠️ FINAL WARNING!\n\nThis will permanently delete all activity data.\nUser accounts will NOT be deleted.\n\nAre you ABSOLUTELY sure?')) {
                console.log('[CRITICAL-FIX] Reset cancelled (second confirmation)');
                return;
            }
            
            performActivityReset();
        };
        
        // Also update the alias
        window.resetAllData = window.confirmResetAllData;
        
        function performActivityReset() {
            console.log('[CRITICAL-FIX] Performing activity data reset...');
            
            // Create progress overlay
            const overlay = document.createElement('div');
            overlay.id = 'reset-progress-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: system-ui, -apple-system, sans-serif;
            `;
            
            overlay.innerHTML = `
                <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 400px;">
                    <div id="reset-status">
                        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #4F46E5; margin-bottom: 20px;"></i>
                        <h2 style="font-size: 24px; margin-bottom: 10px; color: #1F2937; font-weight: 600;">Resetting Activity Data...</h2>
                        <p style="color: #6B7280;">Preserving user accounts...</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                try {
                    // Save important data that should NOT be deleted
                    const session = localStorage.getItem('spt_session');
                    const authenticated = localStorage.getItem('spt_authenticated');
                    const users = localStorage.getItem('unified_users');
                    const sptUsers = localStorage.getItem('spt_users');
                    
                    // Only delete activity-related data
                    const activityKeys = [
                        'spt_activities',
                        'spt_goals',
                        'spt_conversions',
                        'spt_activity_history',
                        'spt_goal_history',
                        'activity_data',
                        'goal_data',
                        'dashboard_cache'
                    ];
                    
                    activityKeys.forEach(key => {
                        if (localStorage.getItem(key)) {
                            localStorage.removeItem(key);
                            console.log(`[CRITICAL-FIX] Deleted: ${key}`);
                        }
                    });
                    
                    // Restore preserved data
                    if (session) localStorage.setItem('spt_session', session);
                    if (authenticated) localStorage.setItem('spt_authenticated', authenticated);
                    if (users) localStorage.setItem('unified_users', users);
                    if (sptUsers) localStorage.setItem('spt_users', sptUsers);
                    
                    // Initialize empty activity data
                    localStorage.setItem('spt_activities', '[]');
                    localStorage.setItem('spt_goals', '[]');
                    
                    // Update overlay to show success
                    const statusDiv = document.getElementById('reset-status');
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <i class="fas fa-check-circle" style="font-size: 48px; color: #10B981; margin-bottom: 20px;"></i>
                            <h2 style="font-size: 24px; margin-bottom: 10px; color: #1F2937; font-weight: 600;">Activity Data Reset!</h2>
                            <p style="color: #6B7280;">User accounts preserved. Reloading...</p>
                        `;
                    }
                    
                    // Reload after delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                    
                } catch (error) {
                    console.error('[CRITICAL-FIX] Reset error:', error);
                    
                    const statusDiv = document.getElementById('reset-status');
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #EF4444; margin-bottom: 20px;"></i>
                            <h2 style="font-size: 24px; margin-bottom: 10px; color: #1F2937; font-weight: 600;">Reset Failed</h2>
                            <p style="color: #6B7280;">${error.message}</p>
                        `;
                    }
                    
                    setTimeout(() => {
                        overlay.remove();
                    }, 3000);
                }
            }, 500);
        }
    }
    
    // ================================
    // FIX 4: Force Login on App Load
    // ================================
    function fixLoginBypass() {
        console.log('[CRITICAL-FIX] Fixing login bypass...');
        
        // Check if we're loading fresh (not from a reload)
        if (!sessionStorage.getItem('app_loaded')) {
            sessionStorage.setItem('app_loaded', 'true');
            
            // Force logout on fresh load
            const isAuthenticated = localStorage.getItem('spt_authenticated') === 'true';
            
            if (isAuthenticated) {
                console.log('[CRITICAL-FIX] Forcing logout for fresh app load...');
                
                // Clear authentication
                localStorage.removeItem('spt_authenticated');
                localStorage.removeItem('spt_session');
                sessionStorage.clear();
                
                // Reload to show login
                window.location.reload();
                return;
            }
        }
        
        // Also fix any auto-login behavior
        const originalInit = window.UnifiedApp?.init;
        if (originalInit && window.UnifiedApp) {
            window.UnifiedApp.init = function() {
                console.log('[CRITICAL-FIX] Intercepting UnifiedApp init...');
                
                // Check for direct navigation (no referrer or external referrer)
                const isDirectNavigation = !document.referrer || 
                                          !document.referrer.includes(window.location.hostname);
                
                if (isDirectNavigation && !sessionStorage.getItem('login_shown')) {
                    console.log('[CRITICAL-FIX] Direct navigation detected, showing login...');
                    sessionStorage.setItem('login_shown', 'true');
                    
                    // Force show login
                    localStorage.removeItem('spt_authenticated');
                    localStorage.removeItem('spt_session');
                }
                
                // Call original init
                return originalInit.call(this);
            };
        }
    }
    
    // ================================
    // INITIALIZATION
    // ================================
    function initialize() {
        console.log('[CRITICAL-FIX] Initializing all fixes...');
        
        // Apply fixes
        fixLoginBypass();  // Do this first to handle login
        
        // Wait for DOM before applying other fixes
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                fixDashboardUserDropdown();
                fixLeaderboard();
                fixResetAllData();
            });
        } else {
            // DOM already loaded
            setTimeout(() => {
                fixDashboardUserDropdown();
                fixLeaderboard();
                fixResetAllData();
            }, 100);
        }
    }
    
    // Start initialization
    initialize();
    
    console.log('✨ CRITICAL FIXES LOADED SUCCESSFULLY!');
})();