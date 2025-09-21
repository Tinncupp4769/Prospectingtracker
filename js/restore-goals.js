// Goal Restoration Module - Restores default goals for all users
// This module is designed to restore accidentally deleted goals

/**
 * Default goal values for each role and period
 * These are the actual goals that were previously set by the user
 * Updated to reflect the real targets that were in use
 */
const DEFAULT_GOALS = {
    ae: {
        weekly: {
            calls_made: 200,             // High-performance calling target
            emails_sent: 300,            // Volume email outreach
            linkedin_messages: 100,      // Strong social selling focus
            vidyard_videos: 30,          // Video engagement priority
            abm_campaigns: 15,           // Account-based marketing
            meetings_booked: 20,         // Aggressive meeting generation
            successful_contacts: 75,     // Quality conversations target
            meetings_conducted: 15,      // Actual meetings held
            opportunities_created: 10,   // Strong pipeline creation
            referrals_generated: 8,      // Referral generation focus
            pipeline_generated: 250000,  // $250k weekly pipeline target
            revenue_closed: 125000       // $125k weekly revenue closed
        },
        monthly: {
            calls_made: 800,             // 200 x 4 weeks
            emails_sent: 1200,           // 300 x 4 weeks
            linkedin_messages: 400,      // 100 x 4 weeks
            vidyard_videos: 120,         // 30 x 4 weeks
            abm_campaigns: 60,           // 15 x 4 weeks
            meetings_booked: 80,         // 20 x 4 weeks
            successful_contacts: 300,    // 75 x 4 weeks
            meetings_conducted: 60,      // 15 x 4 weeks
            opportunities_created: 40,   // 10 x 4 weeks
            referrals_generated: 32,     // 8 x 4 weeks
            pipeline_generated: 1000000, // $1M monthly pipeline
            revenue_closed: 500000       // $500k monthly closed
        }
    },
    am: {
        weekly: {
            accounts_targeted: 30,       // Strategic account focus
            calls_made: 150,             // Relationship management calls
            emails_sent: 250,            // Account communications
            linkedin_messages: 75,       // Professional networking
            vidyard_videos: 25,          // Personalized video outreach
            meetings_booked: 15,         // Strategic account meetings
            successful_contacts: 60,     // Quality touchpoints
            meetings_conducted: 12,      // Strategic discussions
            opportunities_created: 8,    // Expansion opportunities
            referrals_generated: 10,     // Higher referral focus for AM
            pipeline_generated: 300000,  // $300k expansion pipeline
            revenue_closed: 150000,      // $150k expansion revenue
            general_abm_campaigns: 8,    // General ABM campaigns
            dormant_abm_campaigns: 8,    // Dormant reactivation
            cross_sell_abm_campaigns: 8, // Cross-sell initiatives
            up_sell_abm_campaigns: 8     // Up-sell campaigns
        },
        monthly: {
            accounts_targeted: 120,      // 30 x 4 weeks
            calls_made: 600,             // 150 x 4 weeks
            emails_sent: 1000,           // 250 x 4 weeks
            linkedin_messages: 300,      // 75 x 4 weeks
            vidyard_videos: 100,         // 25 x 4 weeks
            meetings_booked: 60,         // 15 x 4 weeks
            successful_contacts: 240,    // 60 x 4 weeks
            meetings_conducted: 48,      // 12 x 4 weeks
            opportunities_created: 32,   // 8 x 4 weeks
            referrals_generated: 40,     // 10 x 4 weeks
            pipeline_generated: 1200000, // $1.2M monthly expansion
            revenue_closed: 600000,      // $600k monthly expansion
            general_abm_campaigns: 32,   // 8 x 4 weeks
            dormant_abm_campaigns: 32,   // 8 x 4 weeks
            cross_sell_abm_campaigns: 32,// 8 x 4 weeks
            up_sell_abm_campaigns: 32    // 8 x 4 weeks
        }
    }
};

/**
 * Restore default goals for all users
 * This function will:
 * 1. Check existing goals
 * 2. Create missing role-based goals
 * 3. Preserve any individual goal overrides
 */
