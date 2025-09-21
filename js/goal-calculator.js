// Goal Calculator - Handles role-based and individual goal calculations

/**
 * Get the effective goal for a user
 * If user has individual goal override, use that
 * Otherwise, use role-based goal
 */
async function getEffectiveGoalForUser(userId, metric, period = 'weekly') {
    try {
        // First, get the user's details to know their role
        const user = await API.getUser(userId);
        if (!user) {
            console.error('User not found:', userId);
            return null;
        }
        
        // Get all goals
        const allGoalsResponse = await API.getGoals();
        const allGoals = allGoalsResponse.data || [];
        
        // Check for individual goal override first
        const individualGoal = allGoals.find(g => 
            g.type === 'individual' && 
            g.userId === userId && 
            g.metric === metric && 
            g.period === period
        );
        
        if (individualGoal) {
            console.log(`Using individual goal for ${user.name} - ${metric}: ${individualGoal.target}`);
            return {
                value: individualGoal.target,
                type: 'individual',
                source: individualGoal
            };
        }
        
        // No individual override, use role-based goal
        const roleGoal = allGoals.find(g => 
            g.type === 'role' && 
            g.role === user.role && 
            g.metric === metric && 
            g.period === period
        );
        
        if (roleGoal) {
            console.log(`Using role-based goal for ${user.name} (${user.role}) - ${metric}: ${roleGoal.target}`);
            return {
                value: roleGoal.target,
                type: 'role',
                source: roleGoal
            };
        }
        
        // No goal found
        console.log(`No goal found for ${user.name} - ${metric}`);
        return {
            value: 0,
            type: 'none',
            source: null
        };
        
    } catch (error) {
        console.error('Error getting effective goal:', error);
        return null;
    }
}

/**
 * Calculate total goals for all users
 * Takes into account individual overrides
 */
async function calculateTotalGoals(role = null, metric = null, period = 'weekly') {
    try {
        // Get all users
        const usersResponse = await API.getUsers();
        const allUsers = usersResponse.data || [];
        
        // Filter by role if specified
        const users = role ? allUsers.filter(u => u.role === role && u.status === 'active') : 
                            allUsers.filter(u => u.status === 'active');
        
        // Get all metrics or specific metric
        const metrics = metric ? [metric] : getAllMetricsForRole(role);
        
        const totals = {};
        
        for (const m of metrics) {
            totals[m] = {
                total: 0,
                roleBasedCount: 0,
                individualCount: 0,
                users: []
            };
            
            for (const user of users) {
                const goal = await getEffectiveGoalForUser(user.id, m, period);
                if (goal) {
                    totals[m].total += goal.value;
                    if (goal.type === 'individual') {
                        totals[m].individualCount++;
                    } else if (goal.type === 'role') {
                        totals[m].roleBasedCount++;
                    }
                    totals[m].users.push({
                        userId: user.id,
                        userName: user.name,
                        value: goal.value,
                        type: goal.type
                    });
                }
            }
        }
        
        return totals;
        
    } catch (error) {
        console.error('Error calculating total goals:', error);
        return {};
    }
}

/**
 * Apply role-based goals to all users in that role
 * Does NOT override individual goals
 */
async function applyRoleGoalsToUsers(role, metric, target, period = 'weekly') {
    try {
        console.log(`Applying role goal: ${role} - ${metric} - ${target} (${period})`);
        
        // First, update or create the role-based goal
        const allGoalsResponse = await API.getGoals();
        const allGoals = allGoalsResponse.data || [];
        
        // Find existing role goal
        const existingRoleGoal = allGoals.find(g => 
            g.type === 'role' && 
            g.role === role && 
            g.metric === metric && 
            g.period === period
        );
        
        if (existingRoleGoal) {
            // Update existing goal
            await API.updateGoal(existingRoleGoal.id, {
                target: target,
                notes: `Updated by ${currentUser.name} at ${new Date().toLocaleString()}`
            });
            console.log('Updated existing role goal');
        } else {
            // Create new role goal
            await API.createGoal({
                type: 'role',
                role: role,
                userId: null,
                metric: metric,
                target: target,
                period: period,
                category: 'all',
                effectiveDate: new Date().toISOString(),
                createdBy: currentUser.id,
                notes: `Role goal for ${role.toUpperCase()} - ${metric}`
            });
            console.log('Created new role goal');
        }
        
        // The role goal now applies to all users in that role automatically
        // unless they have individual overrides
        
        return true;
        
    } catch (error) {
        console.error('Error applying role goals:', error);
        return false;
    }
}

