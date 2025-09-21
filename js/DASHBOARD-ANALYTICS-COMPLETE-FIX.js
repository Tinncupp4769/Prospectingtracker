// ========================================
// COMPLETE DASHBOARD & ANALYTICS FIX
// Fixes:
// 1. initializeTeamCharts undefined error
// 2. Login page box issue
// 3. Analytics percentage calculations
// 4. Dashboard gauge values (performance, activity rate, goal progress)
// 5. Replace goal progress with radial gauge
// ========================================

console.log('🔧 COMPLETE DASHBOARD & ANALYTICS FIX LOADING...');

(function() {
    'use strict';
    
    // ================================
    // FIX 1: Define initializeTeamCharts Function
    // ================================
    window.initializeTeamCharts = function(metrics) {
        console.log('[DASHBOARD-FIX] Initializing team charts with metrics:', metrics);
        
        try {
            // Check if we're in admin team view
            const adminDashboard = document.getElementById('admin-dashboard');
            if (!adminDashboard || adminDashboard.style.display === 'none') {
                console.log('[DASHBOARD-FIX] Not in admin team view, skipping team charts');
                return;
            }
            
            // Find chart containers
            const performanceChartContainer = document.getElementById('team-performance-chart');
            const activityChartContainer = document.getElementById('team-activity-chart');
            const conversionChartContainer = document.getElementById('team-conversion-chart');
            
            // Initialize performance chart
            if (performanceChartContainer) {
                const canvas = performanceChartContainer.querySelector('canvas') || document.createElement('canvas');
                if (!performanceChartContainer.querySelector('canvas')) {
                    performanceChartContainer.appendChild(canvas);
                }
                
                const ctx = canvas.getContext('2d');
                
                // Destroy existing chart if it exists
                if (window.teamPerformanceChart) {
                    window.teamPerformanceChart.destroy();
                }
                
                // Create new chart
                window.teamPerformanceChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: metrics.teamMembers || ['No Data'],
                        datasets: [{
                            label: 'Activities',
                            data: metrics.activities || [0],
                            backgroundColor: 'rgba(79, 70, 229, 0.8)',
                            borderColor: 'rgba(79, 70, 229, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Team Performance Overview'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            
            // Initialize activity trend chart
            if (activityChartContainer) {
                const canvas = activityChartContainer.querySelector('canvas') || document.createElement('canvas');
                if (!activityChartContainer.querySelector('canvas')) {
                    activityChartContainer.appendChild(canvas);
                }
                
                const ctx = canvas.getContext('2d');
                
                // Destroy existing chart if it exists
                if (window.teamActivityChart) {
                    window.teamActivityChart.destroy();
                }
                
                // Create new chart
                window.teamActivityChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: metrics.dates || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                        datasets: [{
                            label: 'Daily Activities',
                            data: metrics.dailyActivities || [0, 0, 0, 0, 0],
                            borderColor: 'rgba(16, 185, 129, 1)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Activity Trend'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            
            // Initialize conversion funnel chart
            if (conversionChartContainer) {
                const canvas = conversionChartContainer.querySelector('canvas') || document.createElement('canvas');
                if (!conversionChartContainer.querySelector('canvas')) {
                    conversionChartContainer.appendChild(canvas);
                }
                
                const ctx = canvas.getContext('2d');
                
                // Destroy existing chart if it exists
                if (window.teamConversionChart) {
                    window.teamConversionChart.destroy();
                }
                
                // Create new chart
                window.teamConversionChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Calls', 'Emails', 'Meetings', 'Opportunities'],
                        datasets: [{
                            data: [
                                metrics.totalCalls || 0,
                                metrics.totalEmails || 0,
                                metrics.totalMeetings || 0,
                                metrics.totalOpportunities || 0
                            ],
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(239, 68, 68, 0.8)'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: 'Conversion Funnel'
                            }
                        }
                    }
                });
            }
            
            console.log('[DASHBOARD-FIX] Team charts initialized successfully');
        } catch (error) {
            console.error('[DASHBOARD-FIX] Error initializing team charts:', error);
        }
    };
    
    // ================================
    // FIX 2: Remove Login Page Box
    // ================================
    function fixLoginPageBox() {
        console.log('[DASHBOARD-FIX] Fixing login page box issue...');
        
        // Add CSS to properly style login page and remove any unwanted boxes
        const style = document.createElement('style');
        style.textContent = `
            /* Fix login page layout */
            #login-page {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                z-index: 9999 !important;
            }
            
            /* Hide any debug panels or unwanted boxes on login page */
            #login-page #debug-panel,
            #login-page .debug-panel,
            #login-page [id*="debug"],
            #login-page .absolute.top-4.right-4 {
                display: none !important;
            }
            
            /* Ensure login form is centered */
            #login-page .login-container,
            #login-page > div {
                position: relative !important;
                margin: auto !important;
                top: auto !important;
                right: auto !important;
                transform: none !important;
            }
            
            /* Hide debug panel globally when on login page */
            body:has(#login-page[style*="display: flex"]) #debug-panel,
            body:has(#login-page[style*="display: block"]) #debug-panel {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        
        // Also check and remove any debug panels from login page
        const loginPage = document.getElementById('login-page');
        if (loginPage) {
            const debugPanels = loginPage.querySelectorAll('#debug-panel, .debug-panel, [id*="debug"], .absolute.top-4.right-4');
            debugPanels.forEach(panel => {
                console.log('[DASHBOARD-FIX] Removing debug panel from login page');
                panel.remove();
            });
        }
    }
    
    // ================================
    // FIX 3: Analytics Percentage Calculations
    // ================================
    window.calculatePercentageChange = function(current, previous) {
        console.log('[DASHBOARD-FIX] Calculating percentage change:', { current, previous });
        
        // Convert to numbers
        current = parseFloat(current) || 0;
        previous = parseFloat(previous) || 0;
        
        // If both are 0, no change
        if (current === 0 && previous === 0) {
            return { value: 0, display: '0%', trend: 'neutral' };
        }
        
        // If previous is 0 but current has value, it's new activity
        if (previous === 0 && current > 0) {
            return { 
                value: 100, 
                display: 'New Activity', 
                trend: 'up',
                isNew: true 
            };
        }
        
        // If current is 0 but previous had value, it's -100%
        if (current === 0 && previous > 0) {
            return { 
                value: -100, 
                display: '-100%', 
                trend: 'down' 
            };
        }
        
        // Normal percentage calculation
        const change = ((current - previous) / previous) * 100;
        const rounded = Math.round(change);
        
        return {
            value: rounded,
            display: `${rounded > 0 ? '+' : ''}${rounded}%`,
            trend: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'neutral'
        };
    };
    
    // Fix the analytics data display
    window.fixAnalyticsPercentages = function() {
        console.log('[DASHBOARD-FIX] Fixing analytics percentages...');
        
        // Find all percentage displays in analytics
        const percentageElements = document.querySelectorAll('[id*="-change"], [id*="-trend"], .trend-indicator');
        
        percentageElements.forEach(element => {
            const text = element.textContent.trim();
            
            // Check if it shows the problematic "15% up from last period" with no data
            if (text.includes('15%') || text.includes('from last period')) {
                const parentCard = element.closest('.bg-white');
                if (parentCard) {
                    // Find the main value in this card
                    const valueElement = parentCard.querySelector('.text-3xl, .text-2xl, .text-4xl');
                    const value = parseFloat(valueElement?.textContent) || 0;
                    
                    // If there's no current value, show appropriate message
                    if (value === 0) {
                        element.innerHTML = '<span class="text-gray-400">No activity</span>';
                    } else {
                        // Check for previous period data
                        const prevElement = parentCard.querySelector('[id*="prev"], .text-gray-500');
                        const prevText = prevElement?.textContent || '';
                        const prevMatch = prevText.match(/(\d+)/);
                        const prevValue = prevMatch ? parseFloat(prevMatch[1]) : 0;
                        
                        const change = calculatePercentageChange(value, prevValue);
                        
                        if (change.isNew) {
                            element.innerHTML = `<i class="fas fa-arrow-up text-green-500"></i> <span class="text-green-600">New Activity</span>`;
                        } else if (change.trend === 'up') {
                            element.innerHTML = `<i class="fas fa-arrow-up text-green-500"></i> <span class="text-green-600">${change.display}</span>`;
                        } else if (change.trend === 'down') {
                            element.innerHTML = `<i class="fas fa-arrow-down text-red-500"></i> <span class="text-red-600">${change.display}</span>`;
                        } else {
                            element.innerHTML = `<i class="fas fa-minus text-gray-400"></i> <span class="text-gray-400">${change.display}</span>`;
                        }
                    }
                }
            }
        });
    };
    
    // ================================
    // FIX 4: Dashboard Gauge Calculations
    // ================================
    window.calculateDashboardMetrics = function() {
        console.log('[DASHBOARD-FIX] Calculating real dashboard metrics...');
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
        const goals = JSON.parse(localStorage.getItem('spt_goals') || '[]');
        
        // Get current period
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        // Filter activities for current user and period
        const userActivities = activities.filter(a => {
            const actDate = new Date(a.date || a.created_at);
            return (a.userId === currentUser.id || a.userEmail === currentUser.email) &&
                   actDate >= weekStart;
        });
        
        // Get user's goals
        const userGoals = goals.filter(g => 
            g.userId === currentUser.id || g.userEmail === currentUser.email
        );
        
        // Calculate Performance % (activities completed vs total planned)
        let performancePercent = 0;
        if (userGoals.length > 0) {
            const totalGoalActivities = userGoals.reduce((sum, g) => {
                return sum + (g.calls || 0) + (g.emails || 0) + (g.meetings || 0);
            }, 0);
            
            const totalCompleted = userActivities.length;
            
            if (totalGoalActivities > 0) {
                performancePercent = Math.min(100, Math.round((totalCompleted / totalGoalActivities) * 100));
            }
        }
        
        // Calculate Activity Rate % (active days in the week)
        const activeDays = new Set();
        userActivities.forEach(a => {
            const date = new Date(a.date || a.created_at);
            activeDays.add(date.toDateString());
        });
        const activityRatePercent = Math.round((activeDays.size / 5) * 100); // Assuming 5 working days
        
        // Calculate Goal Progress % (weighted average of all goal completions)
        let goalProgressPercent = 0;
        if (userGoals.length > 0) {
            const callsGoal = userGoals[0]?.calls || 0;
            const emailsGoal = userGoals[0]?.emails || 0;
            const meetingsGoal = userGoals[0]?.meetings || 0;
            
            const callsActual = userActivities.filter(a => a.type === 'call').length;
            const emailsActual = userActivities.filter(a => a.type === 'email').length;
            const meetingsActual = userActivities.filter(a => a.type === 'meeting').length;
            
            let totalProgress = 0;
            let totalWeight = 0;
            
            if (callsGoal > 0) {
                totalProgress += Math.min(100, (callsActual / callsGoal) * 100);
                totalWeight++;
            }
            if (emailsGoal > 0) {
                totalProgress += Math.min(100, (emailsActual / emailsGoal) * 100);
                totalWeight++;
            }
            if (meetingsGoal > 0) {
                totalProgress += Math.min(100, (meetingsActual / meetingsGoal) * 100);
                totalWeight++;
            }
            
            if (totalWeight > 0) {
                goalProgressPercent = Math.round(totalProgress / totalWeight);
            }
        }
        
        return {
            performance: performancePercent,
            activityRate: activityRatePercent,
            goalProgress: goalProgressPercent,
            hasGoals: userGoals.length > 0
        };
    };
    
    // ================================
    // FIX 5: Update Dashboard Gauges with Real Values
    // ================================
    window.updateDashboardGauges = function() {
        console.log('[DASHBOARD-FIX] Updating dashboard gauges with real values...');
        
        const metrics = calculateDashboardMetrics();
        
        // Find gauge containers in the dashboard
        const performanceGauge = document.querySelector('[data-metric="performance"]');
        const activityGauge = document.querySelector('[data-metric="activity-rate"]');
        const goalGauge = document.querySelector('[data-metric="goal-progress"]');
        
        // Update Performance Gauge
        if (performanceGauge) {
            const valueElement = performanceGauge.querySelector('.text-3xl, .text-2xl');
            const labelElement = performanceGauge.querySelector('.text-gray-600');
            
            if (valueElement) {
                valueElement.textContent = metrics.hasGoals ? `${metrics.performance}%` : '—';
            }
            if (labelElement && !metrics.hasGoals) {
                labelElement.textContent = 'Performance (No Goals Set)';
            }
            
            // Create or update radial gauge
            const gaugeContainer = performanceGauge.querySelector('.gauge-container') || performanceGauge;
            if (window.createRadialGauge && gaugeContainer.id) {
                window.createRadialGauge(gaugeContainer.id, metrics.performance, 100, 'Performance', '#4F46E5');
            }
        }
        
        // Update Activity Rate Gauge
        if (activityGauge) {
            const valueElement = activityGauge.querySelector('.text-3xl, .text-2xl');
            if (valueElement) {
                valueElement.textContent = `${metrics.activityRate}%`;
            }
            
            // Create or update radial gauge
            const gaugeContainer = activityGauge.querySelector('.gauge-container') || activityGauge;
            if (window.createRadialGauge && gaugeContainer.id) {
                window.createRadialGauge(gaugeContainer.id, metrics.activityRate, 100, 'Activity Rate', '#10B981');
            }
        }
        
        // Update Goal Progress Gauge - Replace with Radial Gauge
        if (goalGauge) {
            const valueElement = goalGauge.querySelector('.text-3xl, .text-2xl');
            const labelElement = goalGauge.querySelector('.text-gray-600');
            
            if (valueElement) {
                valueElement.textContent = metrics.hasGoals ? `${metrics.goalProgress}%` : '—';
            }
            if (labelElement && !metrics.hasGoals) {
                labelElement.textContent = 'Goal Progress (No Goals Set)';
            }
            
            // Replace existing graphic with radial gauge
            const existingGraphic = goalGauge.querySelector('svg, canvas, .progress-bar');
            if (existingGraphic) {
                existingGraphic.remove();
            }
            
            // Create container for radial gauge if it doesn't exist
            let gaugeContainer = goalGauge.querySelector('.radial-gauge-container');
            if (!gaugeContainer) {
                gaugeContainer = document.createElement('div');
                gaugeContainer.className = 'radial-gauge-container';
                gaugeContainer.id = 'goal-progress-radial-gauge';
                
                // Insert after the value element or at the end
                if (valueElement) {
                    valueElement.parentNode.insertBefore(gaugeContainer, valueElement.nextSibling);
                } else {
                    goalGauge.appendChild(gaugeContainer);
                }
            }
            
            // Create the radial gauge
            if (window.createRadialGauge) {
                window.createRadialGauge(gaugeContainer.id, metrics.goalProgress, 100, 'Goal Progress', '#F59E0B');
            }
        }
        
        // Also look for any hardcoded percentage values and update them
        const hardcodedElements = document.querySelectorAll('.dashboard-view:not(.hidden)');
        hardcodedElements.forEach(view => {
            // Search for elements containing the hardcoded values
            const elements = view.querySelectorAll('*');
            elements.forEach(el => {
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                    const text = el.textContent.trim();
                    
                    // Check for hardcoded values
                    if (text === '75%' && el.closest('[data-metric="performance"]')) {
                        el.textContent = metrics.hasGoals ? `${metrics.performance}%` : '—';
                    } else if (text === '62%' && el.closest('[data-metric="activity-rate"]')) {
                        el.textContent = `${metrics.activityRate}%`;
                    } else if (text === '88%' && el.closest('[data-metric="goal-progress"]')) {
                        el.textContent = metrics.hasGoals ? `${metrics.goalProgress}%` : '—';
                    }
                }
            });
        });
        
        console.log('[DASHBOARD-FIX] Dashboard gauges updated with metrics:', metrics);
    };
    
    // ================================
    // INITIALIZATION
    // ================================
    function initialize() {
        console.log('[DASHBOARD-FIX] Initializing complete dashboard fixes...');
        
        // Fix login page box immediately
        fixLoginPageBox();
        
        // Set up periodic updates
        setInterval(() => {
            // Update dashboard gauges if dashboard is visible
            const dashboardSection = document.getElementById('dashboard-section');
            if (dashboardSection && dashboardSection.style.display !== 'none') {
                updateDashboardGauges();
            }
            
            // Fix analytics percentages if analytics is visible
            const analyticsSection = document.getElementById('analytics-section');
            if (analyticsSection && analyticsSection.style.display !== 'none') {
                fixAnalyticsPercentages();
            }
        }, 1000);
        
        // Override problematic function calls
        const originalShowSection = window.showSection;
        window.showSection = function(section) {
            // Call original function
            if (originalShowSection) {
                originalShowSection(section);
            }
            
            // Apply fixes after section change
            setTimeout(() => {
                if (section === 'dashboard') {
                    updateDashboardGauges();
                } else if (section === 'analytics') {
                    fixAnalyticsPercentages();
                }
            }, 100);
        };
        
        // Listen for dashboard updates
        document.addEventListener('dashboardUpdated', updateDashboardGauges);
        document.addEventListener('analyticsUpdated', fixAnalyticsPercentages);
        
        console.log('[DASHBOARD-FIX] Complete dashboard fixes initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Also initialize after a delay to catch late-loading elements
    setTimeout(initialize, 1000);
})();

// ================================
// METRICS CALCULATION DOCUMENTATION
// ================================
/*
HOW METRICS ARE CALCULATED:

1. PERFORMANCE %
   - Measures: Total activities completed vs. total activities planned in goals
   - Formula: (Completed Activities / Total Goal Activities) × 100
   - Range: 0-100%
   - Shows "—" if no goals are set

2. ACTIVITY RATE %
   - Measures: How many days in the work week the user was active
   - Formula: (Active Days / 5 Working Days) × 100
   - Range: 0-100%
   - An "active day" is any day with at least one logged activity

3. GOAL PROGRESS %
   - Measures: Weighted average completion across all goal categories
   - Formula: Average of (Actual/Goal × 100) for each activity type
   - Range: 0-100%
   - Only includes activity types with goals > 0
   - Shows "—" if no goals are set

PERCENTAGE CHANGE CALCULATIONS:
- New Activity: Shows "New Activity" when current > 0 but previous = 0
- No Change: Shows "0%" when both current and previous = 0
- Decrease to Zero: Shows "-100%" when current = 0 but previous > 0
- Normal Change: ((Current - Previous) / Previous) × 100
*/

console.log('✅ COMPLETE DASHBOARD & ANALYTICS FIX LOADED');