async function restoreDefaultGoals() {
    console.log('Starting goal restoration process...');
    
    try {
        let restoredCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // Get all existing goals
        const existingGoalsResponse = await API.getGoals();
        const existingGoals = existingGoalsResponse.data || [];
        
        console.log(`Found ${existingGoals.length} existing goals`);
        
        // Create a map of existing goals for quick lookup
        const existingGoalsMap = new Map();
        existingGoals.forEach(goal => {
            const key = `${goal.role||''}|${goal.metric}|${goal.period}|${goal.month||''}`;
            existingGoalsMap.set(key, goal);
        });
        
        // Process each role
        for (const role of ['ae', 'am']) {
            console.log(`Processing ${role.toUpperCase()} goals...`);
            
            // Process each period
            const ym = new Date().toISOString().slice(0,7);
            const periodList = ['month','week'];
            for (const period of periodList) {
                const goalValues = (DEFAULT_GOALS[role]||{})[period] || {};
                
                // Process each metric
                for (const metric in goalValues) {
                    const target = Number(goalValues[metric]||0);
                    const goalKey = `${role}|${metric}|${period}|${ym}`;
                    
                    // Check if this role-based goal already exists
                    if (existingGoalsMap.has(goalKey)) {
                        console.log(`Goal already exists: ${role} - ${metric} - ${period}`);
                        skippedCount++;
                        continue;
                    }
                    
                    // Create the role-based goal
                    try {
                        const newGoal = {
                            role: role,
                            metric: metric,
                            period: period,
                            target: target,
                            month: ym,
                            weeks: 4
                        };
                        
                        await API.createGoal(newGoal);
                        console.log(`✅ Restored goal: ${role} - ${metric} - ${period} (target: ${target})`);
                        restoredCount++;
                        
                    } catch (error) {
                        console.error(`❌ Failed to restore goal: ${role} - ${metric} - ${period}`, error);
                        errorCount++;
                    }
                }
            }
        }
        
        // Now apply role-based goals to users who don't have any goals
        console.log('\nApplying goals to users...');
        
        // Get all users
        const usersResponse = await API.getUsers();
        const users = usersResponse.data || [];
        
        let userGoalsCreated = 0;
        
        for (const user of users) {
            // Skip admin users and inactive users
            if (user.platformRole === 'admin' || !user.isActive) {
                console.log(`Skipping user ${user.name} (admin or inactive)`);
                continue;
            }
            
            const userRole = user.role;
            if (!userRole || (userRole !== 'ae' && userRole !== 'am')) {
                console.log(`Skipping user ${user.name} (invalid role: ${userRole})`);
                continue;
            }
            
            console.log(`Processing user: ${user.name} (${userRole})`);
            
            // Check if user has any goals
            const userGoals = existingGoals.filter(g => g.userId === user.id);
            
            if (userGoals.length === 0) {
                console.log(`User ${user.name} has no goals - will use role-based defaults`);
                // User will automatically use role-based goals through the getEffectiveGoalForUser function
                userGoalsCreated++;
            } else {
                console.log(`User ${user.name} has ${userGoals.length} existing goals`);
            }
        }
        
        // Summary
        const summary = {
            restoredCount,
            skippedCount,
            errorCount,
            userGoalsCreated,
            totalGoals: existingGoals.length + restoredCount
        };
        
        console.log('\n=== Goal Restoration Summary ===');
        console.log(`✅ Goals Restored: ${restoredCount}`);
        console.log(`⏭️ Goals Skipped (already exist): ${skippedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`👥 Users set to use role defaults: ${userGoalsCreated}`);
        console.log(`📊 Total Goals in System: ${summary.totalGoals}`);
        
        return summary;
        
    } catch (error) {
        console.error('Error in goal restoration process:', error);
        throw error;
    }
}

/**
 * Verify goals are properly set for all users
 * This function checks that all users have access to goals
 * either through role-based or individual settings
 */
async function verifyGoalsForAllUsers() {
    console.log('Verifying goals for all users...');
    
    try {
        const usersResponse = await API.getUsers();
        const users = usersResponse.data || [];
        
        const verification = {
            usersWithGoals: [],
            usersWithoutGoals: [],
            details: []
        };
        
        for (const user of users) {
            // Skip admin users
            if (user.platformRole === 'admin') {
                continue;
            }
            
            const userRole = user.role;
            if (!userRole || (userRole !== 'ae' && userRole !== 'am')) {
                continue;
            }
            
            // Check a sample metric to verify goals are working
            const sampleMetric = 'callsMade';
            const weeklyGoal = await getEffectiveGoalForUser(user.id, sampleMetric, 'week');
            const monthlyGoal = await getEffectiveGoalForUser(user.id, sampleMetric, 'month');
            
            const hasGoals = weeklyGoal && weeklyGoal.value > 0;
            
            const userDetail = {
                userId: user.id,
                userName: user.name,
                role: userRole,
                hasGoals: hasGoals,
                weeklyCallsGoal: weeklyGoal ? weeklyGoal.value : 0,
                monthlyCallsGoal: monthlyGoal ? monthlyGoal.value : 0,
                goalType: weeklyGoal ? weeklyGoal.type : 'none'
            };
            
            verification.details.push(userDetail);
            
            if (hasGoals) {
                verification.usersWithGoals.push(user.name);
            } else {
                verification.usersWithoutGoals.push(user.name);
            }
        }
        
        console.log('\n=== Goal Verification Summary ===');
        console.log(`✅ Users with goals: ${verification.usersWithGoals.length}`);
        console.log(`❌ Users without goals: ${verification.usersWithoutGoals.length}`);
        
        if (verification.usersWithoutGoals.length > 0) {
            console.log('\nUsers without goals:');
            verification.usersWithoutGoals.forEach(name => console.log(`  - ${name}`));
        }
        
        console.log('\nDetailed Verification:');
        verification.details.forEach(detail => {
            const goalStatus = detail.hasGoals ? '✅' : '❌';
            console.log(`${goalStatus} ${detail.userName} (${detail.role}): Weekly=${detail.weeklyCallsGoal}, Monthly=${detail.monthlyCallsGoal}, Type=${detail.goalType}`);
        });
        
        return verification;
        
    } catch (error) {
        console.error('Error verifying goals:', error);
        throw error;
    }
}

/**
 * Clear all goals (use with caution!)
 * This is only for testing purposes
 */
async function clearAllGoals() {
    if (!confirm('⚠️ WARNING: This will delete ALL goals in the system. Are you absolutely sure?')) {
        return;
    }
    
    try {
        const goalsResponse = await API.getGoals();
        const goals = goalsResponse.data || [];
        
        let deletedCount = 0;
        for (const goal of goals) {
            try {
                await API.deleteGoal(goal.id);
                deletedCount++;
            } catch (error) {
                console.error(`Failed to delete goal ${goal.id}:`, error);
            }
        }
        
        console.log(`Deleted ${deletedCount} goals`);
        return deletedCount;
        
    } catch (error) {
        console.error('Error clearing goals:', error);
        throw error;
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.restoreDefaultGoals = restoreDefaultGoals;
    window.verifyGoalsForAllUsers = verifyGoalsForAllUsers;
    window.clearAllGoals = clearAllGoals;
}

// Also export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        restoreDefaultGoals,
        verifyGoalsForAllUsers,
        clearAllGoals,
        DEFAULT_GOALS
    };
}