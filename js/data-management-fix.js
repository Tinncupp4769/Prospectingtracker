// Data Management Fix - Handles Reset All Data and other data operations
// Works with the Unified App Controller

(function() {
    console.log('Data Management Fix: Initializing...');
    
    // Create global resetAllData function
    window.resetAllData = async function() {
        console.log('Reset All Data requested');
        
        // Show confirmation dialog
        const confirmMessage = `⚠️ WARNING: This will delete ALL data including:
• All users (except defaults)
• All activities
• All goals
• All settings
• Your current session

The app will reset to factory defaults.

Are you sure you want to continue?`;
        
        if (!confirm(confirmMessage)) {
            console.log('Reset cancelled by user');
            return;
        }
        
        // Show second confirmation for safety
        if (!confirm('This action cannot be undone. Are you REALLY sure?')) {
            console.log('Reset cancelled by user (second confirmation)');
            return;
        }
        
        try {
            console.log('Starting data reset...');
            
            // Show loading indicator
            showResetProgress('Resetting data...');
            
            // Clear all localStorage data
            const keysToPreserve = []; // Add any keys you want to preserve here
            const allKeys = Object.keys(localStorage);
            
            allKeys.forEach(key => {
                if (!keysToPreserve.includes(key)) {
                    localStorage.removeItem(key);
                    console.log('Removed:', key);
                }
            });
            
            // Clear session storage too
            sessionStorage.clear();
            
            // Update progress
            showResetProgress('Restoring defaults...');
            
            // Reinitialize storage with defaults
            if (window.UnifiedApp) {
                UnifiedApp.initStorage();
            }
            
            // Show success message
            showResetProgress('Reset complete! Reloading...');
            
            // Wait a moment for user to see the message
            setTimeout(() => {
                // Reload the page to start fresh
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error during reset:', error);
            alert('Failed to reset data: ' + error.message);
            hideResetProgress();
        }
    };
    
    // Show reset progress
    function showResetProgress(message) {
        // Remove any existing progress indicator
        let progressDiv = document.getElementById('reset-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        // Create new progress indicator
        progressDiv = document.createElement('div');
        progressDiv.id = 'reset-progress';
        progressDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        progressDiv.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
                <div class="mb-4">
                    <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">Resetting Application</h3>
                <p class="text-gray-600">${message}</p>
            </div>
        `;
        
        document.body.appendChild(progressDiv);
    }
    
    // Hide reset progress
    function hideResetProgress() {
        const progressDiv = document.getElementById('reset-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }
    
    // Export data function
    window.exportData = function() {
        console.log('Exporting data...');
        
        try {
            const data = {
                users: JSON.parse(localStorage.getItem('unified_users') || '[]'),
                activities: JSON.parse(localStorage.getItem('unified_activities') || '[]'),
                goals: JSON.parse(localStorage.getItem('unified_goals') || '[]'),
                exportDate: new Date().toISOString(),
                version: '3.0'
            };
            
            // Create download link
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `sales-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            showAlert('Data exported successfully!', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            showAlert('Failed to export data: ' + error.message, 'error');
        }
    };
    
    // Import data function
    window.importData = function() {
        console.log('Import data requested');
        
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Validate data structure
                if (!data.users || !data.activities || !data.goals) {
                    throw new Error('Invalid backup file format');
                }
                
                // Confirm import
                if (!confirm(`Import backup from ${data.exportDate}? This will replace all current data.`)) {
                    return;
                }
                
                // Import data
                localStorage.setItem('unified_users', JSON.stringify(data.users));
                localStorage.setItem('unified_activities', JSON.stringify(data.activities));
                localStorage.setItem('unified_goals', JSON.stringify(data.goals));
                
                showAlert('Data imported successfully! Reloading...', 'success');
                
                // Reload after a moment
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                console.error('Import error:', error);
                showAlert('Failed to import data: ' + error.message, 'error');
            }
        };
        
        input.click();
    };
    
    // Create showAlert if it doesn't exist
    if (typeof window.showAlert !== 'function') {
        window.showAlert = function(message, type = 'info') {
            console.log(`Alert (${type}):`, message);
            
            // Remove any existing alerts
            const existingAlerts = document.querySelectorAll('.alert-message');
            existingAlerts.forEach(alert => alert.remove());
            
            // Create new alert
            const alert = document.createElement('div');
            alert.className = 'alert-message fixed top-20 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all';
            
            // Set color based on type
            const colors = {
                success: 'bg-green-500 text-white',
                error: 'bg-red-500 text-white',
                warning: 'bg-yellow-500 text-white',
                info: 'bg-blue-500 text-white'
            };
            
            alert.className += ' ' + (colors[type] || colors.info);
            
            const icons = {
                success: 'check-circle',
                error: 'exclamation-circle',
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };
            
            alert.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-${icons[type] || icons.info} mr-3"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(alert);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        };
    }
    
    // Add reset button to appropriate places if they don't exist
    function addResetButton() {
        // Check if we're in a settings or admin area
        const settingsArea = document.querySelector('.settings-actions') || 
                           document.querySelector('.admin-actions') ||
                           document.querySelector('#users-section');
        
        if (settingsArea && !document.getElementById('reset-all-data-btn')) {
            const resetBtn = document.createElement('button');
            resetBtn.id = 'reset-all-data-btn';
            resetBtn.className = 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium';
            resetBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Reset All Data';
            resetBtn.onclick = resetAllData;
            
            // Try to find a good place to insert it
            const actionBar = settingsArea.querySelector('.flex.gap-2') || settingsArea;
            if (actionBar) {
                actionBar.appendChild(resetBtn);
            }
        }
    }
    
    // Try to add reset button after a delay
    setTimeout(addResetButton, 1000);
    
    console.log('Data Management Fix: Ready');
    console.log('Available functions: resetAllData(), exportData(), importData()');
})();