// STABLE COMPREHENSIVE FIX - Fixes all issues WITHOUT breaking existing functionality
// This version carefully preserves existing behavior while adding fixes

(function() {
    console.log('=== STABLE COMPREHENSIVE FIX LOADING ===');
    
    // Track what we've fixed to avoid re-applying
    const fixesApplied = {
        loginCentering: false,
        missingFunctions: false,
        showUserView: false,
        resetAllData: false,
        sectionDisplay: false
    };
    
    // Wait for DOM and all scripts to load
    function waitForReady(callback) {
        if (document.readyState === 'complete') {
            setTimeout(callback, 200); // Give other scripts time to initialize
        } else {
            window.addEventListener('load', () => setTimeout(callback, 200));
        }
    }
    
    waitForReady(function() {
        console.log('Applying stable fixes...');
        
        // ====================
        // FIX 1: LOGIN PAGE CENTERING (Non-Invasive)
        // ====================
        function fixLoginPageCentering() {
            if (fixesApplied.loginCentering) return;
            
            console.log('Applying login page centering fix...');
            
            // Add CSS styles if not present
            if (!document.getElementById('stable-login-styles')) {
                const style = document.createElement('style');
                style.id = 'stable-login-styles';
                style.innerHTML = `
                    #login-page {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        align-items: center !important;
                        justify-content: center !important;
                        z-index: 9999 !important;
                    }
                    
                    #login-page[style*="display: flex"] {
                        display: flex !important;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    }
                    
                    #login-page[style*="display: none"] {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
                console.log('✅ Login centering CSS added');
            }
            
            fixesApplied.loginCentering = true;
        }
        
        // ====================
        // FIX 2: ADD MISSING DASHBOARD FUNCTIONS (Safe)
        // ====================
        function addMissingFunctions() {
            if (fixesApplied.missingFunctions) return;
            
            console.log('Adding missing functions safely...');
            
            // Only add if they don't exist
            if (typeof window.loadDashboardData !== 'function') {
                window.loadDashboardData = function() {
                    console.log('loadDashboardData called');
                    
                    // Try to call existing dashboard functions
                    if (typeof loadDashboard === 'function') {
                        return loadDashboard();
                    } else if (typeof loadAEDashboard === 'function') {
                        return loadAEDashboard();
                    } else if (typeof loadAdminDashboard === 'function') {
                        return loadAdminDashboard();
                    }
                    
                    console.log('No dashboard function available yet');
                };
            }
            
            if (typeof window.updateDashboardStats !== 'function') {
                window.updateDashboardStats = function() {
                    console.log('updateDashboardStats placeholder');
                };
            }
            
            if (typeof window.loadWeeklyProgress !== 'function') {
                window.loadWeeklyProgress = function() {
                    console.log('loadWeeklyProgress placeholder');
                };
            }
            
            fixesApplied.missingFunctions = true;
            console.log('✅ Missing functions added');
        }
        
        // ====================
        // FIX 3: ENSURE showUserView WORKS (Preserve Original)
        // ====================
        function ensureShowUserView() {
            if (fixesApplied.showUserView) return;
            
            // Only create if it doesn't exist
            if (typeof window.showUserView !== 'function') {
                console.log('Creating showUserView function...');
                
                window.showUserView = function(view) {
                    console.log('showUserView:', view);
                    
                    // Don't interfere with authentication
                    if (window.UnifiedApp && !UnifiedApp.state.authenticated) {
                        console.log('Not authenticated, cannot show user view');
                        return;
                    }
                    
                    // Update button states
                    const buttons = document.querySelectorAll('.user-view-btn');
                    buttons.forEach(btn => {
                        const btnView = btn.getAttribute('data-view') || 
                                       btn.getAttribute('onclick')?.match(/showUserView\('(\w+)'\)/)?.[1];
                        
                        if (btnView === view) {
                            btn.classList.add('bg-indigo-600', 'text-white');
                            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
                        } else {
                            btn.classList.remove('bg-indigo-600', 'text-white');
                            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
                        }
                    });
                    
                    // Hide all views
                    document.querySelectorAll('.user-management-view').forEach(v => {
                        v.classList.add('hidden');
                    });
                    
                    // Show selected view
                    let viewId = '';
                    let loadFunction = null;
                    
                    switch(view) {
                        case 'list':
                            viewId = 'users-list-view';
                            loadFunction = window.loadUsersList;
                            break;
                        case 'add':
                            viewId = 'users-add-view';
                            loadFunction = window.setupAddUserForm;
                            break;
                        case 'act-as':
                            viewId = 'users-act-as-view';
                            loadFunction = window.loadActAsUsersList;
                            break;
                    }
                    
                    const viewElement = document.getElementById(viewId);
                    if (viewElement) {
                        viewElement.classList.remove('hidden');
                        
                        // Call load function if available
                        if (typeof loadFunction === 'function') {
                            try {
                                loadFunction();
                            } catch (e) {
                                console.warn('Error loading view data:', e);
                            }
                        }
                        
                        console.log('✅ View shown:', view);
                    }
                };
                
                console.log('✅ showUserView created');
            }
            
            fixesApplied.showUserView = true;
        }
        
        // ====================
        // FIX 4: IMPROVE resetAllData (Non-Breaking)
        // ====================
        function improveResetAllData() {
            if (fixesApplied.resetAllData) return;
            
            // Save original if it exists
            const originalReset = window.resetAllData;
            
            window.resetAllData = function() {
                console.log('Enhanced resetAllData called');
                
                // Show confirmations
                if (!confirm('⚠️ WARNING: Reset All Data?\n\nThis will delete everything and restore defaults.\n\nContinue?')) {
                    return;
                }
                
                if (!confirm('⚠️ FINAL WARNING\n\nThis action cannot be undone.\n\nAre you absolutely sure?')) {
                    return;
                }
                
                // Show progress
                const progressDiv = document.createElement('div');
                progressDiv.id = 'reset-progress';
                progressDiv.style.cssText = `
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
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                `;
                progressDiv.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
                        <div>Resetting Application...</div>
                        <div style="font-size: 14px; margin-top: 10px; opacity: 0.7;">Please wait...</div>
                    </div>
                `;
                document.body.appendChild(progressDiv);
                
                // Perform reset
                setTimeout(() => {
                    // Call original if it exists
                    if (typeof originalReset === 'function') {
                        originalReset();
                    } else {
                        // Do our own reset
                        localStorage.clear();
                        sessionStorage.clear();
                    }
                    
                    // Update message
                    progressDiv.querySelector('div').innerHTML = `
                        <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                        <div>Reset Complete!</div>
                        <div style="font-size: 14px; margin-top: 10px;">Reloading...</div>
                    `;
                    
                    // Reload
                    setTimeout(() => location.reload(), 1500);
                }, 1000);
            };
            
            fixesApplied.resetAllData = true;
            console.log('✅ resetAllData enhanced');
        }
        
        // ====================
        // FIX 5: STABILIZE showSection (Non-Breaking)
        // ====================
        function stabilizeShowSection() {
            if (fixesApplied.sectionDisplay) return;
            
            // Save original
            const originalShowSection = window.showSection;
            
            // Only override if needed
            if (typeof originalShowSection === 'function') {
                // Wrap the original to add error handling
                const wrappedShowSection = window.showSection;
                window.showSection = function(sectionName) {
                    console.log('showSection wrapper:', sectionName);
                    
                    try {
                        // Call original
                        wrappedShowSection.call(this, sectionName);
                    } catch (error) {
                        console.warn('showSection error, using fallback:', error);
                        
                        // Fallback implementation
                        if (!window.UnifiedApp?.state?.authenticated) {
                            console.log('Not authenticated');
                            return;
                        }
                        
                        // Hide all sections
                        document.querySelectorAll('.content-section').forEach(s => {
                            s.classList.add('hidden');
                        });
                        
                        // Show requested section
                        const section = document.getElementById(`${sectionName}-section`);
                        if (section) {
                            section.classList.remove('hidden');
                        }
                    }
                };
            } else {
                // Create basic implementation
                window.showSection = function(sectionName) {
                    console.log('showSection basic:', sectionName);
                    
                    if (!window.UnifiedApp?.state?.authenticated) {
                        return;
                    }
                    
                    document.querySelectorAll('.content-section').forEach(s => {
                        s.classList.add('hidden');
                    });
                    
                    const section = document.getElementById(`${sectionName}-section`);
                    if (section) {
                        section.classList.remove('hidden');
                    }
                };
            }
            
            fixesApplied.sectionDisplay = true;
            console.log('✅ showSection stabilized');
        }
        
        // ====================
        // APPLY FIXES IN ORDER
        // ====================
        
        // Apply immediately
        fixLoginPageCentering();
        addMissingFunctions();
        ensureShowUserView();
        improveResetAllData();
        stabilizeShowSection();
        
        // Re-check after a delay (but don't re-apply if already done)
        setTimeout(() => {
            ensureShowUserView();
            addMissingFunctions();
        }, 1000);
        
        // Add global helper for debugging
        window.stableFixes = {
            status: fixesApplied,
            reapply: function() {
                Object.keys(fixesApplied).forEach(key => {
                    fixesApplied[key] = false;
                });
                fixLoginPageCentering();
                addMissingFunctions();
                ensureShowUserView();
                improveResetAllData();
                stabilizeShowSection();
            }
        };
        
        console.log('=== STABLE COMPREHENSIVE FIX COMPLETE ===');
        console.log('Fixes applied:', fixesApplied);
    });
})();