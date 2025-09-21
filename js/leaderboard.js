// Leaderboard Management Functions

let currentLeaderboardView = null; // Will be set based on user role
let currentLeaderboardPeriod = 'all';

// Default metric weights (can be customized by admin)
let metricWeights = {
    // Common metrics for both AE and AM
    callsMade: 5,
    emailsSent: 2,
    linkedinMessages: 3,
    vidyardVideos: 4,
    meetingsBooked: 10,
    successfulContacts: 8,
    meetingsConducted: 15,
    opportunitiesGenerated: 20,
    referralsGenerated: 25,
    pipelineGenerated: 0.001,
    revenueClosed: 0.002,
    
    // AE specific
    abmCampaigns: 4,
    proposalsSent: 12,
    
    // AM specific - per category
    accountsTargeted: 3,
    dormantAbmCampaigns: 6,
    crossSellAbmCampaigns: 8,
    upSellAbmCampaigns: 10,
    generalAbmCampaigns: 5
};

// Load saved weights from localStorage
function loadMetricWeights() {
    const saved = localStorage.getItem('metricWeights');
    if (saved) {
        metricWeights = JSON.parse(saved);
    }
}

// Display metric weights for admin
function displayMetricWeights() {
    const container = document.getElementById('metric-weights-display');
    
    if (!container) return;
    
    // Only allow admins to see/edit weights
    if (currentUser.platformRole !== 'admin') {
        container.innerHTML = '<p class="text-red-500">Access denied. Admin privileges required.</p>';
        return;
    }
    
    const metricLabels = {
        // Common metrics
        callsMade: 'Calls Made',
        emailsSent: 'Emails Sent',
        linkedinMessages: 'LinkedIn Messages',
        vidyardVideos: 'Vidyard Videos',
        meetingsBooked: 'Meetings Booked',
        successfulContacts: 'Successful Contacts',
        meetingsConducted: 'Meetings Conducted',
        opportunitiesGenerated: 'Opportunities',
        referralsGenerated: 'Referrals',
        pipelineGenerated: 'Pipeline Generated',
        revenueClosed: 'Revenue Closed',
        
        // AE specific
        abmCampaigns: 'ABM Campaigns (AE)',
        proposalsSent: 'Proposals Sent (AE)',
        
        // AM specific
        accountsTargeted: 'Accounts Targeted (AM)',
        dormantAbmCampaigns: 'Dormant ABM (AM)',
        crossSellAbmCampaigns: 'Cross-Sell ABM (AM)',
        upSellAbmCampaigns: 'Up-Sell ABM (AM)',
        generalAbmCampaigns: 'General ABM (AM)'
    };
    
    let html = '';
    for (const [metric, weight] of Object.entries(metricWeights)) {
        if (metricLabels[metric]) {
            html += `
                <div class="bg-gray-50 rounded-lg p-3">
                    <label class="text-xs font-medium text-gray-600">${metricLabels[metric]}</label>
                    <div class="mt-1">
                        <input type="number" 
                               id="weight-${metric}" 
                               value="${weight}" 
                               step="${metric.includes('Closed') || metric.includes('Generated') ? '0.001' : '1'}"
                               class="w-full px-2 py-1 border border-gray-300 rounded text-sm weight-input"
                               disabled>
                        <span class="text-xs text-gray-500 mt-1 block">Points</span>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}

// Toggle weight editing
function toggleWeightingEdit() {
    const inputs = document.querySelectorAll('.weight-input');
    const editBtn = document.getElementById('edit-weights-btn');
    const saveButtons = document.getElementById('weight-save-buttons');
    
    const isEditing = !inputs[0]?.disabled;
    
    if (isEditing) {
        // Cancel editing
        cancelWeightingEdit();
    } else {
        // Enable editing
        inputs.forEach(input => input.disabled = false);
        editBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel';
        editBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        editBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
        saveButtons.classList.remove('hidden');
    }
}

// Cancel weight editing
function cancelWeightingEdit() {
    displayMetricWeights(); // Reset to saved values
    const editBtn = document.getElementById('edit-weights-btn');
    const saveButtons = document.getElementById('weight-save-buttons');
    
    editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Weights';
    editBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
    editBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    saveButtons.classList.add('hidden');
}

// Save metric weights
function saveMetricWeights() {
    const inputs = document.querySelectorAll('.weight-input');
    
    inputs.forEach(input => {
        const metric = input.id.replace('weight-', '');
        metricWeights[metric] = parseFloat(input.value) || 0;
    });
    
    // Save to localStorage
    localStorage.setItem('metricWeights', JSON.stringify(metricWeights));
    
    showAlert('Metric weights saved successfully!', 'success');
    cancelWeightingEdit();
    
    // Refresh leaderboard with new weights
    updateLeaderboard();
}

// Initialize leaderboard based on user role
function initializeLeaderboard() {
    // Load saved weights
    loadMetricWeights();
    // Get view buttons
    const aeButton = document.querySelector('[data-view="ae"]');
    const amButton = document.querySelector('[data-view="am"]');
    const allButton = document.querySelector('[data-view="all"]');
    
    // Set default view and button visibility based on user role
    if (currentUser.role === 'ae') {
        currentLeaderboardView = 'ae';
        // Hide AM view button for AE users
        if (amButton) amButton.style.display = 'none';
        // Show AE and All buttons
        if (aeButton) aeButton.style.display = '';
        if (allButton) allButton.style.display = '';
    } else if (currentUser.role === 'am') {
        currentLeaderboardView = 'am';
        // Hide AE view button for AM users
        if (aeButton) aeButton.style.display = 'none';
        // Show AM and All buttons
        if (amButton) amButton.style.display = '';
        if (allButton) allButton.style.display = '';
    } else if (currentUser.platformRole === 'admin' || currentUser.role === 'admin') {
        // Admin can see all views
        currentLeaderboardView = 'all';
        // Show all buttons
        if (aeButton) aeButton.style.display = '';
        if (amButton) amButton.style.display = '';
        if (allButton) allButton.style.display = '';
    } else {
        // Default to all sales view
        currentLeaderboardView = 'all';
    }
    
    // Set initial view
    setTimeout(() => {
        switchLeaderboardView(currentLeaderboardView);
    }, 100);
}

// Switch leaderboard view (AE, AM, All Sales)
function switchLeaderboardView(view) {
    // Check if user has permission to view this leaderboard
    if (currentUser.role === 'ae' && view === 'am') {
        showAlert('You can only view Account Executive and All Sales leaderboards', 'error');
        return;
    }
    if (currentUser.role === 'am' && view === 'ae') {
        showAlert('You can only view Account Manager and All Sales leaderboards', 'error');
        return;
    }
    
    currentLeaderboardView = view;
    
    // Update button states
    document.querySelectorAll('.leaderboard-view-btn').forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });
    
    // Show/hide AM category filter
    const amCategoryFilter = document.getElementById('am-category-filter');
    if (view === 'am') {
        amCategoryFilter?.classList.remove('hidden');
    } else {
        amCategoryFilter?.classList.add('hidden');
    }
    
    // Update metric filter options based on view
    updateMetricFilterOptions(view);
    
    // Reload leaderboard
    updateLeaderboard();
}

// Set leaderboard period
function setLeaderboardPeriod(period) {
    currentLeaderboardPeriod = period;
    
    // Update button states
    document.querySelectorAll('.leaderboard-period-btn').forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.add('bg-gray-600', 'text-white');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('bg-gray-600', 'text-white');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });
    
    // Reload leaderboard
    updateLeaderboard();
}

// Update metric filter options based on view
function updateMetricFilterOptions(view) {
    const metricFilter = document.getElementById('leaderboard-metric-filter');
    if (!metricFilter) return;
    
    // Clear and rebuild options based on view
    if (view === 'ae') {
        metricFilter.innerHTML = `
            <option value="all">All Metrics</option>
            <optgroup label="Sales Activities">
                <option value="callsMade">Calls Made</option>
                <option value="emailsSent">Emails Sent</option>
                <option value="linkedinMessages">LinkedIn Messages</option>
                <option value="vidyardVideos">Vidyard Videos Sent</option>
                <option value="abmCampaigns">ABM Campaigns</option>
            </optgroup>
            <optgroup label="Sales Results">
                <option value="meetingsBooked">Meetings Booked</option>
                <option value="successfulContacts">Successful Contacts</option>
                <option value="meetingsConducted">Meetings Conducted</option>
                <option value="opportunitiesGenerated">Opportunities</option>
                <option value="referralsGenerated">Referrals Generated</option>
            </optgroup>
            <optgroup label="Financial">
                <option value="pipelineGenerated">Pipeline Generated</option>
                <option value="revenueClosed">Revenue Closed</option>
            </optgroup>
        `;
    } else if (view === 'am') {
        metricFilter.innerHTML = `
            <option value="all">All Metrics</option>
            <optgroup label="Sales Activities">
                <option value="accountsTargeted">Accounts Targeted</option>
                <option value="callsMade">Calls Made</option>
                <option value="emailsSent">Emails Sent</option>
                <option value="linkedinMessages">LinkedIn Messages</option>
                <option value="vidyardVideos">Vidyard Videos Sent</option>
                <option value="generalAbmCampaigns">General ABM</option>
                <option value="dormantAbmCampaigns">Dormant ABM</option>
                <option value="crossSellAbmCampaigns">Cross-Sell ABM</option>
                <option value="upSellAbmCampaigns">Up-Sell ABM</option>
            </optgroup>
            <optgroup label="Sales Results">
                <option value="meetingsBooked">Meetings Booked</option>
                <option value="successfulContacts">Successful Contacts</option>
                <option value="meetingsConducted">Meetings Conducted</option>
                <option value="opportunitiesGenerated">Opportunities</option>
                <option value="referralsGenerated">Referrals Generated</option>
            </optgroup>
            <optgroup label="Financial">
                <option value="pipelineGenerated">Pipeline Generated</option>
                <option value="revenueClosed">Revenue Closed</option>
            </optgroup>
        `;
    } else { // All Sales
        metricFilter.innerHTML = `
            <option value="all">All Metrics</option>
            <option value="callsMade">Calls Made</option>
            <option value="emailsSent">Emails Sent</option>
            <option value="linkedinMessages">LinkedIn Messages</option>
            <option value="vidyardVideos">Vidyard Videos Sent</option>
            <option value="meetingsBooked">Meetings Booked</option>
            <option value="successfulContacts">Successful Contacts</option>
            <option value="meetingsConducted">Meetings Conducted</option>
            <option value="referralsGenerated">Referrals Generated</option>
            <option value="pipelineGenerated">Pipeline Generated</option>
            <option value="revenueClosed">Revenue Closed</option>
        `;
    }
}

// Update leaderboard data
async function updateLeaderboard() {
    const selectedMetric = document.getElementById('leaderboard-metric-filter')?.value || 'all';
    const amCategory = document.getElementById('leaderboard-am-category')?.value || 'all';
    
    // Get all users and filter based on view
    const allUsers = await API.getUsers();
    let users = { data: [] };
    
    if (currentLeaderboardView === 'ae') {
        users.data = (allUsers.data || []).filter(u => u.role === 'ae');
    } else if (currentLeaderboardView === 'am') {
        users.data = (allUsers.data || []).filter(u => u.role === 'am');
    } else {
        // All sales - get both AE and AM
        users.data = (allUsers.data || []).filter(u => u.role === 'ae' || u.role === 'am');
    }
    
    // Calculate scores for each user
    const leaderboardData = [];
    for (const user of (users.data || [])) {
        const userData = await calculateUserScore(user, selectedMetric, amCategory);
        leaderboardData.push(userData);
    }
    
    // Sort by total score
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    
    // Update UI
    displayTop3(leaderboardData); // Pass all data, function will decide how many to show
    displayLeaderboardTable(leaderboardData);
    
    // Render charts
    renderLeaderboardCharts(leaderboardData);
}

// Calculate user score based on metrics
async function calculateUserScore(user, selectedMetric, amCategory) {
    const userData = {
        id: user.id,
        name: user.name,
        role: user.role,
        metrics: {},
        totalScore: 0
    };
    
    // Get date range based on period
    const dateRange = getDateRangeForPeriod(currentLeaderboardPeriod);
    
    if (user.role === 'am') {
        // For AMs, aggregate across categories
        const categories = amCategory === 'all' ? ['dormant', 'cross-sell', 'up-sell'] : [amCategory];
        
        // Get all activities and filter client-side
        const allActivities = await API.getActivities();
        
        for (const category of categories) {
            const activityType = `am_${category.replace('-', '_')}_summary`;
            
            // Filter activities client-side
            const activities = (allActivities.data || []).filter(a => 
                a.userId === user.id && 
                a.type === activityType
            );
            
            // Aggregate metrics
            for (const activity of activities) {
                for (const [key, value] of Object.entries(activity)) {
                    // Only include actual metric fields, exclude system fields
                    const systemFields = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt', 'gs_project_id', 
                                         'gs_table_name', 'deleted', 'userId', 'userName', 'week', 'type', 'category', 'date'];
                    const isMetricField = typeof value === 'number' && 
                                         !systemFields.includes(key) &&
                                         !key.startsWith('gs_') &&
                                         value < 1000000; // Exclude unreasonably large numbers (likely timestamps)
                    
                    if (isMetricField) {
                        userData.metrics[key] = (userData.metrics[key] || 0) + value;
                    }
                }
            }
        }
    } else {
        // For AEs, get ae_summary data
        const allActivities = await API.getActivities();
        
        // Filter activities client-side
        const activities = (allActivities.data || []).filter(a => 
            a.userId === user.id && 
            a.type === 'ae_summary'
        );
        
        // Aggregate metrics
        for (const activity of activities) {
            for (const [key, value] of Object.entries(activity)) {
                // Only include actual metric fields, exclude system fields
                const systemFields = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt', 'gs_project_id', 
                                     'gs_table_name', 'deleted', 'userId', 'userName', 'week', 'type', 'category', 'date'];
                const isMetricField = typeof value === 'number' && 
                                     !systemFields.includes(key) &&
                                     !key.startsWith('gs_') &&
                                     value < 1000000; // Exclude unreasonably large numbers (likely timestamps)
                
                if (isMetricField) {
                    userData.metrics[key] = (userData.metrics[key] || 0) + value;
                }
            }
        }
    }
    
    // Calculate total score
    if (selectedMetric === 'all') {
        // Use configurable metric weights
        for (const [metric, value] of Object.entries(userData.metrics)) {
            // Only apply weight if it's a known metric
            if (metricWeights[metric]) {
                userData.totalScore += (value || 0) * metricWeights[metric];
            }
        }
    } else {
        // Single metric score
        userData.totalScore = userData.metrics[selectedMetric] || 0;
    }
    
    return userData;
}

// Get date range for period filter
function getDateRangeForPeriod(period) {
    const now = new Date();
    const dateRange = {};
    
    switch (period) {
        case 'today':
            dateRange.startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            dateRange.startDate = weekStart;
            break;
        case 'month':
            dateRange.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        // 'all' returns no date filter
    }
    
    return dateRange;
}

// Display top performers (show all users for the selected role)
function displayTop3(topUsers) {
    const top3Container = document.getElementById('leaderboard-top3');
    if (!top3Container) return;
    
    // Determine how many to show based on current view
    let usersToShow = topUsers;
    
    // If showing specific role, show all users of that role
    // Otherwise show top 3 for "All Sales" view
    const displayCount = (currentLeaderboardView === 'all') ? 3 : topUsers.length;
    usersToShow = topUsers.slice(0, Math.min(displayCount, topUsers.length));
    
    // Update section title and subtitle
    const sectionTitle = document.getElementById('leaderboard-top-title');
    const sectionSubtitle = document.getElementById('leaderboard-top-subtitle');
    
    if (sectionTitle) {
        const titleText = currentLeaderboardView === 'all' ? 
            'Top 3 Performers' : 
            `All ${currentLeaderboardView === 'ae' ? 'Account Executives' : 'Account Managers'} Rankings`;
        sectionTitle.textContent = titleText;
    }
    
    if (sectionSubtitle) {
        const subtitleText = currentLeaderboardView === 'all' ? 
            'Showing top 3 across all sales roles' : 
            `Showing all ${usersToShow.length} ${currentLeaderboardView === 'ae' ? 'Account Executives' : 'Account Managers'}`;
        sectionSubtitle.textContent = subtitleText;
    }
    
    const medals = [
        { place: '1st', icon: 'fa-trophy', gradient: 'from-yellow-400 to-yellow-600' },
        { place: '2nd', icon: 'fa-medal', gradient: 'from-gray-400 to-gray-600' },
        { place: '3rd', icon: 'fa-award', gradient: 'from-orange-700 to-orange-900' }
    ];
    
    // For positions beyond 3rd place
    const getPlaceInfo = (index) => {
        if (index < 3) return medals[index];
        return {
            place: `${index + 1}th`,
            icon: 'fa-certificate',
            gradient: 'from-indigo-500 to-indigo-700'
        };
    };
    
    // Generate HTML for top performers
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    usersToShow.forEach((user, index) => {
        const placeInfo = getPlaceInfo(index);
        const selectedMetric = document.getElementById('leaderboard-metric-filter')?.value || 'all';
        const displayValue = selectedMetric === 'all' ? 
            Math.round(user.totalScore) : 
            formatMetricValue(selectedMetric, user.metrics[selectedMetric]);
        
        html += `
            <div class="bg-gradient-to-br ${placeInfo.gradient} rounded-lg shadow-lg p-4 text-white">
                <div class="text-center">
                    <i class="fas ${placeInfo.icon} text-3xl mb-2"></i>
                    <h3 class="text-lg font-bold mb-1">${placeInfo.place} Place</h3>
                    <p class="text-xl font-bold mb-1">${user.name}</p>
                    <p class="text-sm mb-2">${user.role === 'ae' ? 'Account Executive' : 'Account Manager'}</p>
                    <div class="bg-white bg-opacity-20 rounded-lg p-2">
                        <p class="text-lg font-bold">${displayValue}</p>
                        <p class="text-xs">${selectedMetric === 'all' ? 'Total Score' : getMetricLabel(selectedMetric)}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    top3Container.innerHTML = html || '<div class="text-center text-gray-500 py-8">No data available for the selected period</div>';
}

// Display leaderboard table
function displayLeaderboardTable(users) {
    const header = document.getElementById('leaderboard-header');
    const tbody = document.getElementById('leaderboard-table');
    
    if (!header || !tbody) return;
    
    // Build header based on view
    let headerHTML = '<tr class="border-b">';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Rank</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>';
    
    if (currentLeaderboardView === 'am') {
        headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Accounts</th>';
    }
    
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Calls</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Emails</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">LinkedIn</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Vidyard</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Meetings</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Pipeline</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>';
    headerHTML += '<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Score</th>';
    headerHTML += '</tr>';
    
    header.innerHTML = headerHTML;
    
    // Build table rows
    tbody.innerHTML = users.map((user, index) => {
        let rowHTML = `<tr class="border-b hover:bg-gray-50">`;
        rowHTML += `<td class="py-3 px-4">`;
        
        // Add medal for top 3
        if (index === 0) {
            rowHTML += '<i class="fas fa-trophy text-yellow-500 mr-2"></i>';
        } else if (index === 1) {
            rowHTML += '<i class="fas fa-medal text-gray-500 mr-2"></i>';
        } else if (index === 2) {
            rowHTML += '<i class="fas fa-award text-orange-700 mr-2"></i>';
        }
        
        rowHTML += `${index + 1}</td>`;
        rowHTML += `<td class="py-3 px-4 font-medium">${user.name}</td>`;
        rowHTML += `<td class="py-3 px-4">${user.role === 'ae' ? 'AE' : 'AM'}</td>`;
        
        if (currentLeaderboardView === 'am') {
            rowHTML += `<td class="py-3 px-4">${user.metrics.accountsTargeted || 0}</td>`;
        }
        
        rowHTML += `<td class="py-3 px-4">${user.metrics.callsMade || 0}</td>`;
        rowHTML += `<td class="py-3 px-4">${user.metrics.emailsSent || 0}</td>`;
        rowHTML += `<td class="py-3 px-4">${user.metrics.linkedinMessages || 0}</td>`;
        rowHTML += `<td class="py-3 px-4">${user.metrics.vidyardVideos || 0}</td>`;
        rowHTML += `<td class="py-3 px-4">${user.metrics.meetingsConducted || 0}</td>`;
        rowHTML += `<td class="py-3 px-4">$${formatCurrency(user.metrics.pipelineGenerated || 0)}</td>`;
        rowHTML += `<td class="py-3 px-4">$${formatCurrency(user.metrics.revenueClosed || 0)}</td>`;
        rowHTML += `<td class="py-3 px-4 font-bold">${Math.round(user.totalScore)}</td>`;
        rowHTML += '</tr>';
        
        return rowHTML;
    }).join('');
}

// Format metric value for display
function formatMetricValue(metric, value) {
    if (metric.includes('pipeline') || metric.includes('revenue')) {
        return `$${formatCurrency(value || 0)}`;
    }
    return value || 0;
}

// Get metric label
function getMetricLabel(metric) {
    const labels = {
        calls_made: 'Calls Made',
        emails_sent: 'Emails Sent',
        linkedin_messages: 'LinkedIn Messages',
        meetings_booked: 'Meetings Booked',
        successful_contacts: 'Successful Contacts',
        meetings_conducted: 'Meetings Conducted',
        opportunities_created: 'Opportunities',
        pipeline_generated: 'Pipeline Generated',
        revenue_closed: 'Revenue Closed',
        accounts_targeted: 'Accounts Targeted',
        general_abm_campaigns: 'General ABM',
        dormant_abm_campaigns: 'Dormant ABM',
        cross_sell_abm_campaigns: 'Cross-Sell ABM',
        up_sell_abm_campaigns: 'Up-Sell ABM'
    };
    
    return labels[metric] || metric;
}

// Render leaderboard charts
async function renderLeaderboardCharts(users) {
    // Render trend chart
    await renderTrendChart(users);
    
    // Render distribution chart
    renderDistributionChart(users);
}

// Render performance trend chart with real historical data
async function renderTrendChart(users) {
    const ctx = document.getElementById('leaderboard-trend-chart');
    if (!ctx) return;
    
    // Get top 5 users for trend
    const topUsers = users.slice(0, 5);
    
    // Destroy existing chart if any
    if (window.leaderboardTrendChart) {
        window.leaderboardTrendChart.destroy();
    }
    
    // Generate real trend data for the last 5 weeks
    const datasets = [];
    
    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const trendData = await generateRealTrendData(user);
        
        datasets.push({
            label: user.name,
            data: trendData,
            borderColor: getChartColor(i),
            backgroundColor: getChartColor(i, 0.1),
            tension: 0.4
        });
    }
    
    // Get week labels for the last 5 weeks
    const weekLabels = [];
    for (let i = 4; i >= 0; i--) {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const weekStr = getWeekString(weekDate);
        weekLabels.push(`W${weekStr.split('W')[1]}`);
    }
    
    window.leaderboardTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Performance Score'
                    }
                }
            }
        }
    });
}

