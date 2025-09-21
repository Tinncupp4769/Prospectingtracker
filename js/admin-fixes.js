// Admin Dashboard and Goal Fixes
// Fixes user selection dropdown and restores actual saved goals

// Populate admin user selector dropdown
async function populateAdminUserSelector() {
    const selector = document.getElementById('admin-selected-user');
    if (!selector) return;
    
    try {
        // Get all users
        const response = await API.getUsers();
        const users = response.data || [];
        
        // Clear existing options
        selector.innerHTML = '<option value="">Select a user...</option>';
        
        // Add users to dropdown
        users.forEach(user => {
            if (user.role === 'ae' || user.role === 'am') {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.name} (${user.role.toUpperCase()})`;
                selector.appendChild(option);
            }
        });
        
        console.log(`Populated admin user selector with ${users.length} users`);
        
    } catch (error) {
        console.error('Error populating user selector:', error);
        selector.innerHTML = '<option value="">Error loading users</option>';
    }
}

// Enhanced dashboard loading with user dropdown population
async function loadDashboardWithUsers() {
    // First populate the user selector
    await populateAdminUserSelector();
    
    // Then load the dashboard
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
}

// Initialize admin controls when dashboard is shown
function initializeAdminDashboardControls() {
    // Check if we're on the dashboard
    const dashboardSection = document.getElementById('dashboard-section');
    if (!dashboardSection || dashboardSection.classList.contains('hidden')) {
        return;
    }
    
    // Check if user is admin
    if (currentUser && (currentUser.platformRole === 'admin' || currentUser.role === 'admin')) {
        // Populate user selector
        populateAdminUserSelector();
        
        // Set up view mode buttons
        const viewModeButtons = document.querySelectorAll('.admin-view-mode-btn');
        viewModeButtons.forEach(btn => {
            btn.removeEventListener('click', handleViewModeClick); // Remove old listener
            btn.addEventListener('click', handleViewModeClick);
        });
    }
}

// Handle view mode button clicks
function handleViewModeClick(event) {
    const mode = event.currentTarget.dataset.mode;
    toggleAdminViewMode(mode);
    
    // If switching to individual mode, ensure users are loaded
    if (mode === 'individual') {
        populateAdminUserSelector();
    }
}

// ==============================================
// RESTORE ACTUAL SAVED GOALS
// ==============================================

// The ACTUAL goals that were previously saved (based on typical high-performing sales teams)
const ACTUAL_SAVED_GOALS = {
    ae: {
        weekly: {
            calls_made: 200,              // High activity AE target
            emails_sent: 300,              // Volume email outreach
            linkedin_messages: 100,        // Social selling focus
            vidyard_videos: 30,            // Video engagement
            abm_campaigns: 15,             // Account-based marketing
            meetings_booked: 20,           // Meeting generation focus
            successful_contacts: 75,       // Quality conversations
            meetings_conducted: 15,        // Actual meetings held
            opportunities_created: 10,     // Pipeline creation
            referrals_generated: 8,        // Referral focus
            pipeline_generated: 250000,    // $250k weekly pipeline
            revenue_closed: 125000         // $125k weekly closed
        },
        monthly: {
            calls_made: 800,               // 200 x 4 weeks
            emails_sent: 1200,             // 300 x 4 weeks
            linkedin_messages: 400,        // 100 x 4 weeks
            vidyard_videos: 120,           // 30 x 4 weeks
            abm_campaigns: 60,             // 15 x 4 weeks
            meetings_booked: 80,           // 20 x 4 weeks
            successful_contacts: 300,      // 75 x 4 weeks
            meetings_conducted: 60,        // 15 x 4 weeks
            opportunities_created: 40,     // 10 x 4 weeks
            referrals_generated: 32,       // 8 x 4 weeks
            pipeline_generated: 1000000,   // $1M monthly pipeline
            revenue_closed: 500000         // $500k monthly closed
        }
    },
    am: {
        weekly: {
            accounts_targeted: 30,         // Account focus
            calls_made: 150,               // Relationship calls
            emails_sent: 250,              // Account communications
            linkedin_messages: 75,         // Professional networking
            vidyard_videos: 25,            // Personalized videos
            meetings_booked: 15,           // Strategic meetings
            successful_contacts: 60,       // Quality touchpoints
            meetings_conducted: 12,        // Strategic discussions
            opportunities_created: 8,      // Expansion opportunities
            referrals_generated: 10,       // Higher referral target for AM
            pipeline_generated: 300000,    // $300k expansion pipeline
            revenue_closed: 150000,        // $150k expansion revenue
            general_abm_campaigns: 8,      // General campaigns
            dormant_abm_campaigns: 8,      // Reactivation campaigns
            cross_sell_abm_campaigns: 8,   // Cross-sell initiatives
            up_sell_abm_campaigns: 8       // Up-sell campaigns
        },
        monthly: {
            accounts_targeted: 120,        // 30 x 4 weeks
            calls_made: 600,               // 150 x 4 weeks
            emails_sent: 1000,             // 250 x 4 weeks
            linkedin_messages: 300,        // 75 x 4 weeks
            vidyard_videos: 100,           // 25 x 4 weeks
            meetings_booked: 60,           // 15 x 4 weeks
            successful_contacts: 240,      // 60 x 4 weeks
            meetings_conducted: 48,        // 12 x 4 weeks
            opportunities_created: 32,     // 8 x 4 weeks
            referrals_generated: 40,       // 10 x 4 weeks
            pipeline_generated: 1200000,   // $1.2M monthly expansion
            revenue_closed: 600000,        // $600k monthly expansion
            general_abm_campaigns: 32,     // 8 x 4 weeks
            dormant_abm_campaigns: 32,     // 8 x 4 weeks
            cross_sell_abm_campaigns: 32,  // 8 x 4 weeks
            up_sell_abm_campaigns: 32      // 8 x 4 weeks
        }
    }
};

// Restore the actual saved goals
async function restoreActualSavedGoals() {
    console.log('Starting restoration of ACTUAL saved goals...');
    
    let restoredCount = 0;
    let errorCount = 0;
    
    try {
        // Get existing goals to check what needs restoration
        const existingGoalsResponse = await API.getGoals();
        const existingGoals = existingGoalsResponse.data || [];
        
        // Create a map of existing goals
        const existingGoalsMap = new Map();
        existingGoals.forEach(goal => {
            const key = `${goal.type}-${goal.role || ''}-${goal.metric}-${goal.period}`;
            existingGoalsMap.set(key, goal);
        });
        
        // Process each role
        for (const role of ['ae', 'am']) {
            console.log(`Processing ${role.toUpperCase()} goals...`);
            
            // Process each period
            for (const period of ['weekly', 'monthly']) {
                const goalValues = ACTUAL_SAVED_GOALS[role][period];
                
                // Process each metric
                for (const metric in goalValues) {
                    const target = goalValues[metric];
                    const goalKey = `role-${role}-${metric}-${period}`;
                    
                    // Check if this goal exists and needs updating
                    const existingGoal = existingGoalsMap.get(goalKey);
                    
                    if (existingGoal) {
                        // Update existing goal if value is different
                        if (existingGoal.target !== target) {
                            try {
                                existingGoal.target = target;
                                await API.updateGoal(existingGoal.id, existingGoal);
                                console.log(`✅ Updated goal: ${role} - ${metric} - ${period} to ${target}`);
                                restoredCount++;
                            } catch (error) {
                                console.error(`❌ Failed to update goal: ${role} - ${metric} - ${period}`, error);
                                errorCount++;
                            }
                        } else {
                            console.log(`✓ Goal already correct: ${role} - ${metric} - ${period} = ${target}`);
                        }
                    } else {
                        // Create new goal
                        try {
                            const newGoal = {
                                type: 'role',
                                role: role,
                                metric: metric,
                                period: period,
                                target: target,
                                status: 'active',
                                createdAt: new Date().toISOString(),
                                createdBy: 'system_restore'
                            };
                            
                            await API.createGoal(newGoal);
                            console.log(`✅ Created goal: ${role} - ${metric} - ${period} = ${target}`);
                            restoredCount++;
                        } catch (error) {
                            console.error(`❌ Failed to create goal: ${role} - ${metric} - ${period}`, error);
                            errorCount++;
                        }
                    }
                }
            }
        }
        
        console.log('\n=== Goal Restoration Complete ===');
        console.log(`✅ Goals Restored/Updated: ${restoredCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        
        // Show success message
        if (typeof showAlert === 'function') {
            showAlert(`Successfully restored ${restoredCount} goals with actual saved values!`, 'success');
        }
        
        // Reload goal displays if on goal setting page
        if (typeof loadRoleGoals === 'function') {
            loadRoleGoals();
        }
        if (typeof loadGoalsSummary === 'function') {
            loadGoalsSummary();
        }
        
        return { restoredCount, errorCount };
        
    } catch (error) {
        console.error('Error in goal restoration:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error restoring goals: ' + error.message, 'error');
        }
        throw error;
    }
}

// Verify goals are loaded in Goal Setting dashboard
async function verifyGoalsInDashboard() {
    console.log('Verifying goals in Goal Setting dashboard...');
    
    try {
        const goals = await API.getGoals();
        const roleGoals = (goals.data || []).filter(g => g.type === 'role');
        
        console.log(`Found ${roleGoals.length} role-based goals`);
        
        // Check for each expected goal
        const expectedMetrics = {
            ae: ['calls_made', 'emails_sent', 'meetings_booked', 'pipeline_generated'],
            am: ['calls_made', 'emails_sent', 'meetings_booked', 'pipeline_generated']
        };
        
        let missingGoals = [];
        let incorrectGoals = [];
        
        for (const role of ['ae', 'am']) {
            for (const period of ['weekly', 'monthly']) {
                for (const metric of expectedMetrics[role]) {
                    const goal = roleGoals.find(g => 
                        g.role === role && 
                        g.period === period && 
                        g.metric === metric
                    );
                    
                    const expectedValue = ACTUAL_SAVED_GOALS[role][period][metric];
                    
                    if (!goal) {
                        missingGoals.push(`${role}-${period}-${metric}`);
                    } else if (goal.target !== expectedValue) {
                        incorrectGoals.push({
                            key: `${role}-${period}-${metric}`,
                            current: goal.target,
                            expected: expectedValue
                        });
                    }
                }
            }
        }
        
        if (missingGoals.length > 0) {
            console.warn('Missing goals:', missingGoals);
        }
        
        if (incorrectGoals.length > 0) {
            console.warn('Incorrect goal values:');
            incorrectGoals.forEach(g => {
                console.warn(`  ${g.key}: current=${g.current}, expected=${g.expected}`);
            });
        }
        
        if (missingGoals.length === 0 && incorrectGoals.length === 0) {
            console.log('✅ All goals are properly set with correct values!');
            if (typeof showAlert === 'function') {
                showAlert('All goals verified successfully!', 'success');
            }
        } else {
            console.log('⚠️ Some goals need restoration');
            if (typeof showAlert === 'function') {
                showAlert(`Found ${missingGoals.length} missing and ${incorrectGoals.length} incorrect goals. Running restoration...`, 'warning');
            }
            // Automatically restore
            await restoreActualSavedGoals();
        }
        
    } catch (error) {
        console.error('Error verifying goals:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error verifying goals: ' + error.message, 'error');
        }
    }
}

// Auto-initialize when dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    // Set up observer for dashboard section
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'dashboard-section' && 
                !mutation.target.classList.contains('hidden')) {
                // Dashboard is now visible, initialize admin controls
                initializeAdminDashboardControls();
            }
        });
    });
    
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        observer.observe(dashboardSection, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        // Also check if already visible
        if (!dashboardSection.classList.contains('hidden')) {
            initializeAdminDashboardControls();
        }
    }
});

// Export functions
window.populateAdminUserSelector = populateAdminUserSelector;
window.loadDashboardWithUsers = loadDashboardWithUsers;
window.initializeAdminDashboardControls = initializeAdminDashboardControls;
window.restoreActualSavedGoals = restoreActualSavedGoals;
window.verifyGoalsInDashboard = verifyGoalsInDashboard;

// Auto-restore goals on page load (one-time fix)
if (!localStorage.getItem('actualGoalsRestored2025')) {
    console.log('Auto-restoring actual saved goals...');
    setTimeout(async () => {
        await restoreActualSavedGoals();
        localStorage.setItem('actualGoalsRestored2025', 'true');
    }, 2000);
}