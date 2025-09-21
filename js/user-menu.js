// User Menu and Profile Management

// Toggle user dropdown menu
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        
        // Close on click outside
        if (!dropdown.classList.contains('hidden')) {
            document.addEventListener('click', closeUserMenuOnClickOutside);
        }
    }
}

// Close user menu when clicking outside
function closeUserMenuOnClickOutside(event) {
    const dropdown = document.getElementById('user-dropdown');
    const button = event.target.closest('button[onclick="toggleUserMenu()"]');
    
    if (!button && dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closeUserMenuOnClickOutside);
    }
}

// Handle logout
async function handleLogout() {
    // Close dropdown
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    
    // Confirm logout
    if (confirm('Are you sure you want to logout?')) {
        await Auth.logout();
    }
}

// Show user profile
function showProfile() {
    // Close dropdown
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    
    // Create and show profile modal
    showProfileModal();
}

// Show profile modal
function showProfileModal() {
    const session = Auth.getSession();
    if (!session || !session.user) return;
    
    const user = session.user;
    
    const modalHTML = `
        <div id="profile-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">My Profile</h2>
                    <button onclick="closeProfileModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="flex items-center space-x-4 pb-4 border-b">
                        <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            ${user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">${user.name}</h3>
                            <p class="text-sm text-gray-500">${user.email}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-gray-700">Role</label>
                        <p class="mt-1 text-gray-900">${user.role === 'ae' ? 'Account Executive' : user.role === 'am' ? 'Account Manager' : 'Administrator'}</p>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-gray-700">Platform Role</label>
                        <p class="mt-1 text-gray-900">${user.platformRole === 'admin' ? 'Administrator' : 'User'}</p>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-gray-700">Team</label>
                        <p class="mt-1 text-gray-900">${user.team || 'Not assigned'}</p>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-gray-700">Login Time</label>
                        <p class="mt-1 text-gray-900">${new Date(session.loginTime).toLocaleString()}</p>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-gray-700">Session Expires</label>
                        <p class="mt-1 text-gray-900">${new Date(session.expiresAt).toLocaleString()}</p>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end space-x-3">
                    <button onclick="showChangePassword()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <i class="fas fa-key mr-2"></i>Change Password
                    </button>
                    <button onclick="closeProfileModal()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        Close
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

// Close profile modal
function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.remove();
    }
}

// Show change password modal
function showChangePassword() {
    // Close profile modal if open
    closeProfileModal();
    
    // Close dropdown
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    
    const modalHTML = `
        <div id="password-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">Change Password</h2>
                    <button onclick="closePasswordModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form onsubmit="return handlePasswordChange(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <div class="relative">
                                <input 
                                    type="password" 
                                    id="current-password" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                <button type="button" onclick="togglePasswordVisibility('current-password')" class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <i class="fas fa-eye text-gray-400"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <div class="relative">
                                <input 
                                    type="password" 
                                    id="new-password" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required
                                    minlength="8"
                                >
                                <button type="button" onclick="togglePasswordVisibility('new-password')" class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <i class="fas fa-eye text-gray-400"></i>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <div class="relative">
                                <input 
                                    type="password" 
                                    id="confirm-password" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                <button type="button" onclick="togglePasswordVisibility('confirm-password')" class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <i class="fas fa-eye text-gray-400"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div id="password-error" class="hidden text-red-600 text-sm"></div>
                        <div id="password-success" class="hidden text-green-600 text-sm"></div>
                    </div>
                    
                    <div class="mt-6 flex justify-end space-x-3">
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            <i class="fas fa-save mr-2"></i>Change Password
                        </button>
                        <button type="button" onclick="closePasswordModal()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
}

// Close password modal
function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    if (modal) {
        modal.remove();
    }
}

// Handle password change
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorEl = document.getElementById('password-error');
    const successEl = document.getElementById('password-success');
    
    // Hide messages
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'New passwords do not match';
        errorEl.classList.remove('hidden');
        return false;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters';
        errorEl.classList.remove('hidden');
        return false;
    }
    
    try {
        const result = await Auth.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            successEl.textContent = 'Password changed successfully!';
            successEl.classList.remove('hidden');
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closePasswordModal();
            }, 2000);
        } else {
            errorEl.textContent = result.error || 'Failed to change password';
            errorEl.classList.remove('hidden');
        }
    } catch (error) {
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.remove('hidden');
    }
    
    return false;
}

// Update user info in header
function updateUserInfoDisplay() {
    const session = Auth.getSession();
    if (!session || !session.user) return;
    
    const user = session.user;
    
    // Update main header
    const userNameEl = document.getElementById('current-user');
    const userRoleEl = document.getElementById('current-role');
    const userAvatarEl = document.getElementById('user-avatar');
    
    if (userNameEl) userNameEl.textContent = user.name;
    if (userRoleEl) {
        let roleText = user.role === 'ae' ? 'Account Executive' : 
                      user.role === 'am' ? 'Account Manager' : 'Administrator';
        if (user.platformRole === 'admin') {
            roleText += ' (Admin)';
        }
        userRoleEl.textContent = roleText;
    }
    if (userAvatarEl) {
        userAvatarEl.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    // Update dropdown
    const dropdownNameEl = document.getElementById('dropdown-user-name');
    const dropdownEmailEl = document.getElementById('dropdown-user-email');
    
    if (dropdownNameEl) dropdownNameEl.textContent = user.name;
    if (dropdownEmailEl) dropdownEmailEl.textContent = user.email;
    
    // Also call main updateUserInfo if it exists
    if (typeof updateUserInfo === 'function') {
        updateUserInfo();
    }
}