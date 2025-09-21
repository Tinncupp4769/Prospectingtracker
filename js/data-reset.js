// Data Reset Functionality for Administrators

// Load data statistics
async function loadDataStatistics() {
    try {
        // Get counts
        const activities = await API.getActivities();
        const users = await API.getUsers();
        const goals = await API.getGoals();
        
        // Update display
        const activitiesCount = document.getElementById('total-activities-count');
        const usersCount = document.getElementById('total-users-count');
        const goalsCount = document.getElementById('total-goals-count');
        const lastResetEl = document.getElementById('last-reset-date');
        
        if (activitiesCount) activitiesCount.textContent = activities.data ? activities.data.length : 0;
        if (usersCount) usersCount.textContent = users.data ? users.data.length : 0;
        if (goalsCount) goalsCount.textContent = goals.data ? goals.data.filter(g => g.status === 'active').length : 0;
        
        // Get last reset date from localStorage
        const lastReset = localStorage.getItem('lastDataReset');
        if (lastResetEl) {
            lastResetEl.textContent = lastReset ? new Date(parseInt(lastReset)).toLocaleString() : 'Never';
        }
        
        // Populate user selector for reset
        const userSelector = document.getElementById('reset-user-selector');
        if (userSelector && users.data) {
            userSelector.innerHTML = '<option value="">Select a user...</option>';
            users.data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.name} (${user.email})`;
                userSelector.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading data statistics:', error);
    }
}

// Confirm reset all data
function confirmResetAllData() {
    // Check if user is admin
    if (!currentUser || currentUser.platformRole !== 'admin') {
        showAlert('Only administrators can reset data', 'error');
        return;
    }
    
    // Show confirmation modal
    const modalHTML = `
        <div id="reset-confirm-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div class="flex items-start mb-4">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-xl font-bold text-gray-900">Confirm Data Reset</h3>
                        <p class="mt-2 text-gray-600">
                            Are you absolutely sure you want to reset ALL activity data for ALL users?
                        </p>
                        <p class="mt-2 text-red-600 font-semibold">
                            This action cannot be undone!
                        </p>
                    </div>
                </div>
                
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p class="text-sm text-red-800">
                        <strong>This will delete:</strong>
                    </p>
                    <ul class="list-disc list-inside text-sm text-red-700 mt-1">
                        <li>All activity records</li>
                        <li>All weekly summaries</li>
                        <li>All performance data</li>
                    </ul>
                    <p class="text-sm text-green-700 mt-2">
                        <strong>Note:</strong> Goals will NOT be deleted. Manage goals in the Goal Setting section.
                    </p>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Type "RESET ALL DATA" to confirm:
                    </label>
                    <input 
                        type="text" 
                        id="reset-confirmation-input" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Type confirmation text here"
                    >
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button onclick="closeResetModal()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onclick="executeResetAllData()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <i class="fas fa-trash-alt mr-2"></i>Reset All Data
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
}

// Confirm reset user data
function confirmResetUserData() {
    const userSelector = document.getElementById('reset-user-selector');
    if (!userSelector || !userSelector.value) {
        showAlert('Please select a user first', 'warning');
        return;
    }
    
    // Check if user is admin
    if (!currentUser || currentUser.platformRole !== 'admin') {
        showAlert('Only administrators can reset data', 'error');
        return;
    }
    
    const userName = userSelector.options[userSelector.selectedIndex].text;
    const userId = userSelector.value;
    
    // Show confirmation modal
    const modalHTML = `
        <div id="reset-user-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div class="flex items-start mb-4">
                    <div class="flex-shrink-0">
                        <i class="fas fa-user-times text-orange-600 text-3xl"></i>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-xl font-bold text-gray-900">Reset User Data</h3>
                        <p class="mt-2 text-gray-600">
                            Reset all activity data for:
                        </p>
                        <p class="font-semibold text-gray-900 mt-1">${userName}</p>
                    </div>
                </div>
                
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <p class="text-sm text-orange-800">
                        This will delete all activity records for this user. The user account will remain active.
                    </p>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button onclick="closeResetUserModal()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onclick="executeResetUserData('${userId}')" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                        <i class="fas fa-user-times mr-2"></i>Reset User Data
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
}

// Execute reset all data
async function executeResetAllData() {
    // Verify confirmation text
    const confirmInput = document.getElementById('reset-confirmation-input');
    if (!confirmInput || confirmInput.value !== 'RESET ALL DATA') {
        showAlert('Please type the confirmation text exactly as shown', 'error');
        return;
    }
    
    // Show loading state
    showAlert('Resetting all data... Please wait...', 'info');
    
    try {
        // Get all activities
        const activities = await API.getActivities();
        
        // Delete all activities ONLY (not goals)
        let deletedCount = 0;
        if (activities.data) {
            for (const activity of activities.data) {
                try {
                    // Skip system logs and auth logs
                    if (activity.type === 'system_log' || activity.type === 'auth_log') {
                        continue;
                    }
                    await API.deleteActivity(activity.id);
                    deletedCount++;
                } catch (err) {
                    console.error('Error deleting activity:', err);
                }
            }
        }
        
        // NOTE: Goals are NOT deleted - they are managed separately in Goal Setting
        
        // Clear any cached data in localStorage (except auth and essential settings)
        const keysToKeep = ['spt_session', 'metricWeights', 'lastDataReset'];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key) && key.startsWith('spt_')) {
                localStorage.removeItem(key);
            }
        });
        
        // Store reset timestamp
        localStorage.setItem('lastDataReset', Date.now().toString());
        
        // Log the reset action
        await API.createActivity({
            type: 'system_log',
            action: 'data_reset_all',
            userId: currentUser.id,
            userName: currentUser.name,
            timestamp: Date.now(),
            details: `Deleted ${deletedCount} activities (goals were not affected)`
        });
        
        // Close modal
        closeResetModal();
        
        // Show success message
        showAlert(`Successfully reset all activity data. Deleted ${deletedCount} activity records. Goals remain unchanged.`, 'success');
        
        // Refresh the current view
        refreshCurrentView();
        
        // Reload statistics
        loadDataStatistics();
        
        // Update all charts to show empty state
        if (typeof updateAECharts === 'function') {
            updateAECharts();
        }
        if (typeof updateAMCharts === 'function') {
            updateAMCharts();
        }
        if (typeof refreshCharts === 'function') {
            refreshCharts();
        }
        
    } catch (error) {
        console.error('Error resetting data:', error);
        showAlert('Failed to reset data. Please try again.', 'error');
    }
}

// Execute reset user data
async function executeResetUserData(userId) {
    if (!userId) {
        showAlert('Invalid user ID', 'error');
        return;
    }
    
    // Show loading state
    showAlert('Resetting user data... Please wait...', 'info');
    
    try {
        // Get all activities for this user
        const activities = await API.getActivities();
        
        // Filter and delete user's activities ONLY (not goals)
        let deletedCount = 0;
        if (activities.data) {
            const userActivities = activities.data.filter(a => a.userId === userId);
            for (const activity of userActivities) {
                try {
                    // Skip system logs and auth logs
                    if (activity.type === 'system_log' || activity.type === 'auth_log') {
                        continue;
                    }
                    await API.deleteActivity(activity.id);
                    deletedCount++;
                } catch (err) {
                    console.error('Error deleting activity:', err);
                }
            }
        }
        
        // NOTE: Goals are NOT deleted - they are managed separately in Goal Setting
        
        // Log the reset action
        await API.createActivity({
            type: 'system_log',
            action: 'data_reset_user',
            userId: currentUser.id,
            userName: currentUser.name,
            targetUserId: userId,
            timestamp: Date.now(),
            details: `Deleted ${deletedCount} activities for user ${userId} (goals were not affected)`
        });
        
        // Close modal
        closeResetUserModal();
        
        // Show success message
        showAlert(`Successfully reset user data. Deleted ${deletedCount} activity records. Goals remain unchanged.`, 'success');
        
        // Reset selector
        const userSelector = document.getElementById('reset-user-selector');
        if (userSelector) userSelector.value = '';
        
        // Refresh the current view
        refreshCurrentView();
        
        // Reload statistics
        loadDataStatistics();
        
    } catch (error) {
        console.error('Error resetting user data:', error);
        showAlert('Failed to reset user data. Please try again.', 'error');
    }
}

// Close reset modal
function closeResetModal() {
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.remove();
}

// Close reset user modal
function closeResetUserModal() {
    const modal = document.getElementById('reset-user-modal');
    if (modal) modal.remove();
}

// Initialize data management when user management section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Add observer for when user management section becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'users-section' && !mutation.target.classList.contains('hidden')) {
                // Load statistics when section becomes visible
                loadDataStatistics();
            }
        });
    });
    
    const usersSection = document.getElementById('users-section');
    if (usersSection) {
        observer.observe(usersSection, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }
});

// Export functions for global use
window.confirmResetAllData = confirmResetAllData;
window.confirmResetUserData = confirmResetUserData;
window.executeResetAllData = executeResetAllData;
window.executeResetUserData = executeResetUserData;
window.closeResetModal = closeResetModal;
window.closeResetUserModal = closeResetUserModal;
window.loadDataStatistics = loadDataStatistics;