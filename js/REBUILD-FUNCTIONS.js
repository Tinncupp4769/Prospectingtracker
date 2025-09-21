// COMPLETE REBUILD OF ADD USER AND RESET DATA FUNCTIONS
// This file ensures these functions work 100% without breaking anything

console.log('🔧 REBUILDING FUNCTIONS...');

// ================================
// REBUILD 1: showUserView Function
// ================================
(function rebuildShowUserView() {
    console.log('Rebuilding showUserView...');
    
    // Store any existing function
    const existingShowUserView = window.showUserView;
    
    // Create bulletproof version
    window.showUserView = function(view) {
        console.log(`showUserView called with: ${view}`);
        
        try {
            // Safety check - ensure we're authenticated
            if (window.UnifiedApp && !window.UnifiedApp.state.authenticated) {
                console.warn('Cannot show user view - not authenticated');
                return;
            }
            
            // Update button states
            const buttons = document.querySelectorAll('.user-view-btn');
            buttons.forEach(btn => {
                // Get the view from either data-view or onclick
                let btnView = btn.getAttribute('data-view');
                if (!btnView) {
                    const onclick = btn.getAttribute('onclick');
                    if (onclick) {
                        const match = onclick.match(/showUserView\(['"](\w+)['"]\)/);
                        if (match) btnView = match[1];
                    }
                }
                
                // Update classes
                if (btnView === view) {
                    btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
                    btn.classList.add('bg-indigo-600', 'text-white');
                } else {
                    btn.classList.remove('bg-indigo-600', 'text-white');
                    btn.classList.add('text-gray-600', 'hover:bg-gray-100');
                }
            });
            
            // Hide ALL user management views
            const allViews = document.querySelectorAll('.user-management-view');
            console.log(`Hiding ${allViews.length} user management views`);
            allViews.forEach(v => {
                v.classList.add('hidden');
                v.style.display = 'none'; // Force hide
            });
            
            // Show the requested view
            let targetView = null;
            let setupFunction = null;
            
            switch(view) {
                case 'list':
                    targetView = document.getElementById('users-list-view');
                    setupFunction = window.loadUsersList;
                    break;
                    
                case 'add':
                    targetView = document.getElementById('users-add-view');
                    setupFunction = window.setupAddUserForm;
                    break;
                    
                case 'act-as':
                    targetView = document.getElementById('users-act-as-view');
                    setupFunction = window.loadActAsUsersList;
                    break;
                    
                default:
                    console.error(`Unknown view: ${view}`);
                    return;
            }
            
            if (targetView) {
                console.log(`Showing view: ${view}`);
                targetView.classList.remove('hidden');
                targetView.style.display = 'block';
                targetView.style.visibility = 'visible';
                targetView.style.opacity = '1';
                
                // Call setup function if available
                if (typeof setupFunction === 'function') {
                    console.log(`Calling setup function for ${view}`);
                    try {
                        setupFunction();
                    } catch (e) {
                        console.error(`Error in setup function:`, e);
                    }
                } else {
                    console.warn(`No setup function for ${view}`);
                }
                
                // Store current view
                window.currentUserView = view;
                
                console.log(`✅ Successfully showed ${view} view`);
            } else {
                console.error(`View element not found: users-${view}-view`);
            }
            
        } catch (error) {
            console.error('Error in showUserView:', error);
            
            // Try to call original if our version fails
            if (existingShowUserView && existingShowUserView !== window.showUserView) {
                console.log('Falling back to original showUserView');
                existingShowUserView(view);
            }
        }
    };
    
    console.log('✅ showUserView rebuilt');
})();

// ================================
// REBUILD 2: setupAddUserForm Function
// ================================
(function rebuildSetupAddUserForm() {
    console.log('Rebuilding setupAddUserForm...');
    
    window.setupAddUserForm = function() {
        console.log('Setting up add user form...');
        
        const form = document.getElementById('add-user-form');
        if (!form) {
            console.error('Add user form not found!');
            return;
        }
        
        // Remove any existing handlers
        form.onsubmit = null;
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // Add new handler
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Add user form submitted');
            
            try {
                // Get form values
                const firstName = document.getElementById('new-user-firstname').value;
                const lastName = document.getElementById('new-user-lastname').value;
                const email = document.getElementById('new-user-email').value;
                const phone = document.getElementById('new-user-phone').value;
                const role = document.getElementById('new-user-role').value;
                const platformRole = document.getElementById('new-user-platform-role').value;
                
                // Create username
                const username = (firstName[0] + lastName).toLowerCase().replace(/\s/g, '');
                
                // Generate password
                const password = 'Temp' + Math.random().toString(36).substr(2, 8) + '!';
                
                // Create user data
                const userData = {
                    id: 'user-' + Date.now(),
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`,
                    email,
                    phone,
                    username,
                    password,
                    role,
                    platformRole,
                    status: 'active',
                    team: role === 'ae' ? 'Sales Team' : 'Account Management',
                    createdAt: Date.now()
                };
                
                console.log('Creating user:', userData);
                
                // Save user
                if (window.API && typeof window.API.createUser === 'function') {
                    await window.API.createUser(userData);
                } else {
                    // Fallback - save directly to localStorage
                    const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
                    users.push(userData);
                    localStorage.setItem('unified_users', JSON.stringify(users));
                }
                
                // Show success message
                if (typeof window.showAlert === 'function') {
                    window.showAlert(`User created successfully! Username: ${username}`, 'success');
                } else {
                    alert(`User created successfully!\n\nUsername: ${username}\nPassword: ${password}\n\nPlease save these credentials.`);
                }
                
                // Reset form
                newForm.reset();
                
                // Switch back to list view
                window.showUserView('list');
                
            } catch (error) {
                console.error('Error creating user:', error);
                alert('Failed to create user: ' + error.message);
            }
        });
        
        console.log('✅ Add user form setup complete');
    };
    
    console.log('✅ setupAddUserForm rebuilt');
})();

// ================================
// REBUILD 3: confirmResetAllData Function
// ================================
(function rebuildResetFunctions() {
    console.log('Rebuilding reset functions...');
    
    // Build confirmResetAllData (what the button actually calls)
    window.confirmResetAllData = function() {
        console.log('confirmResetAllData called');
        
        // First confirmation
        const confirm1 = confirm(
            '⚠️ WARNING - Reset All Data?\n\n' +
            'This will DELETE:\n' +
            '• All activities\n' +
            '• All goals\n' +
            '• All user data\n\n' +
            'Are you sure you want to continue?'
        );
        
        if (!confirm1) {
            console.log('Reset cancelled (first confirmation)');
            return;
        }
        
        // Second confirmation
        const confirm2 = confirm(
            '⚠️ FINAL WARNING!\n\n' +
            'This action CANNOT be undone.\n' +
            'All data will be permanently deleted.\n\n' +
            'Are you ABSOLUTELY sure?'
        );
        
        if (!confirm2) {
            console.log('Reset cancelled (second confirmation)');
            return;
        }
        
        // Actually reset
        performReset();
    };
    
    // Also provide resetAllData for compatibility
    window.resetAllData = window.confirmResetAllData;
    
    // The actual reset function
    function performReset() {
        console.log('Performing data reset...');
        
        // Show progress overlay
        const overlay = document.createElement('div');
        overlay.id = 'reset-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
        `;
        overlay.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 10px; text-align: center;">
                <h2 style="font-size: 24px; margin-bottom: 20px; font-weight: bold;">
                    <i class="fas fa-spinner fa-spin" style="color: #4F46E5;"></i><br><br>
                    Resetting Application...
                </h2>
                <p style="color: #666;">Please wait while we reset all data...</p>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Perform reset after short delay
        setTimeout(() => {
            try {
                // Clear all localStorage
                const keysToDelete = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    // Keep session to avoid logout
                    if (key !== 'spt_session') {
                        keysToDelete.push(key);
                    }
                }
                
                keysToDelete.forEach(key => {
                    localStorage.removeItem(key);
                    console.log(`Deleted: ${key}`);
                });
                
                // Clear sessionStorage too
                sessionStorage.clear();
                
                // Update overlay
                overlay.querySelector('h2').innerHTML = `
                    <i class="fas fa-check-circle" style="color: #10B981; font-size: 48px;"></i><br><br>
                    Reset Complete!
                `;
                overlay.querySelector('p').textContent = 'Reloading application...';
                
                // Reload after showing success
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
            } catch (error) {
                console.error('Reset error:', error);
                overlay.querySelector('h2').innerHTML = `
                    <i class="fas fa-exclamation-circle" style="color: #EF4444; font-size: 48px;"></i><br><br>
                    Reset Failed
                `;
                overlay.querySelector('p').textContent = error.message;
                
                setTimeout(() => {
                    overlay.remove();
                }, 3000);
            }
        }, 500);
    }
    
    console.log('✅ Reset functions rebuilt');
})();

// ================================
// REBUILD 4: loadUsersList Function
// ================================
(function rebuildLoadUsersList() {
    console.log('Rebuilding loadUsersList...');
    
    window.loadUsersList = async function() {
        console.log('Loading users list...');
        
        const tbody = document.getElementById('users-table');
        if (!tbody) {
            console.error('Users table not found');
            return;
        }
        
        try {
            // Get users
            let users = [];
            
            if (window.API && typeof window.API.getUsers === 'function') {
                const result = await window.API.getUsers();
                users = result.data || [];
            } else {
                // Fallback - get directly from localStorage
                users = JSON.parse(localStorage.getItem('unified_users') || '[]');
            }
            
            console.log(`Loading ${users.length} users`);
            
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No users found</td></tr>';
                return;
            }
            
            // Build table HTML
            let html = '';
            users.forEach(user => {
                const roleLabel = user.role === 'ae' ? 'Account Executive' : 
                                 user.role === 'am' ? 'Account Manager' : 'Administrator';
                
                html += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="py-3 px-4">
                            <div class="font-medium">${user.name || 'Unknown'}</div>
                        </td>
                        <td class="py-3 px-4 text-sm">${user.email || ''}</td>
                        <td class="py-3 px-4 text-sm font-mono">${user.username || ''}</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                ${roleLabel}
                            </span>
                        </td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                ${user.platformRole || 'user'}
                            </span>
                        </td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                ${user.status || 'active'}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-500">
                            ${user.team || 'No Team'}
                        </td>
                        <td class="py-3 px-4">
                            <div class="flex space-x-2">
                                <button class="text-indigo-600 hover:text-indigo-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-red-600 hover:text-red-800">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
            console.log('✅ Users list loaded');
            
        } catch (error) {
            console.error('Error loading users:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-600">Error loading users</td></tr>';
        }
    };
    
    console.log('✅ loadUsersList rebuilt');
})();

console.log('🎯 ALL FUNCTIONS REBUILT SUCCESSFULLY');
console.log('Available functions:');
console.log('- showUserView(view)');
console.log('- setupAddUserForm()');
console.log('- confirmResetAllData()');
console.log('- resetAllData()');
console.log('- loadUsersList()');