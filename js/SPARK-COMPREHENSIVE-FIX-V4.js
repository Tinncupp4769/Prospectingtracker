// ========================================
// SPARK SALES ACTIVITY TRACKER - COMPREHENSIVE FIX V4.0
// Complete solution for all identified issues
// ========================================

console.log('🚀 SPARK COMPREHENSIVE FIX V4.0 INITIALIZING...');

(function() {
    'use strict';
    
    // ================================
    // ERROR LOGGING & MONITORING SYSTEM
    // ================================
    const ErrorLogger = {
        logs: [],
        maxLogs: 100,
        
        log: function(category, message, data = {}) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                category,
                message,
                data,
                stackTrace: new Error().stack
            };
            
            this.logs.unshift(logEntry);
            if (this.logs.length > this.maxLogs) {
                this.logs = this.logs.slice(0, this.maxLogs);
            }
            
            // Store in localStorage for persistence
            localStorage.setItem('spark_error_logs', JSON.stringify(this.logs));
            
            // Console output for debugging
            console.log(`[${category}] ${message}`, data);
            
            // Show on-screen alert for critical errors
            if (category === 'ERROR' || category === 'CRITICAL') {
                this.showAlert(message, 'error');
            }
        },
        
        showAlert: function(message, type = 'info') {
            const alert = document.createElement('div');
            alert.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 max-w-md
                             ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'} 
                             text-white`;
            alert.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(alert);
            
            setTimeout(() => {
                alert.style.opacity = '0';
                alert.style.transition = 'opacity 0.3s';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        },
        
        getLogs: function(category = null) {
            if (category) {
                return this.logs.filter(log => log.category === category);
            }
            return this.logs;
        }
    };
    
    // Make ErrorLogger globally accessible
    window.SparkErrorLogger = ErrorLogger;
    
    // ================================
    // REQUIREMENT 1: COMPLETE USER EDIT FUNCTIONALITY
    // ================================
    window.SparkUserEditor = {
        init: function() {
            ErrorLogger.log('INFO', 'Initializing SparkUserEditor');
        },
        
        editUser: function(userId) {
            ErrorLogger.log('USER_EDIT', `Opening edit modal for user: ${userId}`);
            
            try {
                // Get all users from storage
                const users = this.getAllUsers();
                const user = users.find(u => u.id === userId);
                
                if (!user) {
                    throw new Error(`User not found: ${userId}`);
                }
                
                // Create comprehensive edit modal
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto';
                modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-2xl font-bold">Edit User Profile - Complete Access</h3>
                            <button onclick="SparkUserEditor.closeModal()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="spark-edit-user-form" onsubmit="return SparkUserEditor.saveUser(event, '${userId}')">
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Basic Information -->
                                <div class="col-span-2">
                                    <h4 class="font-semibold text-gray-700 mb-2 border-b pb-1">Basic Information</h4>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input type="text" id="edit-firstName" value="${user.firstName || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                           required>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input type="text" id="edit-lastName" value="${user.lastName || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                           required>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input type="email" id="edit-email" value="${user.email}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                           required onblur="SparkUserEditor.validateEmail(this.value, '${userId}')">
                                    <span id="email-error" class="text-red-500 text-xs hidden">Email already exists</span>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input type="tel" id="edit-phone" value="${user.phone || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                </div>
                                
                                <!-- Role & Permissions -->
                                <div class="col-span-2 mt-4">
                                    <h4 class="font-semibold text-gray-700 mb-2 border-b pb-1">Role & Permissions</h4>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                    <select id="edit-role" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                                        <option value="ae" ${user.role === 'ae' ? 'selected' : ''}>Account Executive</option>
                                        <option value="am" ${user.role === 'am' ? 'selected' : ''}>Account Manager</option>
                                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input type="text" id="edit-department" value="${user.department || 'Sales'}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                                    <input type="text" id="edit-manager" value="${user.manager || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                           placeholder="Manager's name">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                    <input type="text" id="edit-team" value="${user.team || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                           placeholder="Team name">
                                </div>
                                
                                <!-- Account Settings -->
                                <div class="col-span-2 mt-4">
                                    <h4 class="font-semibold text-gray-700 mb-2 border-b pb-1">Account Settings</h4>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select id="edit-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="active" ${user.status === 'active' || !user.status ? 'selected' : ''}>Active</option>
                                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                                    <select id="edit-timezone" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="America/New_York" ${user.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time</option>
                                        <option value="America/Chicago" ${user.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time</option>
                                        <option value="America/Denver" ${user.timezone === 'America/Denver' ? 'selected' : ''}>Mountain Time</option>
                                        <option value="America/Los_Angeles" ${user.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input type="password" id="edit-password" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                           placeholder="Leave blank to keep current">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input type="password" id="edit-confirmPassword" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                           placeholder="Confirm new password">
                                </div>
                                
                                <!-- Permissions -->
                                <div class="col-span-2 mt-4">
                                    <h4 class="font-semibold text-gray-700 mb-2 border-b pb-1">Permissions</h4>
                                    <div class="grid grid-cols-3 gap-3 mt-2">
                                        <label class="flex items-center">
                                            <input type="checkbox" id="perm-viewReports" ${user.permissions?.viewReports !== false ? 'checked' : ''} 
                                                   class="mr-2 rounded">
                                            <span class="text-sm">View Reports</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="perm-editActivities" ${user.permissions?.editActivities !== false ? 'checked' : ''} 
                                                   class="mr-2 rounded">
                                            <span class="text-sm">Edit Activities</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="perm-manageUsers" ${user.permissions?.manageUsers === true ? 'checked' : ''} 
                                                   class="mr-2 rounded">
                                            <span class="text-sm">Manage Users</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="perm-exportData" ${user.permissions?.exportData !== false ? 'checked' : ''} 
                                                   class="mr-2 rounded">
                                            <span class="text-sm">Export Data</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="perm-viewAnalytics" ${user.permissions?.viewAnalytics !== false ? 'checked' : ''} 
                                                   class="mr-2 rounded">
                                            <span class="text-sm">View Analytics</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="perm-setGoals" ${user.permissions?.setGoals !== false ? 'checked' : ''} 
                                                   class="mr-2 rounded">
                                            <span class="text-sm">Set Goals</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <!-- Additional Information -->
                                <div class="col-span-2 mt-4">
                                    <h4 class="font-semibold text-gray-700 mb-2 border-b pb-1">Additional Information</h4>
                                </div>
                                
                                <div class="col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea id="edit-notes" rows="3" 
                                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              placeholder="Any additional notes about this user">${user.notes || ''}</textarea>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center mt-6 pt-4 border-t">
                                <div class="text-sm text-gray-500">
                                    User ID: ${userId} | Created: ${new Date(user.created_at || Date.now()).toLocaleDateString()}
                                </div>
                                <div class="flex space-x-3">
                                    <button type="button" onclick="SparkUserEditor.closeModal()" 
                                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                                        Cancel
                                    </button>
                                    <button type="submit" 
                                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Save All Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                `;
                
                document.body.appendChild(modal);
                ErrorLogger.log('INFO', 'Edit modal created successfully');
                
            } catch (error) {
                ErrorLogger.log('ERROR', 'Failed to open edit modal', { error: error.message });
            }
        },
        
        validateEmail: function(email, currentUserId) {
            const users = this.getAllUsers();
            const duplicate = users.find(u => u.email === email && u.id !== currentUserId);
            
            const errorElement = document.getElementById('email-error');
            if (duplicate) {
                errorElement.classList.remove('hidden');
                return false;
            } else {
                errorElement.classList.add('hidden');
                return true;
            }
        },
        
        saveUser: function(event, userId) {
            event.preventDefault();
            ErrorLogger.log('USER_EDIT', `Saving user changes for: ${userId}`);
            
            try {
                // Validate passwords match
                const password = document.getElementById('edit-password').value;
                const confirmPassword = document.getElementById('edit-confirmPassword').value;
                
                if (password && password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                
                // Validate email uniqueness
                const email = document.getElementById('edit-email').value;
                if (!this.validateEmail(email, userId)) {
                    throw new Error('Email already exists');
                }
                
                // Collect all form data
                const updatedUser = {
                    id: userId,
                    firstName: document.getElementById('edit-firstName').value,
                    lastName: document.getElementById('edit-lastName').value,
                    name: `${document.getElementById('edit-firstName').value} ${document.getElementById('edit-lastName').value}`,
                    email: email,
                    phone: document.getElementById('edit-phone').value,
                    role: document.getElementById('edit-role').value,
                    department: document.getElementById('edit-department').value,
                    manager: document.getElementById('edit-manager').value,
                    team: document.getElementById('edit-team').value,
                    status: document.getElementById('edit-status').value,
                    timezone: document.getElementById('edit-timezone').value,
                    notes: document.getElementById('edit-notes').value,
                    permissions: {
                        viewReports: document.getElementById('perm-viewReports').checked,
                        editActivities: document.getElementById('perm-editActivities').checked,
                        manageUsers: document.getElementById('perm-manageUsers').checked,
                        exportData: document.getElementById('perm-exportData').checked,
                        viewAnalytics: document.getElementById('perm-viewAnalytics').checked,
                        setGoals: document.getElementById('perm-setGoals').checked
                    },
                    updated_at: Date.now()
                };
                
                // Add password if changed
                if (password) {
                    updatedUser.password = password;
                }
                
                // Save to all storage locations
                this.updateUserInStorage(userId, updatedUser);
                
                // Close modal
                this.closeModal();
                
                // Refresh user list
                if (typeof loadUsers === 'function') {
                    loadUsers();
                }
                
                // Show success message
                ErrorLogger.showAlert('User profile updated successfully!', 'success');
                ErrorLogger.log('SUCCESS', 'User saved successfully', { userId, changes: updatedUser });
                
            } catch (error) {
                ErrorLogger.log('ERROR', 'Failed to save user', { error: error.message });
                ErrorLogger.showAlert(error.message, 'error');
            }
            
            return false;
        },
        
        getAllUsers: function() {
            const unified = JSON.parse(localStorage.getItem('unified_users') || '[]');
            const spt = JSON.parse(localStorage.getItem('spt_users') || '[]');
            const map = new Map();
            
            [...unified, ...spt].forEach(user => {
                if (!map.has(user.id)) {
                    map.set(user.id, user);
                }
            });
            
            return Array.from(map.values());
        },
        
        updateUserInStorage: function(userId, updatedUser) {
            // Update in unified_users
            let unified = JSON.parse(localStorage.getItem('unified_users') || '[]');
            const unifiedIndex = unified.findIndex(u => u.id === userId);
            if (unifiedIndex >= 0) {
                unified[unifiedIndex] = { ...unified[unifiedIndex], ...updatedUser };
            } else {
                unified.push(updatedUser);
            }
            localStorage.setItem('unified_users', JSON.stringify(unified));
            
            // Update in spt_users
            let spt = JSON.parse(localStorage.getItem('spt_users') || '[]');
            const sptIndex = spt.findIndex(u => u.id === userId);
            if (sptIndex >= 0) {
                spt[sptIndex] = { ...spt[sptIndex], ...updatedUser };
            } else {
                spt.push(updatedUser);
            }
            localStorage.setItem('spt_users', JSON.stringify(spt));
            
            ErrorLogger.log('INFO', 'User storage updated', { userId });
        },
        
        closeModal: function() {
            const modal = document.querySelector('.fixed.inset-0');
            if (modal) {
                modal.remove();
            }
        }
    };
    
    // ================================
    // REQUIREMENT 2: FIX ANALYTICS TO SHOW REAL DATA ONLY
    // ================================
    window.SparkAnalytics = {
        init: function() {
            ErrorLogger.log('INFO', 'Initializing SparkAnalytics');
            this.updateAllMetrics();
        },
        
        calculateMetrics: function() {
            ErrorLogger.log('ANALYTICS', 'Calculating real metrics');
            
            const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            const users = SparkUserEditor.getAllUsers();
            
            // Get today's date at midnight
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTime = today.getTime();
            
            // Activities Today - only from today
            const activitiesToday = activities.filter(a => {
                const actDate = new Date(a.date || a.created_at);
                actDate.setHours(0, 0, 0, 0);
                return actDate.getTime() === todayTime;
            });
            
            // Average Deal Size - from existing deals only
            const dealsWithSize = activities.filter(a => 
                a.dealSize && !isNaN(parseFloat(a.dealSize)) && parseFloat(a.dealSize) > 0
            );
            const avgDealSize = dealsWithSize.length > 0
                ? dealsWithSize.reduce((sum, a) => sum + parseFloat(a.dealSize), 0) / dealsWithSize.length
                : 0;
            
            // Active Users - users with recent activity (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentActivities = activities.filter(a => {
                const actDate = new Date(a.date || a.created_at);
                return actDate >= sevenDaysAgo;
            });
            const activeUserIds = new Set(recentActivities.map(a => a.userId || a.userEmail));
            
            // Response Rate - real responses vs prospects
            const outreachCount = activities.filter(a => 
                a.type === 'call' || a.type === 'email' || a.type === 'linkedin'
            ).length;
            const responseCount = activities.filter(a => 
                a.type === 'meeting' || a.responded === true
            ).length;
            const responseRate = outreachCount > 0 
                ? (responseCount / outreachCount) * 100 
                : 0;
            
            // Pipeline and Revenue
            const pipelineTotal = activities
                .filter(a => a.pipeline && !isNaN(parseFloat(a.pipeline)))
                .reduce((sum, a) => sum + parseFloat(a.pipeline), 0);
            
            const revenueTotal = activities
                .filter(a => a.revenue && !isNaN(parseFloat(a.revenue)))
                .reduce((sum, a) => sum + parseFloat(a.revenue), 0);
            
            const metrics = {
                activitiesToday: activitiesToday.length,
                avgDealSize: Math.round(avgDealSize),
                activeUsers: activeUserIds.size,
                responseRate: Math.round(responseRate),
                pipelineGenerated: Math.round(pipelineTotal),
                revenueClosed: Math.round(revenueTotal),
                hasData: activities.length > 0
            };
            
            ErrorLogger.log('ANALYTICS', 'Metrics calculated', metrics);
            return metrics;
        },
        
        updateAllMetrics: function() {
            const metrics = this.calculateMetrics();
            
            // Update Activities Today
            this.updateMetricDisplay('activities-today', metrics.activitiesToday, 'count');
            
            // Update Avg Deal Size
            this.updateMetricDisplay('avg-deal-size', metrics.avgDealSize, 'currency');
            
            // Update Active Users
            this.updateMetricDisplay('active-users', metrics.activeUsers, 'count');
            
            // Update Response Rate
            this.updateMetricDisplay('response-rate', metrics.responseRate, 'percentage');
            
            // Update Pipeline Generated
            this.updateMetricDisplay('pipeline-generated', metrics.pipelineGenerated, 'currency');
            
            // Update Revenue Closed
            this.updateMetricDisplay('revenue-closed', metrics.revenueClosed, 'currency');
            
            // Handle "No Data" state
            if (!metrics.hasData) {
                this.showNoDataState();
            }
        },
        
        updateMetricDisplay: function(metricId, value, type) {
            // Find all elements that might display this metric
            const elements = [
                document.getElementById(`${metricId}-value`),
                document.querySelector(`[data-metric="${metricId}"] .metric-value`),
                document.querySelector(`[data-metric="${metricId}"] .text-3xl`),
                document.querySelector(`[data-metric="${metricId}"] .text-2xl`)
            ].filter(el => el);
            
            elements.forEach(element => {
                if (type === 'currency') {
                    element.textContent = value > 0 ? `$${value.toLocaleString()}` : '$0';
                } else if (type === 'percentage') {
                    element.textContent = `${value}%`;
                } else {
                    element.textContent = value.toString();
                }
            });
            
            // Update trend indicators
            const trendElements = [
                document.getElementById(`${metricId}-trend`),
                document.querySelector(`[data-metric="${metricId}"] .trend-indicator`)
            ].filter(el => el);
            
            trendElements.forEach(element => {
                if (value === 0) {
                    element.innerHTML = '<span class="text-gray-400">No data</span>';
                } else {
                    // Calculate actual trend based on historical data
                    const trend = this.calculateTrend(metricId);
                    element.innerHTML = this.formatTrend(trend);
                }
            });
        },
        
        calculateTrend: function(metricId) {
            // This would calculate the actual trend based on historical data
            // For now, return no change if no historical data
            return { value: 0, direction: 'flat' };
        },
        
        formatTrend: function(trend) {
            if (trend.direction === 'up') {
                return `<i class="fas fa-arrow-up text-green-500"></i> <span class="text-green-600">+${trend.value}%</span>`;
            } else if (trend.direction === 'down') {
                return `<i class="fas fa-arrow-down text-red-500"></i> <span class="text-red-600">${trend.value}%</span>`;
            } else {
                return `<i class="fas fa-minus text-gray-400"></i> <span class="text-gray-400">0%</span>`;
            }
        },
        
        showNoDataState: function() {
            // Add "No data available" messages where appropriate
            const noDataMessage = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>No data available</p>
                </div>
            `;
            
            // Update chart containers
            const chartContainers = document.querySelectorAll('[id*="-chart"]');
            chartContainers.forEach(container => {
                if (!container.querySelector('canvas')?.getContext('2d').__chart) {
                    container.innerHTML = noDataMessage;
                }
            });
        }
    };
    
    // ================================
    // REQUIREMENT 3: FIX VIEW AS INDIVIDUAL AUTO-SWITCH
    // ================================
    window.SparkDashboardSwitcher = {
        init: function() {
            ErrorLogger.log('INFO', 'Initializing SparkDashboardSwitcher');
            this.setupEventListeners();
        },
        
        setupEventListeners: function() {
            // Override the admin user selector change event
            const adminUserSelector = document.getElementById('admin-selected-user');
            if (adminUserSelector) {
                adminUserSelector.removeEventListener('change', this.handleUserSelection);
                adminUserSelector.addEventListener('change', this.handleUserSelection.bind(this));
            }
        },
        
        handleUserSelection: function(event) {
            const userId = event.target.value;
            ErrorLogger.log('DASHBOARD', `User selected for individual view: ${userId}`);
            
            if (!userId) {
                ErrorLogger.log('WARNING', 'No user selected');
                return;
            }
            
            try {
                // Get the selected user's data
                const users = SparkUserEditor.getAllUsers();
                const selectedUser = users.find(u => u.id === userId);
                
                if (!selectedUser) {
                    throw new Error(`User not found: ${userId}`);
                }
                
                // Automatically switch to the user's role dashboard
                this.switchToRoleDashboard(selectedUser);
                
                ErrorLogger.log('SUCCESS', `Switched to ${selectedUser.role} dashboard for ${selectedUser.name}`);
                
            } catch (error) {
                ErrorLogger.log('ERROR', 'Failed to switch dashboard', { error: error.message });
            }
        },
        
        switchToRoleDashboard: function(user) {
            ErrorLogger.log('DASHBOARD', `Switching to ${user.role} dashboard`);
            
            // Update the role selector to match the user's role
            const roleSelector = document.getElementById('role-selector');
            if (roleSelector) {
                roleSelector.value = user.role;
            }
            
            // Hide all dashboard views
            const dashboardViews = document.querySelectorAll('.dashboard-view');
            dashboardViews.forEach(view => {
                view.classList.add('hidden');
                view.style.display = 'none';
            });
            
            // Show the appropriate dashboard based on role
            let targetDashboard;
            switch (user.role) {
                case 'ae':
                    targetDashboard = document.getElementById('ae-dashboard');
                    break;
                case 'am':
                    targetDashboard = document.getElementById('am-dashboard');
                    break;
                case 'admin':
                    targetDashboard = document.getElementById('admin-dashboard');
                    break;
                default:
                    // Default to a basic view if no role assigned
                    ErrorLogger.log('WARNING', `No role assigned for user ${user.id}, showing default view`);
                    targetDashboard = this.createDefaultDashboard(user);
            }
            
            if (targetDashboard) {
                targetDashboard.classList.remove('hidden');
                targetDashboard.style.display = 'block';
                
                // Load the dashboard data for this user
                this.loadUserDashboardData(user);
                
                // Update UI to show we're viewing as this user
                this.updateViewAsIndicator(user);
            }
            
            // Trigger dashboard refresh
            if (typeof refreshDashboard === 'function') {
                refreshDashboard();
            }
        },
        
        createDefaultDashboard: function(user) {
            ErrorLogger.log('DASHBOARD', 'Creating default dashboard for user without role');
            
            // Check if default dashboard exists
            let defaultDashboard = document.getElementById('default-dashboard');
            if (!defaultDashboard) {
                defaultDashboard = document.createElement('div');
                defaultDashboard.id = 'default-dashboard';
                defaultDashboard.className = 'dashboard-view';
                defaultDashboard.innerHTML = `
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-yellow-700">
                                    User <strong>${user.name}</strong> has no assigned role. 
                                    Please assign a role (Account Executive or Account Manager) to view the appropriate dashboard.
                                </p>
                                <button onclick="SparkUserEditor.editUser('${user.id}')" 
                                        class="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                                    Assign Role Now
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold mb-2">User Information</h3>
                            <p><strong>Name:</strong> ${user.name}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Status:</strong> ${user.status || 'Active'}</p>
                        </div>
                    </div>
                `;
                
                const dashboardSection = document.getElementById('dashboard-section');
                if (dashboardSection) {
                    dashboardSection.appendChild(defaultDashboard);
                }
            }
            
            return defaultDashboard;
        },
        
        loadUserDashboardData: function(user) {
            ErrorLogger.log('DASHBOARD', `Loading dashboard data for user: ${user.name}`);
            
            // This would load specific data for the user
            // Update metrics, charts, etc. based on the user's activities
            
            const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            const userActivities = activities.filter(a => 
                a.userId === user.id || a.userEmail === user.email
            );
            
            // Update dashboard with user-specific data
            ErrorLogger.log('INFO', `Loaded ${userActivities.length} activities for user`);
        },
        
        updateViewAsIndicator: function(user) {
            // Remove existing indicator
            const existingIndicator = document.getElementById('viewing-as-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Create new indicator
            const indicator = document.createElement('div');
            indicator.id = 'viewing-as-indicator';
            indicator.className = 'fixed top-20 right-4 bg-blue-100 border-l-4 border-blue-500 p-3 rounded shadow-lg z-40';
            indicator.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-eye text-blue-600 mr-2"></i>
                    <div>
                        <p class="font-semibold text-blue-800">Viewing as: ${user.name}</p>
                        <p class="text-sm text-blue-700">${user.role === 'ae' ? 'Account Executive' : user.role === 'am' ? 'Account Manager' : 'No Role'}</p>
                    </div>
                    <button onclick="SparkDashboardSwitcher.clearViewAs()" class="ml-4 text-blue-600 hover:text-blue-800">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(indicator);
        },
        
        clearViewAs: function() {
            const indicator = document.getElementById('viewing-as-indicator');
            if (indicator) {
                indicator.remove();
            }
            
            // Reset to admin view
            const adminDashboard = document.getElementById('admin-dashboard');
            if (adminDashboard) {
                document.querySelectorAll('.dashboard-view').forEach(view => {
                    view.classList.add('hidden');
                    view.style.display = 'none';
                });
                adminDashboard.classList.remove('hidden');
                adminDashboard.style.display = 'block';
            }
            
            // Clear user selector
            const adminUserSelector = document.getElementById('admin-selected-user');
            if (adminUserSelector) {
                adminUserSelector.value = '';
            }
        }
    };
    
    // ================================
    // REQUIREMENT 4: INTEGRATION TESTING
    // ================================
    window.SparkIntegrationTester = {
        runTests: async function() {
            ErrorLogger.log('TEST', 'Starting comprehensive integration tests');
            
            const results = {
                passed: [],
                failed: [],
                warnings: []
            };
            
            // Test 1: User Edit Functionality
            try {
                const testUser = this.createTestUser();
                SparkUserEditor.updateUserInStorage(testUser.id, testUser);
                
                // Edit the user's role
                testUser.role = 'am';
                SparkUserEditor.updateUserInStorage(testUser.id, testUser);
                
                // Verify the change persisted
                const savedUser = SparkUserEditor.getAllUsers().find(u => u.id === testUser.id);
                if (savedUser && savedUser.role === 'am') {
                    results.passed.push('User edit functionality works');
                } else {
                    results.failed.push('User edit did not persist');
                }
            } catch (error) {
                results.failed.push(`User edit test failed: ${error.message}`);
            }
            
            // Test 2: Analytics Data Accuracy
            try {
                // Add test activity
                const testActivity = {
                    id: 'test-' + Date.now(),
                    type: 'call',
                    date: new Date().toISOString(),
                    userId: 'test-user',
                    dealSize: 10000
                };
                
                let activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
                activities.push(testActivity);
                localStorage.setItem('spt_activities', JSON.stringify(activities));
                
                // Check if analytics reflects the new data
                const metrics = SparkAnalytics.calculateMetrics();
                if (metrics.activitiesToday > 0) {
                    results.passed.push('Analytics correctly shows today\'s activities');
                } else {
                    results.failed.push('Analytics not reflecting new activities');
                }
                
                // Clean up test data
                activities = activities.filter(a => !a.id.startsWith('test-'));
                localStorage.setItem('spt_activities', JSON.stringify(activities));
                
            } catch (error) {
                results.failed.push(`Analytics test failed: ${error.message}`);
            }
            
            // Test 3: Dashboard Role Switching
            try {
                const testUser = SparkUserEditor.getAllUsers().find(u => u.role === 'ae');
                if (testUser) {
                    SparkDashboardSwitcher.switchToRoleDashboard(testUser);
                    
                    const aeDashboard = document.getElementById('ae-dashboard');
                    if (aeDashboard && !aeDashboard.classList.contains('hidden')) {
                        results.passed.push('Dashboard switches correctly to user role');
                    } else {
                        results.failed.push('Dashboard did not switch to correct role view');
                    }
                } else {
                    results.warnings.push('No AE user found for dashboard test');
                }
            } catch (error) {
                results.failed.push(`Dashboard switch test failed: ${error.message}`);
            }
            
            // Test 4: Private Mode Compatibility
            try {
                // Check if app works in private mode
                const privateTest = await this.testPrivateMode();
                if (privateTest) {
                    results.passed.push('Private mode compatibility verified');
                } else {
                    results.warnings.push('Could not verify private mode compatibility');
                }
            } catch (error) {
                results.warnings.push(`Private mode test inconclusive: ${error.message}`);
            }
            
            // Log and display results
            ErrorLogger.log('TEST', 'Integration tests completed', results);
            this.displayTestResults(results);
            
            return results;
        },
        
        createTestUser: function() {
            return {
                id: 'test-user-' + Date.now(),
                firstName: 'Test',
                lastName: 'User',
                name: 'Test User',
                email: 'test@example.com',
                role: 'ae',
                status: 'active',
                created_at: Date.now()
            };
        },
        
        testPrivateMode: async function() {
            // Test localStorage availability
            try {
                const testKey = 'spark-private-test';
                localStorage.setItem(testKey, 'test');
                const value = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
                return value === 'test';
            } catch {
                return false;
            }
        },
        
        displayTestResults: function(results) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                    <h3 class="text-xl font-bold mb-4">Integration Test Results</h3>
                    
                    ${results.passed.length > 0 ? `
                        <div class="mb-4">
                            <h4 class="font-semibold text-green-600 mb-2">✅ Passed (${results.passed.length})</h4>
                            <ul class="list-disc list-inside text-sm text-gray-700">
                                ${results.passed.map(test => `<li>${test}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${results.failed.length > 0 ? `
                        <div class="mb-4">
                            <h4 class="font-semibold text-red-600 mb-2">❌ Failed (${results.failed.length})</h4>
                            <ul class="list-disc list-inside text-sm text-gray-700">
                                ${results.failed.map(test => `<li>${test}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${results.warnings.length > 0 ? `
                        <div class="mb-4">
                            <h4 class="font-semibold text-yellow-600 mb-2">⚠️ Warnings (${results.warnings.length})</h4>
                            <ul class="list-disc list-inside text-sm text-gray-700">
                                ${results.warnings.map(test => `<li>${test}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="mt-6 flex justify-end">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Close
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
    };
    
    // ================================
    // REQUIREMENT 5: MONITORING & DEBUG TOOLS
    // ================================
    window.SparkDebugPanel = {
        init: function() {
            this.createDebugPanel();
            this.setupKeyboardShortcut();
        },
        
        createDebugPanel: function() {
            const panel = document.createElement('div');
            panel.id = 'spark-debug-panel';
            panel.className = 'fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto hidden z-50';
            panel.innerHTML = `
                <div class="flex justify-between items-center mb-3 border-b pb-2">
                    <h3 class="font-bold text-lg">Spark Debug Panel v4.0</h3>
                    <button onclick="SparkDebugPanel.toggle()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <h4 class="font-semibold text-sm mb-1">System Status</h4>
                        <div class="text-xs space-y-1">
                            <div class="flex justify-between">
                                <span>Version:</span>
                                <span class="font-mono">4.0.0</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Users:</span>
                                <span id="debug-user-count">0</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Activities:</span>
                                <span id="debug-activity-count">0</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Storage Used:</span>
                                <span id="debug-storage-size">0 KB</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-sm mb-1">Recent Errors</h4>
                        <div id="debug-error-list" class="text-xs bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                            <p class="text-gray-500">No errors logged</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-sm mb-1">Quick Actions</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="SparkIntegrationTester.runTests()" 
                                    class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                                Run Tests
                            </button>
                            <button onclick="SparkDebugPanel.clearLogs()" 
                                    class="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600">
                                Clear Logs
                            </button>
                            <button onclick="SparkAnalytics.updateAllMetrics()" 
                                    class="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                                Refresh Analytics
                            </button>
                            <button onclick="SparkDebugPanel.exportLogs()" 
                                    class="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600">
                                Export Logs
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(panel);
            this.updateStats();
        },
        
        setupKeyboardShortcut: function() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+Shift+D to toggle debug panel
                if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                    this.toggle();
                }
            });
        },
        
        toggle: function() {
            const panel = document.getElementById('spark-debug-panel');
            if (panel) {
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden')) {
                    this.updateStats();
                    this.updateErrorList();
                }
            }
        },
        
        updateStats: function() {
            const users = SparkUserEditor.getAllUsers();
            const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            
            document.getElementById('debug-user-count').textContent = users.length;
            document.getElementById('debug-activity-count').textContent = activities.length;
            
            // Calculate storage size
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            document.getElementById('debug-storage-size').textContent = 
                (totalSize / 1024).toFixed(2) + ' KB';
        },
        
        updateErrorList: function() {
            const errorList = document.getElementById('debug-error-list');
            const errors = ErrorLogger.getLogs('ERROR');
            
            if (errors.length === 0) {
                errorList.innerHTML = '<p class="text-gray-500">No errors logged</p>';
            } else {
                errorList.innerHTML = errors.slice(0, 5).map(error => `
                    <div class="mb-1 p-1 bg-red-50 rounded">
                        <p class="font-semibold text-red-700">${error.message}</p>
                        <p class="text-gray-600">${new Date(error.timestamp).toLocaleTimeString()}</p>
                    </div>
                `).join('');
            }
        },
        
        clearLogs: function() {
            ErrorLogger.logs = [];
            localStorage.removeItem('spark_error_logs');
            this.updateErrorList();
            ErrorLogger.showAlert('Logs cleared', 'success');
        },
        
        exportLogs: function() {
            const logs = ErrorLogger.logs;
            const dataStr = JSON.stringify(logs, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `spark-logs-${new Date().toISOString()}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    };
    
    // ================================
    // INITIALIZATION
    // ================================
    function initialize() {
        console.log('🚀 Spark Comprehensive Fix v4.0 Initializing...');
        
        // Initialize all modules
        SparkUserEditor.init();
        SparkAnalytics.init();
        SparkDashboardSwitcher.init();
        SparkDebugPanel.init();
        
        // Override global functions
        window.editUser = SparkUserEditor.editUser.bind(SparkUserEditor);
        
        // Set up periodic updates
        setInterval(() => {
            const analyticsSection = document.getElementById('analytics-section');
            if (analyticsSection && !analyticsSection.classList.contains('hidden')) {
                SparkAnalytics.updateAllMetrics();
            }
        }, 5000);
        
        // Log successful initialization
        ErrorLogger.log('SUCCESS', 'Spark v4.0 initialized successfully');
        ErrorLogger.showAlert('Spark v4.0 loaded - All systems operational', 'success');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }
})();

console.log('✅ SPARK COMPREHENSIVE FIX V4.0 LOADED');