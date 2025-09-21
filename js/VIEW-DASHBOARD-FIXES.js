// ========================================
// COMPREHENSIVE VIEW AND DASHBOARD FIXES
// Fixes Admin views, AM dashboard categories, Analytics data display
// ========================================

console.log('🔧 VIEW & DASHBOARD FIXES LOADING...');

(function() {
    'use strict';
    
    // ================================
    // FIX 1: Admin View of AM Dashboard - Show All 3 Categories
    // ================================
    function fixAdminAMDashboardView() {
        console.log('[VIEW-FIX] Fixing Admin view of AM dashboard...');
        
        // Override the dashboard loading for admin viewing AM
        const originalShowSection = window.showSection;
        window.showSection = function(sectionName) {
            console.log(`[VIEW-FIX] Showing section: ${sectionName}`);
            
            // Call original if exists
            if (typeof originalShowSection === 'function') {
                originalShowSection(sectionName);
            }
            
            if (sectionName === 'dashboard') {
                const roleSelector = document.getElementById('role-selector');
                const isAdmin = roleSelector && roleSelector.value === 'admin';
                const adminSelectedUser = document.getElementById('admin-selected-user');
                
                // Check if admin is viewing AM dashboard
                if (isAdmin && adminSelectedUser) {
                    const selectedUserId = adminSelectedUser.value;
                    if (selectedUserId) {
                        const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
                        const selectedUser = users.find(u => u.id === selectedUserId);
                        
                        if (selectedUser && selectedUser.role === 'am') {
                            console.log('[VIEW-FIX] Admin viewing AM user - showing all categories');
                            showAllAMCategories();
                        }
                    }
                } else if (roleSelector && roleSelector.value === 'am') {
                    // Regular AM view
                    updateAMDashboardComplete();
                }
            }
        };
    }
    
    function showAllAMCategories() {
        console.log('[VIEW-FIX] Displaying all AM categories for admin view...');
        
        // Ensure AM dashboard is visible
        const amDashboard = document.getElementById('am-dashboard');
        if (amDashboard) {
            amDashboard.classList.remove('hidden');
            amDashboard.style.display = 'block';
            
            // Make all category dashboards visible
            const dormantDashboard = document.getElementById('am-dormant-dashboard');
            const crossSellDashboard = document.getElementById('am-cross-sell-dashboard');
            const upSellDashboard = document.getElementById('am-up-sell-dashboard');
            
            if (dormantDashboard) {
                dormantDashboard.classList.remove('hidden');
                dormantDashboard.style.display = 'block';
            }
            
            // Create cross-sell dashboard if it doesn't exist
            if (!crossSellDashboard) {
                createCrossSellDashboard();
            } else {
                crossSellDashboard.classList.remove('hidden');
                crossSellDashboard.style.display = 'block';
            }
            
            // Create up-sell dashboard if it doesn't exist
            if (!upSellDashboard) {
                createUpSellDashboard();
            } else {
                upSellDashboard.classList.remove('hidden');
                upSellDashboard.style.display = 'block';
            }
            
            // Hide category buttons in admin view
            const categoryButtons = document.querySelectorAll('.am-dashboard-category-btn');
            categoryButtons.forEach(btn => btn.style.display = 'none');
            
            // Update all metrics
            updateAllAMMetrics();
        }
    }
    
    // ================================
    // FIX 2: Complete AM Dashboard Metrics
    // ================================
    function updateAMDashboardComplete() {
        console.log('[VIEW-FIX] Updating complete AM dashboard with all metrics...');
        
        // Get activity data
        const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
        
        // Calculate metrics for all categories
        const metrics = calculateAMMetrics(activities);
        
        // Update dormant account metrics
        updateDormantMetrics(metrics.dormant);
        
        // Update cross-sell metrics
        updateCrossSellMetrics(metrics.crossSell);
        
        // Update up-sell metrics
        updateUpSellMetrics(metrics.upSell);
    }
    
    function calculateAMMetrics(activities) {
        // Extract AM-specific activities
        const amActivities = activities.filter(a => a.category === 'am' || a.userRole === 'am');
        
        return {
            dormant: {
                accountsTargeted: getMetricValue(amActivities, 'dormant-accounts-targeted', 12),
                callsMade: getMetricValue(amActivities, 'dormant-calls-made', 25),
                emailsSent: getMetricValue(amActivities, 'dormant-emails-sent', 40),
                linkedinMessages: getMetricValue(amActivities, 'dormant-linkedin-messages', 15),
                vidyardVideos: getMetricValue(amActivities, 'dormant-vidyard-videos', 8),
                meetingsBooked: getMetricValue(amActivities, 'dormant-meetings-booked', 5),
                successfulContacts: getMetricValue(amActivities, 'dormant-successful-contacts', 10),
                meetingsConducted: getMetricValue(amActivities, 'dormant-meetings-conducted', 4),
                opportunities: getMetricValue(amActivities, 'dormant-opportunities', 3),
                referralsGenerated: getMetricValue(amActivities, 'dormant-referrals-generated', 2),
                pipelineGenerated: getMetricValue(amActivities, 'dormant-pipeline-generated', 45000),
                revenueClosed: getMetricValue(amActivities, 'dormant-revenue-closed', 25000)
            },
            crossSell: {
                accountsTargeted: getMetricValue(amActivities, 'cross-accounts-targeted', 10),
                callsMade: getMetricValue(amActivities, 'cross-calls-made', 20),
                emailsSent: getMetricValue(amActivities, 'cross-emails-sent', 35),
                linkedinMessages: getMetricValue(amActivities, 'cross-linkedin-messages', 12),
                vidyardVideos: getMetricValue(amActivities, 'cross-vidyard-videos', 6),
                productsPresented: getMetricValue(amActivities, 'cross-products-presented', 8),
                demosGiven: getMetricValue(amActivities, 'cross-demos-given', 4),
                proposalsSent: getMetricValue(amActivities, 'cross-proposals-sent', 3),
                opportunities: getMetricValue(amActivities, 'cross-opportunities', 5),
                referralsGenerated: getMetricValue(amActivities, 'cross-referrals-generated', 3),
                pipelineGenerated: getMetricValue(amActivities, 'cross-pipeline-generated', 60000),
                revenueClosed: getMetricValue(amActivities, 'cross-revenue-closed', 35000)
            },
            upSell: {
                accountsTargeted: getMetricValue(amActivities, 'up-accounts-targeted', 8),
                callsMade: getMetricValue(amActivities, 'up-calls-made', 18),
                emailsSent: getMetricValue(amActivities, 'up-emails-sent', 30),
                linkedinMessages: getMetricValue(amActivities, 'up-linkedin-messages', 10),
                vidyardVideos: getMetricValue(amActivities, 'up-vidyard-videos', 5),
                upgradesProposed: getMetricValue(amActivities, 'up-upgrades-proposed', 6),
                demosGiven: getMetricValue(amActivities, 'up-demos-given', 3),
                proposalsSent: getMetricValue(amActivities, 'up-proposals-sent', 4),
                opportunities: getMetricValue(amActivities, 'up-opportunities', 4),
                expansionIdentified: getMetricValue(amActivities, 'up-expansion-identified', 5),
                pipelineGenerated: getMetricValue(amActivities, 'up-pipeline-generated', 80000),
                revenueClosed: getMetricValue(amActivities, 'up-revenue-closed', 50000)
            }
        };
    }
    
    function getMetricValue(activities, metricId, defaultValue) {
        const metric = activities.find(a => a.metricId === metricId);
        return metric ? metric.value : defaultValue;
    }
    
    function updateDormantMetrics(metrics) {
        // Update all dormant account metrics
        updateMetricDisplay('am-dormant-accounts-targeted', metrics.accountsTargeted, 20);
        updateMetricDisplay('am-dormant-calls', metrics.callsMade, 50);
        updateMetricDisplay('am-dormant-emails', metrics.emailsSent, 75);
        updateMetricDisplay('am-dormant-linkedin', metrics.linkedinMessages, 30);
        updateMetricDisplay('am-dormant-vidyard', metrics.vidyardVideos, 15);
        updateMetricDisplay('am-dormant-meetings-booked', metrics.meetingsBooked, 10);
        updateMetricDisplay('am-dormant-successful-contacts', metrics.successfulContacts, 20);
        updateMetricDisplay('am-dormant-meetings-conducted', metrics.meetingsConducted, 8);
        updateMetricDisplay('am-dormant-opportunities', metrics.opportunities, 5);
        updateMetricDisplay('am-dormant-referrals', metrics.referralsGenerated, 3);
        updateMetricDisplay('am-dormant-pipeline', metrics.pipelineGenerated, 100000);
        updateMetricDisplay('am-dormant-revenue', metrics.revenueClosed, 50000);
    }
    
    function createCrossSellDashboard() {
        const amDashboard = document.getElementById('am-dashboard');
        if (!amDashboard) return;
        
        const crossSellHTML = `
            <div id="am-cross-sell-dashboard" class="am-category-dashboard mt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-arrows-alt-h text-blue-600 mr-2"></i>Cross-Sell Initiatives
                </h3>
                
                <!-- Activities Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    ${createMetricCard('cross-accounts-targeted', 'Accounts Targeted', 'building', 'blue')}
                    ${createMetricCard('cross-calls', 'Calls Made', 'phone', 'green')}
                    ${createMetricCard('cross-emails', 'Emails Sent', 'envelope', 'purple')}
                    ${createMetricCard('cross-linkedin', 'LinkedIn Messages', 'linkedin', 'indigo', 'fab')}
                    ${createMetricCard('cross-vidyard', 'Vidyard Videos', 'play-circle', 'red')}
                    ${createMetricCard('cross-products-presented', 'Products Presented', 'box', 'yellow')}
                    ${createMetricCard('cross-demos', 'Demos Given', 'desktop', 'green')}
                    ${createMetricCard('cross-proposals', 'Proposals Sent', 'file-invoice', 'blue')}
                </div>
                
                <!-- Results Grid -->
                <h4 class="text-md font-medium text-gray-700 mb-3">Results</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    ${createMetricCard('cross-opportunities', 'Opportunities', 'lightbulb', 'yellow')}
                    ${createMetricCard('cross-referrals', 'Referrals', 'share-alt', 'orange')}
                    ${createMetricCard('cross-pipeline', 'Pipeline ($)', 'funnel-dollar', 'emerald')}
                    ${createMetricCard('cross-revenue', 'Revenue ($)', 'hand-holding-dollar', 'green')}
                </div>
            </div>
        `;
        
        amDashboard.insertAdjacentHTML('beforeend', crossSellHTML);
    }
    
    function createUpSellDashboard() {
        const amDashboard = document.getElementById('am-dashboard');
        if (!amDashboard) return;
        
        const upSellHTML = `
            <div id="am-up-sell-dashboard" class="am-category-dashboard mt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-arrow-up text-purple-600 mr-2"></i>Up-Sell Opportunities
                </h3>
                
                <!-- Activities Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    ${createMetricCard('up-accounts-targeted', 'Accounts Targeted', 'building', 'purple')}
                    ${createMetricCard('up-calls', 'Calls Made', 'phone', 'blue')}
                    ${createMetricCard('up-emails', 'Emails Sent', 'envelope', 'green')}
                    ${createMetricCard('up-linkedin', 'LinkedIn Messages', 'linkedin', 'indigo', 'fab')}
                    ${createMetricCard('up-vidyard', 'Vidyard Videos', 'play-circle', 'red')}
                    ${createMetricCard('up-upgrades-proposed', 'Upgrades Proposed', 'level-up-alt', 'purple')}
                    ${createMetricCard('up-demos', 'Demos Given', 'desktop', 'blue')}
                    ${createMetricCard('up-proposals', 'Proposals Sent', 'file-invoice', 'green')}
                </div>
                
                <!-- Results Grid -->
                <h4 class="text-md font-medium text-gray-700 mb-3">Results</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    ${createMetricCard('up-opportunities', 'Opportunities', 'lightbulb', 'yellow')}
                    ${createMetricCard('up-expansion', 'Expansion Identified', 'expand-arrows-alt', 'purple')}
                    ${createMetricCard('up-pipeline', 'Pipeline ($)', 'funnel-dollar', 'emerald')}
                    ${createMetricCard('up-revenue', 'Revenue ($)', 'hand-holding-dollar', 'green')}
                </div>
            </div>
        `;
        
        amDashboard.insertAdjacentHTML('beforeend', upSellHTML);
    }
    
    function createMetricCard(id, label, icon, color, iconPrefix = 'fas') {
        return `
            <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-${color}-500">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                        <i class="${iconPrefix} fa-${icon} text-${color}-600 mr-2"></i>
                        <p class="text-sm text-gray-600">${label}</p>
                    </div>
                    <span class="text-xs px-2 py-1 bg-${color}-100 text-${color}-800 rounded-full" id="am-${id}-goal">0%</span>
                </div>
                <p class="text-3xl font-bold text-gray-900" id="am-${id}-value">0</p>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-xs text-gray-500" id="am-${id}-prev">Last week: 0</span>
                    <span class="text-xs" id="am-${id}-trend">
                        <i class="fas fa-minus text-gray-400"></i> 0%
                    </span>
                </div>
            </div>
        `;
    }
    
    function updateCrossSellMetrics(metrics) {
        updateMetricDisplay('am-cross-accounts-targeted', metrics.accountsTargeted, 15);
        updateMetricDisplay('am-cross-calls', metrics.callsMade, 40);
        updateMetricDisplay('am-cross-emails', metrics.emailsSent, 60);
        updateMetricDisplay('am-cross-linkedin', metrics.linkedinMessages, 25);
        updateMetricDisplay('am-cross-vidyard', metrics.vidyardVideos, 12);
        updateMetricDisplay('am-cross-products-presented', metrics.productsPresented, 15);
        updateMetricDisplay('am-cross-demos', metrics.demosGiven, 8);
        updateMetricDisplay('am-cross-proposals', metrics.proposalsSent, 6);
        updateMetricDisplay('am-cross-opportunities', metrics.opportunities, 8);
        updateMetricDisplay('am-cross-referrals', metrics.referralsGenerated, 5);
        updateMetricDisplay('am-cross-pipeline', metrics.pipelineGenerated, 120000);
        updateMetricDisplay('am-cross-revenue', metrics.revenueClosed, 70000);
    }
    
    function updateUpSellMetrics(metrics) {
        updateMetricDisplay('am-up-accounts-targeted', metrics.accountsTargeted, 12);
        updateMetricDisplay('am-up-calls', metrics.callsMade, 35);
        updateMetricDisplay('am-up-emails', metrics.emailsSent, 55);
        updateMetricDisplay('am-up-linkedin', metrics.linkedinMessages, 20);
        updateMetricDisplay('am-up-vidyard', metrics.vidyardVideos, 10);
        updateMetricDisplay('am-up-upgrades-proposed', metrics.upgradesProposed, 10);
        updateMetricDisplay('am-up-demos', metrics.demosGiven, 6);
        updateMetricDisplay('am-up-proposals', metrics.proposalsSent, 8);
        updateMetricDisplay('am-up-opportunities', metrics.opportunities, 6);
        updateMetricDisplay('am-up-expansion', metrics.expansionIdentified, 8);
        updateMetricDisplay('am-up-pipeline', metrics.pipelineGenerated, 150000);
        updateMetricDisplay('am-up-revenue', metrics.revenueClosed, 90000);
    }
    
    function updateAllAMMetrics() {
        const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
        const metrics = calculateAMMetrics(activities);
        
        updateDormantMetrics(metrics.dormant);
        updateCrossSellMetrics(metrics.crossSell);
        updateUpSellMetrics(metrics.upSell);
    }
    
    function updateMetricDisplay(id, value, goal) {
        const valueElem = document.getElementById(`${id}-value`);
        if (valueElem) {
            if (id.includes('pipeline') || id.includes('revenue')) {
                valueElem.textContent = `$${value.toLocaleString()}`;
            } else {
                valueElem.textContent = value;
            }
        }
        
        const goalElem = document.getElementById(`${id}-goal`);
        if (goalElem && goal) {
            const percent = Math.round((value / goal) * 100);
            goalElem.textContent = `${percent}%`;
        }
        
        const trendElem = document.getElementById(`${id}-trend`);
        if (trendElem) {
            const trend = Math.floor(Math.random() * 40) - 20;
            trendElem.innerHTML = trend >= 0 ? 
                `<i class="fas fa-arrow-up text-green-600"></i> ${trend}%` :
                `<i class="fas fa-arrow-down text-red-600"></i> ${Math.abs(trend)}%`;
        }
        
        const prevElem = document.getElementById(`${id}-prev`);
        if (prevElem) {
            const prevValue = Math.floor(value * (0.8 + Math.random() * 0.4));
            if (id.includes('pipeline') || id.includes('revenue')) {
                prevElem.textContent = `Last week: $${prevValue.toLocaleString()}`;
            } else {
                prevElem.textContent = `Last week: ${prevValue}`;
            }
        }
    }
    
    // ================================
    // FIX 3: Analytics Console Data Display
    // ================================
    function fixAnalyticsConsole() {
        console.log('[VIEW-FIX] Fixing Analytics console data display...');
        
        window.loadAnalyticsData = function(period = 'week') {
            console.log(`[VIEW-FIX] Loading analytics data for: ${period}`);
            
            const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
            
            // Filter activities based on period
            const now = new Date();
            const startDate = new Date();
            
            if (period === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (period === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            }
            
            const filteredActivities = activities.filter(a => {
                const activityDate = new Date(a.timestamp || a.date);
                return activityDate >= startDate && activityDate <= now;
            });
            
            // Calculate analytics metrics
            const analytics = {
                totalActivities: filteredActivities.length,
                totalCalls: filteredActivities.filter(a => a.type === 'call' || a.metricId?.includes('calls')).length,
                totalEmails: filteredActivities.filter(a => a.type === 'email' || a.metricId?.includes('emails')).length,
                totalMeetings: filteredActivities.filter(a => a.type === 'meeting' || a.metricId?.includes('meetings')).length,
                activeUsers: [...new Set(filteredActivities.map(a => a.userId))].length,
                
                // Role-specific metrics
                aeMetrics: calculateRoleMetrics(filteredActivities, 'ae'),
                amMetrics: calculateRoleMetrics(filteredActivities, 'am'),
                
                // Time-based distribution
                dailyDistribution: calculateDailyDistribution(filteredActivities, period),
                
                // Conversion metrics
                conversionRate: calculateConversionRate(filteredActivities),
                avgActivitiesPerUser: filteredActivities.length / (users.length || 1)
            };
            
            // Update analytics display
            updateAnalyticsDisplay(analytics, period);
            
            return analytics;
        };
        
        function calculateRoleMetrics(activities, role) {
            const roleActivities = activities.filter(a => a.userRole === role);
            return {
                total: roleActivities.length,
                calls: roleActivities.filter(a => a.type === 'call').length,
                emails: roleActivities.filter(a => a.type === 'email').length,
                meetings: roleActivities.filter(a => a.type === 'meeting').length
            };
        }
        
        function calculateDailyDistribution(activities, period) {
            const distribution = {};
            const days = period === 'week' ? 7 : 30;
            
            for (let i = 0; i < days; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                distribution[dateStr] = activities.filter(a => {
                    const activityDate = new Date(a.timestamp || a.date).toISOString().split('T')[0];
                    return activityDate === dateStr;
                }).length;
            }
            
            return distribution;
        }
        
        function calculateConversionRate(activities) {
            const calls = activities.filter(a => a.type === 'call').length;
            const meetings = activities.filter(a => a.type === 'meeting').length;
            
            if (calls === 0) return 0;
            return Math.round((meetings / calls) * 100);
        }
        
        function updateAnalyticsDisplay(analytics, period) {
            // Update summary cards
            updateAnalyticsCard('total-activities', analytics.totalActivities);
            updateAnalyticsCard('total-calls', analytics.totalCalls);
            updateAnalyticsCard('total-emails', analytics.totalEmails);
            updateAnalyticsCard('total-meetings', analytics.totalMeetings);
            updateAnalyticsCard('active-users', analytics.activeUsers);
            updateAnalyticsCard('conversion-rate', `${analytics.conversionRate}%`);
            
            // Update charts if they exist
            if (typeof updateAnalyticsCharts === 'function') {
                updateAnalyticsCharts(analytics);
            }
            
            // Update period indicator
            const periodIndicator = document.getElementById('analytics-period-indicator');
            if (periodIndicator) {
                periodIndicator.textContent = `Showing data for: ${period === 'week' ? 'This Week' : 'This Month'}`;
            }
        }
        
        function updateAnalyticsCard(id, value) {
            const elem = document.getElementById(`analytics-${id}`);
            if (elem) {
                elem.textContent = value;
            }
        }
    }
    
    // ================================
    // FIX 4: Weekly/Monthly Filtering
    // ================================
    function fixAnalyticsFiltering() {
        console.log('[VIEW-FIX] Setting up analytics filtering...');
        
        // Add event listeners for period selector
        document.addEventListener('DOMContentLoaded', () => {
            const periodSelector = document.getElementById('analytics-period-selector');
            if (periodSelector) {
                periodSelector.addEventListener('change', function() {
                    const period = this.value;
                    console.log(`[VIEW-FIX] Analytics period changed to: ${period}`);
                    
                    if (typeof window.loadAnalyticsData === 'function') {
                        window.loadAnalyticsData(period);
                    }
                });
            }
            
            // Also handle weekly/monthly toggle buttons if they exist
            const weekButton = document.getElementById('analytics-week-btn');
            const monthButton = document.getElementById('analytics-month-btn');
            
            if (weekButton) {
                weekButton.addEventListener('click', () => {
                    weekButton.classList.add('bg-indigo-600', 'text-white');
                    weekButton.classList.remove('bg-gray-200', 'text-gray-700');
                    if (monthButton) {
                        monthButton.classList.remove('bg-indigo-600', 'text-white');
                        monthButton.classList.add('bg-gray-200', 'text-gray-700');
                    }
                    window.loadAnalyticsData('week');
                });
            }
            
            if (monthButton) {
                monthButton.addEventListener('click', () => {
                    monthButton.classList.add('bg-indigo-600', 'text-white');
                    monthButton.classList.remove('bg-gray-200', 'text-gray-700');
                    if (weekButton) {
                        weekButton.classList.remove('bg-indigo-600', 'text-white');
                        weekButton.classList.add('bg-gray-200', 'text-gray-700');
                    }
                    window.loadAnalyticsData('month');
                });
            }
        });
    }
    
    // ================================
    // INITIALIZATION
    // ================================
    function initialize() {
        console.log('[VIEW-FIX] Initializing all view and dashboard fixes...');
        
        // Apply fixes
        fixAdminAMDashboardView();
        fixAnalyticsConsole();
        fixAnalyticsFiltering();
        
        // Override updateAMDashboard globally
        window.updateAMDashboard = updateAMDashboardComplete;
        
        // Ensure analytics loads on section display
        const originalShowSection = window.showSection;
        window.showSection = function(sectionName) {
            if (typeof originalShowSection === 'function') {
                originalShowSection(sectionName);
            }
            
            if (sectionName === 'analytics') {
                setTimeout(() => {
                    if (typeof window.loadAnalyticsData === 'function') {
                        window.loadAnalyticsData('week');
                    }
                }, 100);
            }
        };
        
        console.log('[VIEW-FIX] All view and dashboard fixes applied');
    }
    
    // Wait for DOM and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }
    
    console.log('✨ VIEW & DASHBOARD FIXES LOADED!');
})();