// Render metric distribution chart
function renderDistributionChart(users) {
    const ctx = document.getElementById('leaderboard-distribution-chart');
    if (!ctx) return;
    
    // Aggregate metrics across all users
    const metrics = {
        'Calls': 0,
        'Emails': 0,
        'LinkedIn': 0,
        'Vidyard': 0,
        'Meetings': 0,
        'Opportunities': 0
    };
    
    users.forEach(user => {
        metrics['Calls'] += user.metrics.callsMade || 0;
        metrics['Emails'] += user.metrics.emailsSent || 0;
        metrics['LinkedIn'] += user.metrics.linkedinMessages || 0;
        metrics['Vidyard'] += user.metrics.vidyardVideos || 0;
        metrics['Meetings'] += user.metrics.meetingsConducted || 0;
        metrics['Opportunities'] += user.metrics.opportunitiesGenerated || 0;
    });
    
    // Destroy existing chart if any
    if (window.leaderboardDistributionChart) {
        window.leaderboardDistributionChart.destroy();
    }
    
    window.leaderboardDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(metrics),
            datasets: [{
                data: Object.values(metrics),
                backgroundColor: [
                    '#3B82F6', // Blue - Calls
                    '#10B981', // Green - Emails
                    '#0077B5', // LinkedIn Blue
                    '#FF6B6B', // Vidyard Red
                    '#8B5CF6', // Purple - Meetings
                    '#F59E0B'  // Yellow - Opportunities
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: false
                }
            }
        }
    });
}

