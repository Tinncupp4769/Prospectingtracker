// User Management System

let currentUserView = 'list';
let originalUser = null; // Store original user when acting as another user

// Show user management view
function showUserView(view) {
    console.log('Showing user view:', view);
    currentUserView = view;
    
    // Update button states
    document.querySelectorAll('.user-view-btn').forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });
    
    // Toggle views
    document.querySelectorAll('.user-management-view').forEach(v => {
        v.classList.add('hidden');
    });
    
    if (view === 'list') {
        document.getElementById('users-list-view')?.classList.remove('hidden');
        loadUsersList();
        // Also load data statistics
        if (typeof loadDataStatistics === 'function') {
            loadDataStatistics();
        }
    } else if (view === 'add') {
        document.getElementById('users-add-view')?.classList.remove('hidden');
        setupAddUserForm();
    } else if (view === 'act-as') {
        document.getElementById('users-act-as-view')?.classList.remove('hidden');
        loadActAsUsersList();
    }
}

// Load users list
async function loadUsersList() {
    const tbody = document.getElementById('users-table');
    if (!tbody) return;
    
    const users = await API.getUsers();
    
    let html = '';
    for (const user of (users.data || [])) {
        const roleLabel = user.role === 'ae' ? 'Account Executive' : 
                         user.role === 'am' ? 'Account Manager' : 'Administrator';
        const platformRole = user.platformRole || 'user';
        const status = user.status || 'active';
        const statusColor = status === 'active' ? 'green' : 
                          status === 'invited' ? 'yellow' : 'gray';
        
        html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">
                    <div class="font-medium">${user.name}</div>
                </td>
                <td class="py-3 px-4 text-sm">${user.email}</td>
                <td class="py-3 px-4 text-sm font-mono">${user.username}</td>
                <td class="py-3 px-4">
                    <select class="px-2 py-1 border border-gray-300 rounded text-sm" 
                            onchange="updateUserRole('${user.id}', this.value, 'role')">
                        <option value="ae" ${user.role === 'ae' ? 'selected' : ''}>AE</option>
                        <option value="am" ${user.role === 'am' ? 'selected' : ''}>AM</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td class="py-3 px-4">
                    <select class="px-2 py-1 border border-gray-300 rounded text-sm" 
                            onchange="updateUserRole('${user.id}', this.value, 'platform')">
                        <option value="user" ${platformRole === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${platformRole === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-xs">
                        ${status}
                    </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">
                    ${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </td>
                <td class="py-3 px-4">
                    <div class="flex space-x-2">
                        <button onclick="editUser('${user.id}')" class="text-indigo-600 hover:text-indigo-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="resetPassword('${user.id}')" class="text-yellow-600 hover:text-yellow-800">
                            <i class="fas fa-key"></i>
                        </button>
                        <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html || '<tr><td colspan="8" class="text-center py-4 text-gray-500">No users found</td></tr>';
    } catch (error) {
        console.error('Error loading users list:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-600">Error loading users. Please refresh.</td></tr>';
    }
}

// Setup add user form
function setupAddUserForm() {
    const form = document.getElementById('add-user-form');
    if (!form) return;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('new-user-firstname').value;
        const lastName = document.getElementById('new-user-lastname').value;
        const email = document.getElementById('new-user-email').value;
        const phone = document.getElementById('new-user-phone').value;
        const role = document.getElementById('new-user-role').value;
        const platformRole = document.getElementById('new-user-platform-role').value;
        
        // Generate username: first initial + last name (lowercase)
        const username = (firstName[0] + lastName).toLowerCase().replace(/\s/g, '');
        
        // Generate temporary password
        const tempPassword = generatePassword();
        
        // Create user object
        const userData = {
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            username: username,
            password: tempPassword, // In real app, this would be hashed
            role: role,
            platformRole: platformRole,
            status: 'invited',
            invitedAt: new Date().toISOString(),
            lastLogin: null
        };
        
        try {
            // Create user
            const newUser = await API.createUser(userData);
            
            // Send invite email (simulated)
            await sendInviteEmail(newUser, tempPassword);
            
            showAlert(`User invited successfully! Login: ${username}`, 'success');
            
            // Reset form
            form.reset();
            
            // Switch to list view
            showUserView('list');
        } catch (error) {
            showAlert('Failed to create user: ' + error.message, 'error');
        }
    };
}

// Generate temporary password
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Send invite email (simulated)
async function sendInviteEmail(user, tempPassword) {
    // In a real application, this would send an actual email
    // For static website, display credentials in a modal
    
    const modalHtml = `
        <div id="invite-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-envelope text-indigo-600 mr-2"></i>
                        User Invitation Created
                    </h3>
                    <button onclick="document.getElementById('invite-modal').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p class="text-sm text-yellow-800">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>Important:</strong> Since this is a static website, emails cannot be sent automatically. Please copy and share these credentials with the user.
                    </p>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="text-xs font-medium text-gray-500">Name:</label>
                        <p class="text-gray-900 font-semibold">${user.name}</p>
                    </div>
                    <div>
                        <label class="text-xs font-medium text-gray-500">Email:</label>
                        <p class="text-gray-900">${user.email}</p>
                    </div>
                    <div>
                        <label class="text-xs font-medium text-gray-500">Login URL:</label>
                        <p class="text-gray-900 text-sm break-all">${window.location.origin}</p>
                    </div>
                    <div>
                        <label class="text-xs font-medium text-gray-500">Username:</label>
                        <div class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                            <span class="font-mono text-gray-900">${user.username}</span>
                            <button onclick="navigator.clipboard.writeText('${user.username}')" class="text-indigo-600 hover:text-indigo-800">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-medium text-gray-500">Temporary Password:</label>
                        <div class="flex items-center justify-between bg-yellow-100 px-3 py-2 rounded">
                            <span class="font-mono text-gray-900">${tempPassword}</span>
                            <button onclick="navigator.clipboard.writeText('${tempPassword}')" class="text-indigo-600 hover:text-indigo-800">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mt-6 flex space-x-3">
                    <button onclick="copyAllInviteDetails('${user.username}', '${tempPassword}', '${user.email}')" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <i class="fas fa-copy mr-2"></i>Copy All Details
                    </button>
                    <button onclick="document.getElementById('invite-modal').remove()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Copy all invite details to clipboard
function copyAllInviteDetails(username, password, email) {
    const details = `User Invitation Details
Email: ${email}
Login URL: ${window.location.origin}
Username: ${username}
Password: ${password}`;
    
    navigator.clipboard.writeText(details).then(() => {
        showAlert('All credentials copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy. Please copy manually.', 'error');
    });
}

// Update user role
async function updateUserRole(userId, value, type) {
    try {
        const updateData = {};
        if (type === 'role') {
            updateData.role = value;
        } else if (type === 'platform') {
            updateData.platformRole = value;
        }
        
        await API.updateUser(userId, updateData);
        showAlert('User updated successfully', 'success');
        
        // If updating current user's role, refresh the app
        if (userId === currentUser.id) {
            if (type === 'role') {
                currentUser.role = value;
            } else {
                currentUser.platformRole = value;
            }
            updateUserInfo();
            refreshCurrentView();
        }
    } catch (error) {
        showAlert('Failed to update user: ' + error.message, 'error');
        loadUsersList(); // Reload to revert changes
    }
}

// Edit user
async function editUser(userId) {
    try {
        // Get user data
        const user = await API.getUser(userId);
        if (!user) {
            showAlert('User not found', 'error');
            return;
        }
        
        // Create edit modal
        const modalHTML = `
            <div id="edit-user-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Edit User</h2>
                        <button onclick="closeEditUserModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="edit-user-form" onsubmit="return handleEditUser(event, '${userId}')">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Name -->
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input type="text" id="edit-user-name" value="${user.name || ''}" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" required>
                            </div>
                            
                            <!-- Email -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                <input type="email" id="edit-user-email" value="${user.email || ''}" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" required>
                            </div>
                            
                            <!-- Username -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input type="text" id="edit-user-username" value="${user.username || ''}" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" readonly
                                    title="Username is auto-generated from name">
                            </div>
                            
                            <!-- Sales Role -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Sales Role *</label>
                                <select id="edit-user-role" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" required>
                                    <option value="ae" ${user.role === 'ae' ? 'selected' : ''}>Account Executive (AE)</option>
                                    <option value="am" ${user.role === 'am' ? 'selected' : ''}>Account Manager (AM)</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                                </select>
                            </div>
                            
                            <!-- Platform Role -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Platform Role *</label>
                                <select id="edit-user-platform-role" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" required>
                                    <option value="user" ${user.platformRole === 'user' ? 'selected' : ''}>User</option>
                                    <option value="admin" ${user.platformRole === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                            
                            <!-- Team -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                <input type="text" id="edit-user-team" value="${user.team || ''}" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g., Sales Team A">
                            </div>
                            
                            <!-- Status -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select id="edit-user-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" required>
                                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Password Section -->
                        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-700 mb-3">Password Management</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                                    <div class="relative">
                                        <input type="password" id="edit-user-password" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                            placeholder="Enter new password">
                                        <button type="button" onclick="toggleEditPasswordVisibility('edit-user-password')" 
                                            class="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <i class="fas fa-eye text-gray-400"></i>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <div class="relative">
                                        <input type="password" id="edit-user-password-confirm" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                            placeholder="Confirm new password">
                                        <button type="button" onclick="toggleEditPasswordVisibility('edit-user-password-confirm')" 
                                            class="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <i class="fas fa-eye text-gray-400"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-2 flex items-center space-x-4">
                                <button type="button" onclick="generateNewPassword()" 
                                    class="text-sm text-indigo-600 hover:text-indigo-800">
                                    <i class="fas fa-random mr-1"></i>Generate Random Password
                                </button>
                                <button type="button" onclick="resetUserPassword('${userId}')" 
                                    class="text-sm text-orange-600 hover:text-orange-800">
                                    <i class="fas fa-redo mr-1"></i>Reset to Default
                                </button>
                            </div>
                        </div>
                        
                        <!-- User Info -->
                        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div><span class="text-gray-600">User ID:</span> <span class="font-mono">${user.id}</span></div>
                                <div><span class="text-gray-600">Created:</span> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</div>
                                <div><span class="text-gray-600">Last Login:</span> ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</div>
                                <div><span class="text-gray-600">Updated:</span> ${user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}</div>
                            </div>
                        </div>
                        
                        <div id="edit-user-error" class="hidden mt-4 text-red-600 text-sm"></div>
                        <div id="edit-user-success" class="hidden mt-4 text-green-600 text-sm"></div>
                        
                        <div class="mt-6 flex justify-end space-x-3">
                            <button type="button" onclick="closeEditUserModal()" 
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                                Cancel
                            </button>
                            <button type="submit" 
                                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                <i class="fas fa-save mr-2"></i>Save Changes
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
        
    } catch (error) {
        showAlert('Failed to load user data: ' + error.message, 'error');
    }
}

// Copy all invite details to clipboard
function copyAllInviteDetails(username, password, email) {
    const details = `User Invitation Details
Email: ${email}
Login URL: ${window.location.origin}
Username: ${username}
Password: ${password}`;
    
    navigator.clipboard.writeText(details).then(() => {
        showAlert('All credentials copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy. Please copy manually.', 'error');
    });
}

// Reset password with modal
async function resetPassword(userId) {
    try {
        const response = await API.getUser(userId);
        const user = response.data || response;
        if (!user) {
            showAlert('User not found', 'error');
            return;
        }
        
        // Create password reset modal
        const modalHTML = `
            <div id="reset-password-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Reset Password</h2>
                        <button onclick="closeResetPasswordModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-gray-600">Reset password for:</p>
                        <p class="font-semibold text-gray-900">${user.name}</p>
                        <p class="text-sm text-gray-500">${user.email}</p>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-yellow-800">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            The user will need to be notified of their new password.
                        </p>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="resetToDefault('${userId}')" 
                            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-undo mr-2"></i>Reset to Default (admin123)
                        </button>
                        
                        <button onclick="resetToRandom('${userId}')" 
                            class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-random mr-2"></i>Generate Random Password
                        </button>
                        
                        <button onclick="resetToCustom('${userId}')" 
                            class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <i class="fas fa-edit mr-2"></i>Set Custom Password
                        </button>
                    </div>
                    
                    <div id="password-result" class="hidden mt-4 p-3 bg-gray-100 rounded-lg">
                        <p class="text-sm text-gray-600">New Password:</p>
                        <div class="flex items-center justify-between mt-1">
                            <code id="new-password-display" class="text-lg font-bold text-gray-900"></code>
                            <button onclick="copyNewPassword()" class="text-indigo-600 hover:text-indigo-800">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeResetPasswordModal()" 
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
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
        
    } catch (error) {
        showAlert('Failed to load user data: ' + error.message, 'error');
    }
}

// Close reset password modal
function closeResetPasswordModal() {
    const modal = document.getElementById('reset-password-modal');
    if (modal) modal.remove();
}

// Reset to default password
async function resetToDefault(userId) {
    try {
        await API.updateUser(userId, { password: 'admin123' });
        
        const resultDiv = document.getElementById('password-result');
        const displayDiv = document.getElementById('new-password-display');
        
        if (resultDiv && displayDiv) {
            displayDiv.textContent = 'admin123';
            resultDiv.classList.remove('hidden');
        }
        
        showAlert('Password reset to default', 'success');
    } catch (error) {
        showAlert('Failed to reset password: ' + error.message, 'error');
    }
}

// Reset to random password
async function resetToRandom(userId) {
    const newPassword = generatePassword();
    
    try {
        await API.updateUser(userId, { password: newPassword });
        
        const resultDiv = document.getElementById('password-result');
        const displayDiv = document.getElementById('new-password-display');
        
        if (resultDiv && displayDiv) {
            displayDiv.textContent = newPassword;
            resultDiv.classList.remove('hidden');
        }
        
        showAlert('Password reset successfully', 'success');
    } catch (error) {
        showAlert('Failed to reset password: ' + error.message, 'error');
    }
}

// Reset to custom password
async function resetToCustom(userId) {
    const password = prompt('Enter new password (minimum 6 characters):');
    
    if (!password) return;
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        await API.updateUser(userId, { password: password });
        
        const resultDiv = document.getElementById('password-result');
        const displayDiv = document.getElementById('new-password-display');
        
        if (resultDiv && displayDiv) {
            displayDiv.textContent = password;
            resultDiv.classList.remove('hidden');
        }
        
        showAlert('Password set successfully', 'success');
    } catch (error) {
        showAlert('Failed to set password: ' + error.message, 'error');
    }
}

// Copy new password to clipboard
function copyNewPassword() {
    const passwordDisplay = document.getElementById('new-password-display');
    if (passwordDisplay) {
        navigator.clipboard.writeText(passwordDisplay.textContent).then(() => {
            showAlert('Password copied to clipboard', 'success');
        }).catch(() => {
            showAlert('Failed to copy password', 'error');
        });
    }
}

// Delete user with enhanced confirmation
async function deleteUser(userId) {
    try {
        const response = await API.getUser(userId);
        const user = response.data || response;
        if (!user) {
            showAlert('User not found', 'error');
            return;
        }
        
        // Check if deleting self
        if (currentUser && currentUser.id === userId) {
            showAlert('You cannot delete your own account', 'error');
            return;
        }
        
        // Create delete confirmation modal
        const modalHTML = `
            <div id="delete-user-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <div class="flex items-start mb-4">
                        <div class="flex-shrink-0">
                            <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-xl font-bold text-gray-900">Delete User Account</h3>
                            <p class="mt-2 text-gray-600">
                                Are you sure you want to delete this user?
                            </p>
                        </div>
                    </div>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p class="font-semibold text-gray-900">${user.name}</p>
                        <p class="text-sm text-gray-600">${user.email}</p>
                        <p class="text-sm text-gray-500 mt-1">Role: ${user.role === 'ae' ? 'Account Executive' : user.role === 'am' ? 'Account Manager' : 'Administrator'}</p>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-yellow-800">
                            <strong>Warning:</strong> This will also delete all activity data associated with this user.
                        </p>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button onclick="closeDeleteUserModal()" 
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                            Cancel
                        </button>
                        <button onclick="confirmDeleteUser('${userId}')" 
                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            <i class="fas fa-trash mr-2"></i>Delete User
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
    } catch (error) {
        showAlert('Failed to load user data: ' + error.message, 'error');
    }
}

// Close delete user modal
function closeDeleteUserModal() {
    const modal = document.getElementById('delete-user-modal');
    if (modal) modal.remove();
}

// Confirm delete user
async function confirmDeleteUser(userId) {
    try {
        // Delete user's activities first
        const activities = await API.getActivities();
        if (activities.data) {
            const userActivities = activities.data.filter(a => a.userId === userId);
            for (const activity of userActivities) {
                await API.deleteActivity(activity.id);
            }
        }
        
        // Delete the user
        await API.deleteUser(userId);
        
        // Close modal
        closeDeleteUserModal();
        
        showAlert('User and associated data deleted successfully', 'success');
        
        // Refresh the user list
        loadUsersList();
        
        // Refresh data statistics if available
        if (typeof loadDataStatistics === 'function') {
            loadDataStatistics();
        }
        
    } catch (error) {
        showAlert('Failed to delete user: ' + error.message, 'error');
    }
}

// Filter users
function filterUsers() {
    const searchTerm = document.getElementById('user-search')?.value.toLowerCase();
    const rows = document.querySelectorAll('#users-table tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Load act as users list
async function loadActAsUsersList() {
    const selector = document.getElementById('act-as-user-selector');
    if (!selector) {
        console.error('Act as user selector not found');
        return;
    }
    
    try {
        // Use loadUsers() which returns array directly
        const users = await loadUsers();
        console.log('Loading act as users list, found users:', users.length);
        
        let html = '<option value="">Select a user...</option>';
        for (const user of users) {
            // Don't show current user in list
            if (user.id === currentUser.id) continue;
            
            const roleLabel = user.role === 'ae' ? 'AE' : 
                             user.role === 'am' ? 'AM' : 'Admin';
            html += `
                <option value="${user.id}" data-role="${user.role}" data-name="${user.name}">
                    ${user.name} (${roleLabel})
                </option>
            `;
        }
        
        selector.innerHTML = html;
        selector.onchange = showActAsUserDetails;
    } catch (error) {
        console.error('Error loading act as users:', error);
        selector.innerHTML = '<option value="">Error loading users</option>';
    }
}

// Show act as user details
function showActAsUserDetails() {
    const selector = document.getElementById('act-as-user-selector');
    const detailsDiv = document.getElementById('act-as-user-details');
    
    if (!selector || !detailsDiv) return;
    
    const selectedOption = selector.options[selector.selectedIndex];
    
    if (!selector.value) {
        detailsDiv.classList.add('hidden');
        return;
    }
    
    const userName = selectedOption.dataset.name;
    const userRole = selectedOption.dataset.role;
    const roleLabel = userRole === 'ae' ? 'Account Executive' : 
                     userRole === 'am' ? 'Account Manager' : 'Administrator';
    
    detailsDiv.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 class="font-semibold text-yellow-800 mb-2">You will act as:</h4>
            <p class="text-yellow-700"><strong>${userName}</strong></p>
            <p class="text-yellow-600 text-sm">Role: ${roleLabel}</p>
            <p class="text-yellow-600 text-sm mt-2">
                You will see the application exactly as this user sees it, including their dashboard, 
                activities, and permissions.
            </p>
        </div>
    `;
    
    detailsDiv.classList.remove('hidden');
}

// Act as selected user
async function actAsUser() {
    const selector = document.getElementById('act-as-user-selector');
    if (!selector || !selector.value) {
        showAlert('Please select a user', 'warning');
        return;
    }
    
    const userId = selector.value;
    const selectedOption = selector.options[selector.selectedIndex];
    const userName = selectedOption.dataset.name;
    const userRole = selectedOption.dataset.role;
    
    // Store original user
    if (!originalUser) {
        originalUser = { ...currentUser };
    }
    
    try {
        // Get full user data
        const userData = await API.getUser(userId);
        
        // Switch to new user (preserve admin's platformRole)
        currentUser = {
            id: userData.id,
            name: userData.name,
            role: userData.role,
            email: userData.email,
            team: userData.team || 'Sales Team',
            platformRole: originalUser.platformRole, // Preserve admin's platform role
            isActingAs: true,
            originalUser: originalUser
        };
        
        // Update UI
        updateUserInfo();
        
        // Add "Stop Acting As" button to header
        addStopActingAsButton();
        
        // Navigate to dashboard
        showSection('dashboard');
        loadDashboard();
        
        showAlert(`Now acting as ${userName}`, 'info');
    } catch (error) {
        showAlert('Failed to act as user: ' + error.message, 'error');
    }
}

// Add stop acting as button
function addStopActingAsButton() {
    // Check if button already exists
    if (document.getElementById('stop-acting-as-btn')) return;
    
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return;
    
    // Create a container for the acting as indicator
    const container = document.createElement('div');
    container.id = 'acting-as-container';
    container.className = 'ml-4 flex items-center gap-2';
    
    // Add indicator text
    const indicator = document.createElement('span');
    indicator.className = 'text-yellow-600 text-sm font-medium';
    indicator.innerHTML = '<i class="fas fa-user-secret mr-1"></i>Acting as';
    
    // Add stop button
    const button = document.createElement('button');
    button.id = 'stop-acting-as-btn';
    button.className = 'px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors';
    button.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Return to Admin';
    button.onclick = stopActingAs;
    
    container.appendChild(indicator);
    container.appendChild(button);
    userInfo.appendChild(container);
}

// Stop acting as user
function stopActingAs() {
    if (!originalUser) return;
    
    // Restore original user
    currentUser = { ...originalUser };
    originalUser = null;
    
    // Remove acting as indicator
    delete currentUser.isActingAs;
    delete currentUser.originalUser;
    
    // Update UI
    updateUserInfo();
    
    // Remove acting as container
    const actingContainer = document.getElementById('acting-as-container');
    if (actingContainer) actingContainer.remove();
    
    // Navigate back to user management
    showSection('users');
    loadUsers();
    
    showAlert('Returned to administrator view', 'success');
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Close edit user modal
function closeEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) modal.remove();
}

// Handle edit user form submission
async function handleEditUser(event, userId) {
    event.preventDefault();
    
    const errorEl = document.getElementById('edit-user-error');
    const successEl = document.getElementById('edit-user-success');
    
    // Hide messages
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    
    // Get form values
    const userData = {
        name: document.getElementById('edit-user-name').value,
        email: document.getElementById('edit-user-email').value,
        role: document.getElementById('edit-user-role').value,
        platformRole: document.getElementById('edit-user-platform-role').value,
        team: document.getElementById('edit-user-team').value || 'Sales Team',
        status: document.getElementById('edit-user-status').value
    };
    
    // Generate username from name
    const nameParts = userData.name.trim().split(' ');
    if (nameParts.length >= 2) {
        userData.username = (nameParts[0][0] + nameParts[nameParts.length - 1]).toLowerCase();
    } else {
        userData.username = userData.name.toLowerCase().replace(/\s+/g, '');
    }
    
    // Check password fields
    const newPassword = document.getElementById('edit-user-password').value;
    const confirmPassword = document.getElementById('edit-user-password-confirm').value;
    
    if (newPassword) {
        if (newPassword !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            errorEl.classList.remove('hidden');
            return false;
        }
        if (newPassword.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters';
            errorEl.classList.remove('hidden');
            return false;
        }
        userData.password = newPassword;
    }
    
    try {
        // Update user
        await API.updateUser(userId, userData);
        
        successEl.textContent = 'User updated successfully!';
        successEl.classList.remove('hidden');
        
        // Refresh the user list
        loadUsersList();
        
        // Close modal after a delay
        setTimeout(() => {
            closeEditUserModal();
        }, 1500);
        
    } catch (error) {
        errorEl.textContent = 'Failed to update user: ' + error.message;
        errorEl.classList.remove('hidden');
    }
    
    return false;
}

// Toggle password visibility in edit modal
function toggleEditPasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Generate new password for edit modal
function generateNewPassword() {
    const newPassword = generatePassword();
    document.getElementById('edit-user-password').value = newPassword;
    document.getElementById('edit-user-password-confirm').value = newPassword;
    
    // Show the password temporarily
    const passwordInput = document.getElementById('edit-user-password');
    const confirmInput = document.getElementById('edit-user-password-confirm');
    passwordInput.type = 'text';
    confirmInput.type = 'text';
    
    showAlert(`Generated password: ${newPassword}`, 'info', 5000);
    
    // Hide password after 5 seconds
    setTimeout(() => {
        passwordInput.type = 'password';
        confirmInput.type = 'password';
    }, 5000);
}

// Reset user password to default
async function resetUserPassword(userId) {
    if (!confirm('Reset this user\'s password to default (admin123)?')) return;
    
    try {
        await API.updateUser(userId, { password: 'admin123' });
        showAlert('Password reset to default: admin123', 'success', 5000);
        
        // Update the password fields if in edit modal
        const passwordField = document.getElementById('edit-user-password');
        if (passwordField) {
            passwordField.value = 'admin123';
            document.getElementById('edit-user-password-confirm').value = 'admin123';
        }
    } catch (error) {
        showAlert('Failed to reset password: ' + error.message, 'error');
    }
}

// Initialize user management
function initializeUserManagement() {
    console.log('Initializing user management...', currentUser);
    
    // Check if user is admin (platform role)
    if (currentUser.platformRole !== 'admin') {
        const usersSection = document.getElementById('users-section');
        if (usersSection) {
            usersSection.innerHTML = '<div class="text-center py-8 text-gray-500">You do not have permission to access this section.</div>';
        }
        return;
    }
    
    // Load initial view
    showUserView('list');
}

// Export functions globally
window.showUserView = showUserView;
window.loadUsersList = loadUsersList;
window.setupAddUserForm = setupAddUserForm;
window.addUser = addUser;
window.updateUserRole = updateUserRole;
window.deleteUser = deleteUser;
window.resetPassword = resetPassword;
window.loadUsers = loadUsers;