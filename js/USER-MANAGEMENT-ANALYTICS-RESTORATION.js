// ========================================
// USER MANAGEMENT & ANALYTICS RESTORATION FIX
// Fixes:
// 1. Restore Edit User functionality
// 2. Restore Act As User functionality  
// 3. Fix analytics false values (activities today, avg deal size, etc.)
// 4. Fix pipeline and revenue false values
// 5. Remove private debug mode from login
// ========================================

console.log('🔧 USER MANAGEMENT & ANALYTICS RESTORATION LOADING...');

(function() {
    'use strict';
    
    // ================================
    // FIX 1: Restore Edit User Functionality
    // ================================
    window.editUser = function(userId) {
        console.log('[RESTORE-FIX] Opening edit user modal for:', userId);
        
        // Get user data
        const users = [...JSON.parse(localStorage.getItem('unified_users') || '[]'),
                      ...JSON.parse(localStorage.getItem('spt_users') || '[]')];
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 class="text-xl font-bold mb-4">Edit User</h3>
                <form id="edit-user-form" onsubmit="return handleEditUser(event, '${userId}')">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" id="edit-firstName" value="${user.firstName || user.name?.split(' ')[0] || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" id="edit-lastName" value="${user.lastName || user.name?.split(' ')[1] || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="edit-email" value="${user.email}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="tel" id="edit-phone" value="${user.phone || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input type="text" id="edit-department" value="${user.department || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select id="edit-role" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="ae" ${user.role === 'ae' ? 'selected' : ''}>Account Executive</option>
                                <option value="am" ${user.role === 'am' ? 'selected' : ''}>Account Manager</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                            <input type="password" id="edit-password" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                   placeholder="Enter new password or leave blank">
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="closeEditModal()" 
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    };
    
    window.handleEditUser = function(event, userId) {
        event.preventDefault();
        console.log('[RESTORE-FIX] Saving user edits for:', userId);
        
        // Get form values
        const firstName = document.getElementById('edit-firstName').value;
        const lastName = document.getElementById('edit-lastName').value;
        const email = document.getElementById('edit-email').value;
        const phone = document.getElementById('edit-phone').value;
        const department = document.getElementById('edit-department').value;
        const role = document.getElementById('edit-role').value;
        const password = document.getElementById('edit-password').value;
        
        // Update user in storage
        let users = JSON.parse(localStorage.getItem('unified_users') || '[]');
        let sptUsers = JSON.parse(localStorage.getItem('spt_users') || '[]');
        
        // Update in unified_users
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
            users[userIndex] = {
                ...users[userIndex],
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                email,
                phone,
                department,
                role,
                ...(password ? { password } : {})
            };
            localStorage.setItem('unified_users', JSON.stringify(users));
        }
        
        // Update in spt_users
        const sptIndex = sptUsers.findIndex(u => u.id === userId);
        if (sptIndex >= 0) {
            sptUsers[sptIndex] = {
                ...sptUsers[sptIndex],
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                email,
                phone,
                department,
                role,
                ...(password ? { password } : {})
            };
            localStorage.setItem('spt_users', JSON.stringify(sptUsers));
        }
        
        // Close modal and refresh
        closeEditModal();
        
        // Refresh user list if visible
        if (typeof loadUsers === 'function') {
            loadUsers();
        }
        
        // Show success message
        showNotification('User updated successfully', 'success');
        
        return false;
    };
    
    window.closeEditModal = function() {
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
            modal.remove();
        }
    };
    
    // ================================
    // FIX 2: Restore Act As User Functionality
    // ================================
    window.actAsUser = function(userId) {
        console.log('[RESTORE-FIX] Act as user triggered, opening selector modal');
        
        // If userId provided, act as that user directly
        if (userId) {
            const users = [...JSON.parse(localStorage.getItem('unified_users') || '[]'),
                          ...JSON.parse(localStorage.getItem('spt_users') || '[]')];
            const user = users.find(u => u.id === userId);
            
            if (user && user.role !== 'admin') {
                switchToUser(user);
                return;
            }
        }
        
        // Otherwise show selector modal
        const users = [...JSON.parse(localStorage.getItem('unified_users') || '[]'),
                      ...JSON.parse(localStorage.getItem('spt_users') || '[]')];
        
        // Filter out admin users
        const nonAdminUsers = users.filter(u => u.role !== 'admin');
        
        if (nonAdminUsers.length === 0) {
            alert('No non-admin users available to act as');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <h3 class="text-xl font-bold mb-4">Act As User</h3>
                <p class="text-gray-600 mb-4">Select a user to act as:</p>
                <div class="space-y-2">
                    ${nonAdminUsers.map(user => `
                        <button onclick="switchToUser('${user.id}')" 
                                class="w-full text-left p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="font-semibold">${user.name || `${user.firstName} ${user.lastName}`}</p>
                                    <p class="text-sm text-gray-600">${user.email}</p>
                                </div>
                                <span class="px-2 py-1 bg-${user.role === 'ae' ? 'blue' : 'green'}-100 
                                             text-${user.role === 'ae' ? 'blue' : 'green'}-800 text-xs rounded-full">
                                    ${user.role === 'ae' ? 'Account Executive' : 'Account Manager'}
                                </span>
                            </div>
                        </button>
                    `).join('')}
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button onclick="closeActAsModal()" 
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    ${sessionStorage.getItem('act_as_user') ? `
                        <button onclick="stopActingAsUser()" 
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            Stop Acting As User
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    };
    
    window.switchToUser = function(userIdOrObject) {
        console.log('[RESTORE-FIX] Switching to user:', userIdOrObject);
        
        let user;
        if (typeof userIdOrObject === 'string') {
            const users = [...JSON.parse(localStorage.getItem('unified_users') || '[]'),
                          ...JSON.parse(localStorage.getItem('spt_users') || '[]')];
            user = users.find(u => u.id === userIdOrObject);
        } else {
            user = userIdOrObject;
        }
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Store act as user info
        sessionStorage.setItem('act_as_user', JSON.stringify(user));
        
        // Update UI
        document.getElementById('current-user').textContent = user.name || `${user.firstName} ${user.lastName}`;
        document.getElementById('current-role').textContent = user.role === 'ae' ? 'Account Executive' : 'Account Manager';
        document.getElementById('role-selector').value = user.role;
        
        // Update avatar
        const initials = (user.name || `${user.firstName} ${user.lastName}`).split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('user-avatar').textContent = initials;
        
        // Show notification
        showActAsNotification(user);
        
        // Close modal
        closeActAsModal();
        
        // Refresh dashboard
        if (typeof showSection === 'function') {
            showSection('dashboard');
        }
    };
    
    window.stopActingAsUser = function() {
        console.log('[RESTORE-FIX] Stopping act as user');
        
        sessionStorage.removeItem('act_as_user');
        
        // Restore original user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        document.getElementById('current-user').textContent = currentUser.name || 'Admin';
        document.getElementById('current-role').textContent = 'Admin';
        document.getElementById('role-selector').value = 'admin';
        
        // Update avatar
        const initials = (currentUser.name || 'Admin').split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('user-avatar').textContent = initials;
        
        // Remove notification
        const notification = document.getElementById('act-as-notification');
        if (notification) {
            notification.remove();
        }
        
        // Close modal
        closeActAsModal();
        
        // Refresh dashboard
        if (typeof showSection === 'function') {
            showSection('dashboard');
        }
    };
    
    window.closeActAsModal = function() {
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
            modal.remove();
        }
    };
    
    window.showActAsNotification = function(user) {
        // Remove existing notification
        const existing = document.getElementById('act-as-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.id = 'act-as-notification';
        notification.className = 'fixed top-20 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow-lg z-40';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-user-secret text-yellow-600 mr-2"></i>
                <div>
                    <p class="font-semibold text-yellow-800">Acting as ${user.name || `${user.firstName} ${user.lastName}`}</p>
                    <p class="text-sm text-yellow-700">${user.email} (${user.role === 'ae' ? 'AE' : 'AM'})</p>
                </div>
                <button onclick="stopActingAsUser()" class="ml-4 text-yellow-600 hover:text-yellow-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
    };
    
    // ================================
    // FIX 3: Fix Analytics False Values
    // ================================
    window.calculateRealAnalyticsMetrics = function() {
        console.log('[RESTORE-FIX] Calculating real analytics metrics');
        
        const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
        const users = [...JSON.parse(localStorage.getItem('unified_users') || '[]'),
                      ...JSON.parse(localStorage.getItem('spt_users') || '[]')];
        
        // Get current date info
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Activities today
        const activitiesToday = activities.filter(a => {
            const actDate = new Date(a.date || a.created_at);
            actDate.setHours(0, 0, 0, 0);
            return actDate.getTime() === today.getTime();
        }).length;
        
        // Average deal size (from activities with dealSize field)
        const dealsWithSize = activities.filter(a => a.dealSize && a.dealSize > 0);
        const avgDealSize = dealsWithSize.length > 0 
            ? Math.round(dealsWithSize.reduce((sum, a) => sum + parseFloat(a.dealSize), 0) / dealsWithSize.length)
            : 0;
        
        // Active users (users who have activities)
        const activeUserIds = new Set(activities.map(a => a.userId || a.userEmail));
        const activeUsers = activeUserIds.size;
        
        // Response rate (meetings/outreach)
        const outreachActivities = activities.filter(a => 
            a.type === 'call' || a.type === 'email' || a.type === 'linkedin'
        ).length;
        const meetings = activities.filter(a => a.type === 'meeting').length;
        const responseRate = outreachActivities > 0 
            ? Math.round((meetings / outreachActivities) * 100)
            : 0;
        
        // Pipeline generated (sum of all pipeline values)
        const pipelineGenerated = activities
            .filter(a => a.pipeline && a.pipeline > 0)
            .reduce((sum, a) => sum + parseFloat(a.pipeline), 0);
        
        // Revenue closed (sum of all revenue values)
        const revenueClosed = activities
            .filter(a => a.revenue && a.revenue > 0)
            .reduce((sum, a) => sum + parseFloat(a.revenue), 0);
        
        return {
            activitiesToday,
            avgDealSize,
            activeUsers,
            responseRate,
            pipelineGenerated,
            revenueClosed
        };
    };
    
    window.updateAnalyticsWithRealData = function() {
        console.log('[RESTORE-FIX] Updating analytics with real data');
        
        const metrics = calculateRealAnalyticsMetrics();
        
        // Update Activities Today
        const activitiesTodayEl = document.querySelector('[data-metric="activities-today"] .text-3xl, #activities-today-value');
        if (activitiesTodayEl) {
            activitiesTodayEl.textContent = metrics.activitiesToday;
        }
        
        // Update Avg Deal Size
        const avgDealSizeEl = document.querySelector('[data-metric="avg-deal-size"] .text-3xl, #avg-deal-size-value');
        if (avgDealSizeEl) {
            avgDealSizeEl.textContent = metrics.avgDealSize > 0 ? `$${metrics.avgDealSize.toLocaleString()}` : '$0';
        }
        
        // Update Active Users
        const activeUsersEl = document.querySelector('[data-metric="active-users"] .text-3xl, #active-users-value');
        if (activeUsersEl) {
            activeUsersEl.textContent = metrics.activeUsers;
        }
        
        // Update Response Rate
        const responseRateEl = document.querySelector('[data-metric="response-rate"] .text-3xl, #response-rate-value');
        if (responseRateEl) {
            responseRateEl.textContent = `${metrics.responseRate}%`;
        }
        
        // Update Pipeline Generated
        const pipelineEls = document.querySelectorAll('[data-metric="pipeline"] .text-3xl, #pipeline-value, [id*="pipeline-value"]');
        pipelineEls.forEach(el => {
            if (!el.id || !el.id.includes('goal')) {
                el.textContent = metrics.pipelineGenerated > 0 
                    ? `$${Math.round(metrics.pipelineGenerated).toLocaleString()}`
                    : '$0';
            }
        });
        
        // Update Revenue Closed
        const revenueEls = document.querySelectorAll('[data-metric="revenue"] .text-3xl, #revenue-value, [id*="revenue-value"]');
        revenueEls.forEach(el => {
            if (!el.id || !el.id.includes('goal')) {
                el.textContent = metrics.revenueClosed > 0 
                    ? `$${Math.round(metrics.revenueClosed).toLocaleString()}`
                    : '$0';
            }
        });
        
        console.log('[RESTORE-FIX] Analytics updated with real metrics:', metrics);
    };
    
    // ================================
    // FIX 4: Remove Private Debug Mode from Login
    // ================================
    function removeDebugFromLogin() {
        console.log('[RESTORE-FIX] Removing debug panel from login screen');
        
        // Add styles to hide debug panel on login
        const style = document.createElement('style');
        style.textContent = `
            /* Hide debug panel on login screen */
            #login-page #debug-panel,
            #login-page .debug-panel,
            #login-page [id*="debug"],
            body:has(#login-page:not(.hidden)) #debug-panel,
            body:has(#login-page[style*="flex"]) #debug-panel,
            body:has(#login-page[style*="block"]) #debug-panel {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
            
            /* Ensure login page is clean */
            #login-page {
                position: fixed !important;
                inset: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            }
            
            /* Remove any absolute positioned elements in top corners */
            #login-page .absolute,
            #login-page [style*="position: absolute"],
            #login-page [style*="position:absolute"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        
        // Also actively remove debug panels from login page
        setInterval(() => {
            const loginPage = document.getElementById('login-page');
            if (loginPage && (loginPage.style.display === 'flex' || loginPage.style.display === 'block')) {
                const debugElements = document.querySelectorAll('#debug-panel, .debug-panel, [id*="debug"]');
                debugElements.forEach(el => {
                    if (el.style.display !== 'none') {
                        el.style.display = 'none';
                    }
                });
            }
        }, 500);
    }
    
    // ================================
    // HELPER FUNCTIONS
    // ================================
    window.showNotification = function(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 
                                  ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
    
    // ================================
    // INITIALIZATION
    // ================================
    function initialize() {
        console.log('[RESTORE-FIX] Initializing user management and analytics restoration');
        
        // Remove debug from login immediately
        removeDebugFromLogin();
        
        // Set up periodic analytics updates
        setInterval(() => {
            const analyticsSection = document.getElementById('analytics-section');
            if (analyticsSection && analyticsSection.style.display !== 'none') {
                updateAnalyticsWithRealData();
            }
        }, 1000);
        
        // Override showSection to update analytics when shown
        const originalShowSection = window.showSection;
        window.showSection = function(section) {
            if (originalShowSection) {
                originalShowSection(section);
            }
            
            if (section === 'analytics') {
                setTimeout(updateAnalyticsWithRealData, 100);
            }
        };
        
        // Check for act as user on load
        const actAsUser = JSON.parse(sessionStorage.getItem('act_as_user') || '{}');
        if (actAsUser.id) {
            showActAsNotification(actAsUser);
        }
        
        console.log('[RESTORE-FIX] User management and analytics restoration initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Also initialize after a delay to catch late-loading elements
    setTimeout(initialize, 1000);
})();

console.log('✅ USER MANAGEMENT & ANALYTICS RESTORATION LOADED');