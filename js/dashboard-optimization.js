// Dashboard Optimization Module
// Improves performance for all dashboard views

// Optimized dashboard update with batching and caching
async function updateDashboardOptimized(role, category = null) {
    const periodSelector = document.getElementById(`${role}-dashboard-period`);
    const selectedWeek = periodSelector ? periodSelector.value : getCurrentWeek();
    const previousWeek = getPreviousWeek(selectedWeek);
    
    // Show loading state immediately for better UX
    showDashboardLoading(role, category);
    
    try {
        // Determine activity type
        let activityType = '';
        if (role === 'ae') {
            activityType = 'ae_summary';
        } else if (role === 'am' && category) {
            activityType = `am_${category.replace('-', '_')}_summary`;
        }
        
        // Fetch both weeks' data in parallel (major performance improvement)
        const [currentData, previousData, goals] = await Promise.all([
            getCachedActivities({
                userId: currentUser.id,
                week: selectedWeek,
                type: activityType
            }),
            getCachedActivities({
                userId: currentUser.id,
                week: previousWeek,
                type: activityType
            }),
            API.getGoals() // Get goals for percentage calculation
        ]);
        
        // Process data
        const currentValues = currentData.data && currentData.data.length > 0 ? currentData.data[0] : {};
        const previousValues = previousData.data && previousData.data.length > 0 ? previousData.data[0] : {};
        
        // Update all metrics at once (batch DOM updates for performance)
        updateMetricsBatch(role, category, currentValues, previousValues, goals);
        
        // Update charts if they exist
        if (typeof updateAECharts === 'function' && role === 'ae') {
            setTimeout(() => updateAECharts(), 100);
        }
        if (typeof updateAMCharts === 'function' && role === 'am') {
            setTimeout(() => updateAMCharts(category), 100);
        }
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
        showDashboardError(role, category, error.message);
    } finally {
        hideDashboardLoading(role, category);
    }
}

// Batch update metrics (reduces DOM reflows)
function updateMetricsBatch(role, category, currentValues, previousValues, goals) {
    const prefix = category ? `${role}-${category}` : role;
    
    // Define all metrics
    const metrics = getMetricsConfig(role);
    
    // Build updates in memory first
    const updates = [];
    
    metrics.forEach(metric => {
        const currentValue = currentValues[metric.field] || 0;
        const previousValue = previousValues[metric.field] || 0;
        
        // Calculate trend
        let trendPercent = 0;
        let trendIcon = 'fa-minus';
        let trendColor = 'text-gray-400';
        
        if (previousValue > 0) {
            trendPercent = ((currentValue - previousValue) / previousValue * 100).toFixed(1);
            if (trendPercent > 0) {
                trendIcon = 'fa-arrow-up';
                trendColor = 'text-green-600';
            } else if (trendPercent < 0) {
                trendIcon = 'fa-arrow-down';
                trendColor = 'text-red-600';
            }
        } else if (currentValue > 0) {
            trendIcon = 'fa-arrow-up';
            trendColor = 'text-green-600';
            trendPercent = '100';
        }
        
        updates.push({
            id: metric.id,
            value: currentValue,
            previousValue: previousValue,
            trendIcon: trendIcon,
            trendColor: trendColor,
            trendPercent: trendPercent,
            isCurrency: metric.isCurrency
        });
    });
    
    // Apply all updates at once
    requestAnimationFrame(() => {
        updates.forEach(update => {
            const valueEl = document.getElementById(`${prefix}-${update.id}-value`);
            const prevEl = document.getElementById(`${prefix}-${update.id}-prev`);
            const trendEl = document.getElementById(`${prefix}-${update.id}-trend`);
            
            if (valueEl) {
                valueEl.textContent = update.isCurrency ? 
                    `$${formatCurrency(update.value)}` : 
                    update.value.toLocaleString();
            }
            
            if (prevEl) {
                prevEl.textContent = `vs ${update.previousValue} last week`;
            }
            
            if (trendEl) {
                trendEl.className = `fas ${update.trendIcon} ${update.trendColor}`;
                trendEl.setAttribute('title', `${update.trendPercent}% change`);
            }
        });
    });
}

// Get metrics configuration
function getMetricsConfig(role) {
    if (role === 'ae') {
        return [
            { id: 'calls', field: 'callsMade', label: 'Calls Made' },
            { id: 'emails', field: 'emailsSent', label: 'Emails Sent' },
            { id: 'linkedin', field: 'linkedinMessages', label: 'LinkedIn Messages' },
            { id: 'vidyard', field: 'vidyardVideos', label: 'Vidyard Videos' },
            { id: 'abm', field: 'abmCampaigns', label: 'ABM Campaigns' },
            { id: 'meetings-booked', field: 'meetingsBooked', label: 'Meetings Booked' },
            { id: 'contacts', field: 'successfulContacts', label: 'Successful Contacts' },
            { id: 'meetings-conducted', field: 'meetingsConducted', label: 'Meetings Conducted' },
            { id: 'opportunities', field: 'opportunitiesGenerated', label: 'Opportunities' },
            { id: 'referrals', field: 'referralsGenerated', label: 'Referrals' },
            { id: 'pipeline', field: 'pipelineGenerated', label: 'Pipeline', isCurrency: true },
            { id: 'revenue', field: 'revenueClosed', label: 'Revenue', isCurrency: true }
        ];
    } else if (role === 'am') {
        return [
            { id: 'accounts', field: 'accountsTargeted', label: 'Accounts Targeted' },
            { id: 'calls', field: 'callsMade', label: 'Calls Made' },
            { id: 'emails', field: 'emailsSent', label: 'Emails Sent' },
            { id: 'linkedin', field: 'linkedinMessages', label: 'LinkedIn Messages' },
            { id: 'vidyard', field: 'vidyardVideos', label: 'Vidyard Videos' },
            { id: 'meetings-booked', field: 'meetingsBooked', label: 'Meetings Booked' },
            { id: 'contacts', field: 'successfulContacts', label: 'Successful Contacts' },
            { id: 'meetings-conducted', field: 'meetingsConducted', label: 'Meetings Conducted' },
            { id: 'opportunities', field: 'opportunitiesGenerated', label: 'Opportunities' },
            { id: 'referrals', field: 'referralsGenerated', label: 'Referrals' },
            { id: 'pipeline', field: 'pipelineGenerated', label: 'Pipeline', isCurrency: true },
            { id: 'revenue', field: 'revenueClosed', label: 'Revenue', isCurrency: true }
        ];
    }
    return [];
}