// Generate real trend data from historical activities
async function generateRealTrendData(user) {
    const data = [];
    const allActivities = await API.getActivities();
    
    // Get last 5 weeks of data
    for (let i = 4; i >= 0; i--) {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const weekStr = getWeekString(weekDate);
        
        // Filter activities for this user and week
        let weekScore = 0;
        
        if (user.role === 'ae') {
            const weekActivities = (allActivities.data || []).filter(a => 
                a.userId === user.id && 
                a.type === 'ae_summary' && 
                a.week === weekStr
            );
            
            if (weekActivities.length > 0) {
                weekScore = calculateScoreFromActivity(weekActivities[0]);
            }
        } else if (user.role === 'am') {
            // For AM, aggregate across all categories
            const categories = ['dormant', 'cross-sell', 'up-sell'];
            for (const category of categories) {
                const activityType = `am_${category.replace('-', '_')}_summary`;
                const weekActivities = (allActivities.data || []).filter(a => 
                    a.userId === user.id && 
                    a.type === activityType && 
                    a.week === weekStr
                );
                
                if (weekActivities.length > 0) {
                    weekScore += calculateScoreFromActivity(weekActivities[0]);
                }
            }
        }
        
        data.push(Math.round(weekScore));
    }
    
    return data;
}

// Calculate score from a single activity record
function calculateScoreFromActivity(activity) {
    let score = 0;
    
    // Calculate weighted score based on metrics
    score += (activity.callsMade || 0) * (metricWeights.callsMade || 5);
    score += (activity.emailsSent || 0) * (metricWeights.emailsSent || 2);
    score += (activity.linkedinMessages || 0) * (metricWeights.linkedinMessages || 3);
    score += (activity.vidyardVideos || 0) * (metricWeights.vidyardVideos || 4);
    score += (activity.meetingsBooked || 0) * (metricWeights.meetingsBooked || 10);
    score += (activity.meetingsConducted || 0) * (metricWeights.meetingsConducted || 15);
    score += (activity.opportunitiesGenerated || 0) * (metricWeights.opportunitiesGenerated || 20);
    score += (activity.referralsGenerated || 0) * (metricWeights.referralsGenerated || 25);
    score += (activity.pipelineGenerated || 0) * (metricWeights.pipelineGenerated || 0.001);
    
    return score;
}

// Helper function to get week string
function getWeekString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const pastDaysOfYear = (d - firstDay) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Get chart color
function getChartColor(index, alpha = 1) {
    const colors = [
        `rgba(59, 130, 246, ${alpha})`,   // Blue
        `rgba(34, 197, 94, ${alpha})`,    // Green
        `rgba(168, 85, 247, ${alpha})`,   // Purple
        `rgba(251, 146, 60, ${alpha})`,   // Orange
        `rgba(236, 72, 153, ${alpha})`    // Pink
    ];
    return colors[index % colors.length];
}

// Format currency helper
function formatCurrency(amount) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}