/**
 * Set individual goal override for a specific user
 */
async function setIndividualGoal(userId, metric, target, period = 'weekly') {
    try {
        console.log(`Setting individual goal: ${userId} - ${metric} - ${target} (${period})`);
        
        // Get user details
        const user = await API.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Check for existing individual goal
        const allGoalsResponse = await API.getGoals();
        const allGoals = allGoalsResponse.data || [];
        
        const existingGoal = allGoals.find(g => 
            g.type === 'individual' && 
            g.userId === userId && 
            g.metric === metric && 
            g.period === period
        );
        
        if (existingGoal) {
            // Update existing individual goal
            await API.updateGoal(existingGoal.id, {
                target: target,
                notes: `Individual override updated by ${currentUser.name} at ${new Date().toLocaleString()}`
            });
            console.log('Updated existing individual goal');
        } else {
            // Create new individual goal
            await API.createGoal({
                type: 'individual',
                role: user.role, // Store role for reference
                userId: userId,
                metric: metric,
                target: target,
                period: period,
                category: 'all',
                effectiveDate: new Date().toISOString(),
                createdBy: currentUser.id,
                notes: `Individual goal override for ${user.name} - ${metric}`
            });
            console.log('Created new individual goal');
        }
        
        return true;
        
    } catch (error) {
        console.error('Error setting individual goal:', error);
        return false;
    }
}

/**
 * Remove individual goal override (revert to role-based goal)
 */
async function removeIndividualGoal(userId, metric, period = 'weekly') {
    try {
        console.log(`Removing individual goal: ${userId} - ${metric} (${period})`);
        
        const allGoalsResponse = await API.getGoals();
        const allGoals = allGoalsResponse.data || [];
        
        const individualGoal = allGoals.find(g => 
            g.type === 'individual' && 
            g.userId === userId && 
            g.metric === metric && 
            g.period === period
        );
        
        if (individualGoal) {
            await API.deleteGoal(individualGoal.id);
            console.log('Removed individual goal override');
            return true;
        }
        
        console.log('No individual goal found to remove');
        return false;
        
    } catch (error) {
        console.error('Error removing individual goal:', error);
        return false;
    }
}

/**
 * Get all metrics for a specific role
 */
function getAllMetricsForRole(role) {
    const aeMetrics = [
        'calls_made', 'emails_sent', 'linkedin_messages', 'abm_campaigns',
        'meetings_booked', 'successful_contacts', 'meetings_conducted',
        'opportunities_created', 'pipeline_generated', 'revenue_closed'
    ];
    
    const amMetrics = [
        'accounts_targeted', 'calls_made', 'emails_sent', 'linkedin_messages',
        'meetings_booked', 'successful_contacts', 'meetings_conducted',
        'opportunities_created', 'pipeline_generated', 'revenue_closed',
        'general_abm_campaigns', 'dormant_abm_campaigns', 
        'cross_sell_abm_campaigns', 'up_sell_abm_campaigns'
    ];
    
    if (role === 'ae') return aeMetrics;
    if (role === 'am') return amMetrics;
    return [...new Set([...aeMetrics, ...amMetrics])]; // All unique metrics
}

/**
 * Get goal summary for display
 */
async function getGoalSummary(period = 'weekly') {
    try {
        const summary = {
            ae: await calculateTotalGoals('ae', null, period),
            am: await calculateTotalGoals('am', null, period),
            totals: {
                aeUsers: 0,
                amUsers: 0,
                individualOverrides: 0
            }
        };
        
        // Count users and overrides
        const usersResponse = await API.getUsers();
        const users = usersResponse.data || [];
        
        summary.totals.aeUsers = users.filter(u => u.role === 'ae' && u.status === 'active').length;
        summary.totals.amUsers = users.filter(u => u.role === 'am' && u.status === 'active').length;
        
        // Count individual overrides
        const goalsResponse = await API.getGoals();
        const goals = goalsResponse.data || [];
        summary.totals.individualOverrides = goals.filter(g => g.type === 'individual' && g.period === period).length;
        
        return summary;
        
    } catch (error) {
        console.error('Error getting goal summary:', error);
        return null;
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getEffectiveGoalForUser,
        calculateTotalGoals,
        applyRoleGoalsToUsers,
        setIndividualGoal,
        removeIndividualGoal,
        getAllMetricsForRole,
        getGoalSummary
    };
}