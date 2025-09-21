// Section Display Fix - Ensures sections show when clicked
// This fixes the navigation issue

(function() {
    console.log('Section Fix: Initializing...');
    
    // Create global showSection function if it doesn't exist
    if (typeof window.showSection !== 'function') {
        window.showSection = function(sectionName) {
            console.log('Section Fix: Showing section:', sectionName);
            
            // Check authentication
            if (!UnifiedApp.state.authenticated) {
                console.log('Not authenticated, showing login');
                UnifiedApp.showLogin();
                return;
            }
            
            // Get current user
            const currentUser = UnifiedApp.state.currentUser;
            
            // Check permissions for admin-only sections
            if ((sectionName === 'goals' || sectionName === 'users') && 
                currentUser && currentUser.platformRole !== 'admin' && currentUser.role !== 'admin') {
                alert('Access Denied: Only administrators can access this section.');
                return;
            }
            
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('animate-fadeIn', 'active');
                section.style.display = 'none';
            });
            
            // Show selected section
            const selectedSection = document.getElementById(`${sectionName}-section`);
            if (selectedSection) {
                selectedSection.classList.remove('hidden');
                selectedSection.classList.add('animate-fadeIn', 'active');
                selectedSection.style.display = 'block';
                
                console.log('Section Fix: Section displayed:', sectionName);
                
                // Load section-specific data
                loadSectionData(sectionName);
            } else {
                console.error('Section Fix: Section not found:', sectionName + '-section');
            }
            
            // Update navigation active state
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => link.classList.remove('active'));
            
            const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
            
            // Store current view
            window.currentView = sectionName;
        };
    }
    
    // Create loadSectionData function if it doesn't exist
    if (typeof window.loadSectionData !== 'function') {
        window.loadSectionData = function(sectionName) {
            console.log('Loading data for section:', sectionName);
            
            try {
                switch(sectionName) {
                    case 'dashboard':
                        if (typeof loadDashboardData === 'function') {
                            loadDashboardData();
                        }
                        if (typeof updateDashboardStats === 'function') {
                            updateDashboardStats();
                        }
                        if (typeof loadWeeklyProgress === 'function') {
                            loadWeeklyProgress();
                        }
                        break;
                        
                    case 'leaderboard':
                        if (typeof loadLeaderboard === 'function') {
                            loadLeaderboard();
                        }
                        break;
                        
                    case 'goals':
                        if (typeof loadGoals === 'function') {
                            loadGoals();
                        }
                        if (typeof showGoalsView === 'function') {
                            showGoalsView('list');
                        }
                        break;
                        
                    case 'users':
                        if (typeof loadUsers === 'function') {
                            loadUsers();
                        }
                        if (typeof showUserView === 'function') {
                            showUserView('list');
                        }
                        break;
                }
            } catch (error) {
                console.warn('Error loading section data:', error);
            }
        };
    }
    
    // Make functions globally available from app.js
    if (typeof showSection === 'function' && window.showSection !== showSection) {
        // If app.js has its own showSection, make it global
        window.originalShowSection = showSection;
        
        // Create a wrapper that handles both
        window.showSection = function(sectionName) {
            if (typeof originalShowSection === 'function') {
                try {
                    originalShowSection(sectionName);
                    return;
                } catch (error) {
                    console.warn('Original showSection failed, using fallback:', error);
                }
            }
            
            // Use our implementation as fallback
            console.log('Using fallback showSection for:', sectionName);
            
            // Check authentication
            if (!UnifiedApp.state.authenticated) {
                UnifiedApp.showLogin();
                return;
            }
            
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.add('hidden');
                section.style.display = 'none';
            });
            
            // Show selected section
            const selectedSection = document.getElementById(`${sectionName}-section`);
            if (selectedSection) {
                selectedSection.classList.remove('hidden');
                selectedSection.style.display = 'block';
                
                // Load section data
                if (typeof loadSectionData === 'function') {
                    loadSectionData(sectionName);
                }
            }
            
            // Update navigation
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => link.classList.remove('active'));
            
            const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        };
    }
    
    // Also make other essential functions global if they exist
    const functionsToExport = [
        'loadDashboardData',
        'updateDashboardStats', 
        'loadWeeklyProgress',
        'loadLeaderboard',
        'loadGoals',
        'showGoalsView',
        'loadUsers',
        'showUserView',
        'saveActivityData',
        'showAlert',
        'updateUserRole',
        'deleteUser',
        'resetPassword',
        'updateGoal',
        'deleteGoal',
        'addUser',
        'loadUsersList',
        'setupAddUserForm',
        'resetAllData',
        'exportData',
        'importData'
    ];
    
    functionsToExport.forEach(funcName => {
        if (typeof window[funcName] !== 'function' && typeof eval(funcName) === 'function') {
            try {
                window[funcName] = eval(funcName);
                console.log('Exported function:', funcName);
            } catch (e) {
                // Function doesn't exist, that's okay
            }
        }
    });
    
    // Fix for currentUser
    if (!window.currentUser && UnifiedApp.state.currentUser) {
        window.currentUser = UnifiedApp.state.currentUser;
    }
    
    // Ensure dashboard shows by default after login
    setTimeout(() => {
        if (UnifiedApp.state.authenticated && !window.currentView) {
            console.log('Section Fix: Showing default dashboard');
            window.showSection('dashboard');
        }
    }, 500);
    
    console.log('Section Fix: Ready');
})();

// Export key functions for debugging
window.debugSections = function() {
    console.log('=== Section Debug Info ===');
    console.log('Authenticated:', UnifiedApp.state.authenticated);
    console.log('Current User:', UnifiedApp.state.currentUser);
    console.log('Current View:', window.currentView);
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        console.log(`Section ${section.id}:`, {
            hidden: section.classList.contains('hidden'),
            display: section.style.display,
            offsetHeight: section.offsetHeight
        });
    });
};