// Show loading state
function showDashboardLoading(role, category) {
    const prefix = category ? `${role}-${category}` : role;
    const container = document.getElementById(`${prefix}-dashboard-content`);
    
    if (container && !container.querySelector('.loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10';
        overlay.innerHTML = '<i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>';
        container.style.position = 'relative';
        container.appendChild(overlay);
    }
}

// Hide loading state
function hideDashboardLoading(role, category) {
    const prefix = category ? `${role}-${category}` : role;
    const container = document.getElementById(`${prefix}-dashboard-content`);
    const overlay = container?.querySelector('.loading-overlay');
    
    if (overlay) {
        overlay.remove();
    }
}

// Show error state
function showDashboardError(role, category, message) {
    const prefix = category ? `${role}-${category}` : role;
    const container = document.getElementById(`${prefix}-dashboard-content`);
    
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-4 mb-4';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
                <div>
                    <p class="text-red-800 font-semibold">Error loading dashboard</p>
                    <p class="text-red-600 text-sm">${message}</p>
                </div>
            </div>
        `;
        container.insertBefore(errorDiv, container.firstChild);
        
        // Remove error after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Optimized leaderboard loading
async function loadLeaderboardOptimized() {
    const leaderboardSection = document.getElementById('leaderboard-content');
    if (!leaderboardSection) return;
    
    // Show loading state
    leaderboardSection.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">Loading leaderboard...</p>
            </div>
        </div>
    `;
    
    try {
        // Load data with caching
        const [users, activities, goals] = await Promise.all([
            getCachedUsers(),
            API.getActivities({ limit: 1000 }),
            API.getGoals()
        ]);
        
        // Process leaderboard data
        const leaderboardData = processLeaderboardData(users.data, activities.data, goals.data);
        
        // Render leaderboard
        renderLeaderboard(leaderboardData);
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardSection.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-red-600 text-3xl mb-3"></i>
                <p class="text-red-800 font-semibold">Error loading leaderboard</p>
                <p class="text-red-600 text-sm mt-2">${error.message}</p>
                <button onclick="loadLeaderboardOptimized()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    <i class="fas fa-redo mr-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// Process leaderboard data
function processLeaderboardData(users, activities, goals) {
    const currentWeek = getCurrentWeek();
    const leaderboardData = [];
    
    users.forEach(user => {
        if (user.role === 'ae' || user.role === 'am') {
            const userActivities = activities.filter(a => 
                a.userId === user.id && 
                a.week === currentWeek &&
                !a.deleted
            );
            
            let totalPoints = 0;
            let metrics = {
                calls: 0,
                emails: 0,
                meetings: 0,
                pipeline: 0
            };
            
            userActivities.forEach(activity => {
                metrics.calls += activity.callsMade || 0;
                metrics.emails += activity.emailsSent || 0;
                metrics.meetings += activity.meetingsBooked || 0;
                metrics.pipeline += activity.pipelineGenerated || 0;
                
                // Calculate points
                totalPoints += (activity.callsMade || 0) * 1;
                totalPoints += (activity.emailsSent || 0) * 0.5;
                totalPoints += (activity.meetingsBooked || 0) * 10;
                totalPoints += (activity.pipelineGenerated || 0) * 0.001;
            });
            
            leaderboardData.push({
                user: user,
                metrics: metrics,
                points: totalPoints
            });
        }
    });
    
    // Sort by points
    leaderboardData.sort((a, b) => b.points - a.points);
    
    return leaderboardData;
}

// Render leaderboard
function renderLeaderboard(data) {
    const leaderboardSection = document.getElementById('leaderboard-content');
    if (!leaderboardSection) return;
    
    // Render using existing leaderboard display logic
    if (typeof displayLeaderboard === 'function') {
        displayLeaderboard(data);
    }
}

// Replace slow functions with optimized versions
if (typeof window !== 'undefined') {
    // Store original functions
    window._originalUpdateAEDashboard = window.updateAEDashboard;
    window._originalLoadLeaderboard = window.loadLeaderboard;
    
    // Replace with optimized versions
    window.updateAEDashboard = function() {
        return updateDashboardOptimized('ae');
    };
    
    window.updateAMDashboard = function(category) {
        return updateDashboardOptimized('am', category);
    };
    
    window.loadLeaderboard = loadLeaderboardOptimized;
}