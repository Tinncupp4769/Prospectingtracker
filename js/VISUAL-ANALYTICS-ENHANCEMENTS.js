// ========================================
// VISUAL ANALYTICS ENHANCEMENTS
// Fixes analytics view switching and adds gauges, charts, and KPI cards
// ========================================

console.log('🎨 VISUAL ANALYTICS ENHANCEMENTS LOADING...');

(function() {
    'use strict';
    
    // Store current period globally
    window.currentAnalyticsPeriod = 'week';
    
    // ================================
    // FIX 1: Analytics Week/Month View Switching
    // ================================
    function fixAnalyticsViewSwitching() {
        console.log('[VISUAL-FIX] Fixing analytics view switching...');
        
        // Override loadAnalyticsData with proper period handling
        window.loadAnalyticsData = function(period = 'week') {
            console.log(`[VISUAL-FIX] Loading analytics for period: ${period}`);
            
            // Store current period
            window.currentAnalyticsPeriod = period;
            
            // Update button states
            updatePeriodButtons(period);
            
            // Get all activities
            const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
            
            // Calculate date range based on period
            const now = new Date();
            const startDate = new Date();
            
            if (period === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (period === 'month') {
                startDate.setDate(now.getDate() - 30);
            }
            
            console.log(`[VISUAL-FIX] Date range: ${startDate.toLocaleDateString()} to ${now.toLocaleDateString()}`);
            
            // Filter activities by date range
            const filteredActivities = activities.filter(a => {
                const activityDate = new Date(a.timestamp || a.date || a.createdAt || Date.now());
                const inRange = activityDate >= startDate && activityDate <= now;
                return inRange;
            });
            
            console.log(`[VISUAL-FIX] Filtered ${filteredActivities.length} activities from ${activities.length} total`);
            
            // Calculate metrics
            const metrics = calculateAnalyticsMetrics(filteredActivities, users, period);
            
            // Update displays
            updateAnalyticsDisplay(metrics, period);
            
            // Update charts and gauges
            updateVisualComponents(metrics, period);
            
            return metrics;
        };
        
        function updatePeriodButtons(period) {
            // Update week/month buttons
            const weekBtn = document.querySelector('[onclick*="week"]');
            const monthBtn = document.querySelector('[onclick*="month"]');
            
            if (weekBtn && monthBtn) {
                if (period === 'week') {
                    weekBtn.className = 'px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium';
                    monthBtn.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300';
                } else {
                    monthBtn.className = 'px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium';
                    weekBtn.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300';
                }
            }
            
            // Update period indicator
            const periodIndicator = document.getElementById('analytics-period-indicator');
            if (periodIndicator) {
                periodIndicator.textContent = period === 'week' ? 'Last 7 Days' : 'Last 30 Days';
            }
        }
        
        function calculateAnalyticsMetrics(activities, users, period) {
            const metrics = {
                period: period,
                totalActivities: activities.length,
                totalCalls: countActivityType(activities, 'call'),
                totalEmails: countActivityType(activities, 'email'),
                totalMeetings: countActivityType(activities, 'meeting'),
                totalLinkedIn: countActivityType(activities, 'linkedin'),
                
                // User metrics
                activeUsers: getActiveUserCount(activities),
                avgActivitiesPerUser: activities.length / Math.max(users.length, 1),
                
                // Performance metrics
                conversionRate: calculateConversionRate(activities),
                responseRate: calculateResponseRate(activities),
                
                // Financial metrics
                totalPipeline: calculateTotalPipeline(activities),
                totalRevenue: calculateTotalRevenue(activities),
                avgDealSize: calculateAvgDealSize(activities),
                
                // Trend data
                dailyTrend: calculateDailyTrend(activities, period),
                activityBreakdown: getActivityBreakdown(activities),
                
                // Goals progress
                goalsProgress: calculateGoalsProgress(activities, period)
            };
            
            return metrics;
        }
        
        function countActivityType(activities, type) {
            return activities.filter(a => {
                return a.type === type || 
                       a.activityType === type ||
                       (type === 'call' && (a.calls || a.callsMade)) ||
                       (type === 'email' && (a.emails || a.emailsSent)) ||
                       (type === 'meeting' && (a.meetings || a.meetingsBooked)) ||
                       (type === 'linkedin' && (a.linkedin || a.linkedinMessages));
            }).length;
        }
        
        function getActiveUserCount(activities) {
            const userSet = new Set();
            activities.forEach(a => {
                const userId = a.userId || a.user_id || a.userEmail;
                if (userId) userSet.add(userId);
            });
            return userSet.size;
        }
        
        function calculateConversionRate(activities) {
            const outreach = countActivityType(activities, 'call') + countActivityType(activities, 'email');
            const meetings = countActivityType(activities, 'meeting');
            return outreach > 0 ? Math.round((meetings / outreach) * 100) : 0;
        }
        
        function calculateResponseRate(activities) {
            const sent = countActivityType(activities, 'email') + countActivityType(activities, 'linkedin');
            const responses = activities.filter(a => a.response || a.replied).length;
            return sent > 0 ? Math.round((responses / sent) * 100) : 0;
        }
        
        function calculateTotalPipeline(activities) {
            return activities.reduce((sum, a) => {
                return sum + parseFloat(a.pipeline || a.pipelineGenerated || 0);
            }, 0);
        }
        
        function calculateTotalRevenue(activities) {
            return activities.reduce((sum, a) => {
                return sum + parseFloat(a.revenue || a.revenueClosed || 0);
            }, 0);
        }
        
        function calculateAvgDealSize(activities) {
            const deals = activities.filter(a => a.revenue || a.revenueClosed);
            if (deals.length === 0) return 0;
            const total = deals.reduce((sum, a) => sum + parseFloat(a.revenue || a.revenueClosed || 0), 0);
            return Math.round(total / deals.length);
        }
        
        function calculateDailyTrend(activities, period) {
            const days = period === 'week' ? 7 : 30;
            const trend = [];
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);
                
                const dayActivities = activities.filter(a => {
                    const activityDate = new Date(a.timestamp || a.date || a.createdAt);
                    return activityDate >= date && activityDate < nextDate;
                });
                
                trend.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    count: dayActivities.length,
                    calls: countActivityType(dayActivities, 'call'),
                    emails: countActivityType(dayActivities, 'email'),
                    meetings: countActivityType(dayActivities, 'meeting')
                });
            }
            
            return trend;
        }
        
        function getActivityBreakdown(activities) {
            return {
                calls: countActivityType(activities, 'call'),
                emails: countActivityType(activities, 'email'),
                meetings: countActivityType(activities, 'meeting'),
                linkedin: countActivityType(activities, 'linkedin')
            };
        }
        
        function calculateGoalsProgress(activities, period) {
            // Get goals for the period
            const goals = JSON.parse(localStorage.getItem('spt_goals') || '[]');
            const currentGoals = goals.filter(g => g.period === period);
            
            if (currentGoals.length === 0) {
                // Default goals
                return {
                    calls: { actual: countActivityType(activities, 'call'), target: period === 'week' ? 100 : 400 },
                    emails: { actual: countActivityType(activities, 'email'), target: period === 'week' ? 150 : 600 },
                    meetings: { actual: countActivityType(activities, 'meeting'), target: period === 'week' ? 10 : 40 },
                    pipeline: { actual: calculateTotalPipeline(activities), target: period === 'week' ? 50000 : 200000 }
                };
            }
            
            return currentGoals[0];
        }
        
        function updateAnalyticsDisplay(metrics, period) {
            console.log('[VISUAL-FIX] Updating analytics display with metrics:', metrics);
            
            // Ensure analytics section exists
            ensureAnalyticsSection();
            
            // Update KPI cards
            updateKPICard('analytics-total-activities', metrics.totalActivities, 'Total Activities');
            updateKPICard('analytics-total-calls', metrics.totalCalls, 'Total Calls');
            updateKPICard('analytics-total-emails', metrics.totalEmails, 'Total Emails');
            updateKPICard('analytics-total-meetings', metrics.totalMeetings, 'Total Meetings');
            updateKPICard('analytics-active-users', metrics.activeUsers, 'Active Users');
            updateKPICard('analytics-conversion-rate', `${metrics.conversionRate}%`, 'Conversion Rate');
            updateKPICard('analytics-pipeline', `$${metrics.totalPipeline.toLocaleString()}`, 'Pipeline');
            updateKPICard('analytics-revenue', `$${metrics.totalRevenue.toLocaleString()}`, 'Revenue');
            
            // Update period indicator
            const periodText = period === 'week' ? 'Last 7 Days' : 'Last 30 Days';
            updateElement('analytics-period-display', periodText);
        }
    }
    
    // ================================
    // FIX 2: Add Radial Gauges and Charts
    // ================================
    function addRadialGauges() {
        console.log('[VISUAL-FIX] Adding radial gauges...');
        
        window.createRadialGauge = function(containerId, value, max, label, color = '#4F46E5') {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const percentage = Math.min(Math.round((value / max) * 100), 100);
            const radius = 60;
            const strokeWidth = 10;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percentage / 100) * circumference;
            
            container.innerHTML = `
                <div class="relative inline-flex items-center justify-center">
                    <svg width="140" height="140" class="transform -rotate-90">
                        <circle
                            cx="70"
                            cy="70"
                            r="${radius}"
                            stroke="#E5E7EB"
                            stroke-width="${strokeWidth}"
                            fill="none"
                        />
                        <circle
                            cx="70"
                            cy="70"
                            r="${radius}"
                            stroke="${color}"
                            stroke-width="${strokeWidth}"
                            fill="none"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"
                            stroke-linecap="round"
                            class="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-3xl font-bold" style="color: ${color};">${percentage}%</span>
                        <span class="text-xs text-gray-600">${label}</span>
                    </div>
                </div>
            `;
        };
        
        window.createGaugeChart = function(containerId, value, max, label, segments = [
            { threshold: 0.3, color: '#EF4444' },
            { threshold: 0.6, color: '#F59E0B' },
            { threshold: 0.8, color: '#10B981' },
            { threshold: 1.0, color: '#059669' }
        ]) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const percentage = Math.min(value / max, 1);
            let gaugeColor = segments[0].color;
            
            for (const segment of segments) {
                if (percentage <= segment.threshold) {
                    gaugeColor = segment.color;
                    break;
                }
            }
            
            container.innerHTML = `
                <div class="gauge-chart">
                    <div class="gauge-background" style="background: conic-gradient(
                        ${gaugeColor} 0deg ${percentage * 180}deg,
                        #E5E7EB ${percentage * 180}deg 180deg,
                        transparent 180deg
                    );">
                        <div class="gauge-center bg-white">
                            <div class="text-2xl font-bold" style="color: ${gaugeColor};">${value}</div>
                            <div class="text-xs text-gray-600">${label}</div>
                        </div>
                    </div>
                </div>
                <style>
                    .gauge-chart {
                        position: relative;
                        width: 150px;
                        height: 75px;
                        margin: 0 auto;
                    }
                    .gauge-background {
                        width: 150px;
                        height: 150px;
                        border-radius: 150px 150px 0 0;
                        position: relative;
                        overflow: hidden;
                    }
                    .gauge-center {
                        position: absolute;
                        bottom: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100px;
                        height: 50px;
                        border-radius: 100px 100px 0 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                </style>
            `;
        };
    }
    
    // ================================
    // FIX 3: Add KPI Cards and Metric Tiles
    // ================================
    function addKPICards() {
        console.log('[VISUAL-FIX] Adding KPI cards and metric tiles...');
        
        window.createKPICard = function(config) {
            const {
                title,
                value,
                change,
                changeType = 'increase', // increase, decrease, neutral
                icon,
                iconColor = 'indigo',
                trend = [],
                sparkline = false
            } = config;
            
            const changeIcon = changeType === 'increase' ? 'arrow-up' : 
                              changeType === 'decrease' ? 'arrow-down' : 'minus';
            const changeColor = changeType === 'increase' ? 'green' : 
                               changeType === 'decrease' ? 'red' : 'gray';
            
            let sparklineHTML = '';
            if (sparkline && trend.length > 0) {
                const max = Math.max(...trend);
                const min = Math.min(...trend);
                const range = max - min || 1;
                const points = trend.map((val, i) => {
                    const x = (i / (trend.length - 1)) * 100;
                    const y = 50 - ((val - min) / range) * 40;
                    return `${x},${y}`;
                }).join(' ');
                
                sparklineHTML = `
                    <svg class="w-full h-12 mt-2" viewBox="0 0 100 60">
                        <polyline
                            fill="none"
                            stroke="${changeType === 'increase' ? '#10B981' : '#EF4444'}"
                            stroke-width="2"
                            points="${points}"
                        />
                    </svg>
                `;
            }
            
            return `
                <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <div class="p-2 bg-${iconColor}-100 rounded-lg mr-3">
                                <i class="fas fa-${icon} text-${iconColor}-600"></i>
                            </div>
                            <h3 class="text-sm font-medium text-gray-600">${title}</h3>
                        </div>
                        ${change ? `
                            <div class="flex items-center text-sm text-${changeColor}-600">
                                <i class="fas fa-${changeIcon} mr-1"></i>
                                <span>${change}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="text-3xl font-bold text-gray-900">${value}</div>
                    ${sparklineHTML}
                </div>
            `;
        };
        
        window.createMetricTile = function(config) {
            const {
                label,
                value,
                target,
                unit = '',
                color = 'indigo',
                size = 'medium' // small, medium, large
            } = config;
            
            const percentage = target ? Math.round((value / target) * 100) : 0;
            const sizeClasses = {
                small: 'p-4 text-2xl',
                medium: 'p-6 text-3xl',
                large: 'p-8 text-4xl'
            };
            
            return `
                <div class="bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg shadow-lg ${sizeClasses[size]} text-white">
                    <div class="flex flex-col h-full justify-between">
                        <div>
                            <h4 class="text-sm opacity-90 mb-2">${label}</h4>
                            <div class="font-bold">
                                ${value}${unit}
                            </div>
                        </div>
                        ${target ? `
                            <div class="mt-4">
                                <div class="flex justify-between text-xs opacity-75 mb-1">
                                    <span>Progress</span>
                                    <span>${percentage}%</span>
                                </div>
                                <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                                    <div class="bg-white rounded-full h-2 transition-all duration-500" style="width: ${Math.min(percentage, 100)}%"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        };
    }
    
    // ================================
    // Visual Components Update
    // ================================
    function updateVisualComponents(metrics, period) {
        console.log('[VISUAL-FIX] Updating visual components...');
        
        // Add gauge charts for conversion metrics
        addConversionGauges(metrics);
        
        // Add activity trend chart
        addActivityTrendChart(metrics.dailyTrend);
        
        // Add goal progress gauges
        addGoalProgressGauges(metrics.goalsProgress);
        
        // Add performance KPI cards
        addPerformanceKPIs(metrics);
    }
    
    function addConversionGauges(metrics) {
        // Add conversion rate gauge
        const conversionGauge = document.getElementById('conversion-rate-gauge');
        if (conversionGauge) {
            createRadialGauge('conversion-rate-gauge', metrics.conversionRate, 100, 'Conversion', '#10B981');
        }
        
        // Add response rate gauge
        const responseGauge = document.getElementById('response-rate-gauge');
        if (responseGauge) {
            createRadialGauge('response-rate-gauge', metrics.responseRate, 100, 'Response', '#3B82F6');
        }
    }
    
    function addActivityTrendChart(trend) {
        const chartContainer = document.getElementById('activity-trend-chart');
        if (!chartContainer) return;
        
        // Create mini bar chart
        const maxValue = Math.max(...trend.map(d => d.count)) || 1;
        
        let chartHTML = `
            <div class="bg-white rounded-lg shadow p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Activity Trend</h4>
                <div class="flex items-end space-x-1" style="height: 100px;">
        `;
        
        trend.forEach(day => {
            const height = (day.count / maxValue) * 100;
            chartHTML += `
                <div class="flex-1 bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all duration-300 relative group"
                     style="height: ${height}%;">
                    <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        ${day.count} activities
                        <br>${day.date}
                    </div>
                </div>
            `;
        });
        
        chartHTML += `
                </div>
            </div>
        `;
        
        chartContainer.innerHTML = chartHTML;
    }
    
    function addGoalProgressGauges(goals) {
        if (!goals) return;
        
        // Create gauge for each goal
        Object.entries(goals).forEach(([key, goal]) => {
            const gaugeId = `goal-${key}-gauge`;
            const gaugeContainer = document.getElementById(gaugeId);
            
            if (gaugeContainer && goal.target) {
                createGaugeChart(gaugeId, goal.actual, goal.target, key.charAt(0).toUpperCase() + key.slice(1));
            }
        });
    }
    
    function addPerformanceKPIs(metrics) {
        const kpiContainer = document.getElementById('performance-kpis');
        if (!kpiContainer) return;
        
        const kpiConfigs = [
            {
                title: 'Activities Today',
                value: metrics.dailyTrend[metrics.dailyTrend.length - 1]?.count || 0,
                change: '+12%',
                changeType: 'increase',
                icon: 'chart-line',
                iconColor: 'indigo'
            },
            {
                title: 'Avg Deal Size',
                value: `$${metrics.avgDealSize.toLocaleString()}`,
                change: '+8%',
                changeType: 'increase',
                icon: 'dollar-sign',
                iconColor: 'green'
            },
            {
                title: 'Active Users',
                value: metrics.activeUsers,
                change: '0%',
                changeType: 'neutral',
                icon: 'users',
                iconColor: 'blue'
            },
            {
                title: 'Response Rate',
                value: `${metrics.responseRate}%`,
                change: '-3%',
                changeType: 'decrease',
                icon: 'reply',
                iconColor: 'purple'
            }
        ];
        
        let kpiHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">';
        kpiConfigs.forEach(config => {
            kpiHTML += createKPICard(config);
        });
        kpiHTML += '</div>';
        
        kpiContainer.innerHTML = kpiHTML;
    }
    
    // ================================
    // Helper Functions
    // ================================
    function updateKPICard(id, value, label) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = value;
        }
    }
    
    function updateElement(id, value) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = value;
        }
    }
    
    function ensureAnalyticsSection() {
        const analyticsSection = document.getElementById('analytics-section');
        if (!analyticsSection) return;
        
        // Add enhanced analytics layout if it doesn't exist
        if (!document.getElementById('analytics-enhanced-layout')) {
            const enhancedHTML = `
                <div id="analytics-enhanced-layout" class="space-y-6">
                    <!-- Period Selector -->
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
                            <div class="flex items-center space-x-4">
                                <span class="text-sm text-gray-600">View:</span>
                                <div class="flex space-x-2">
                                    <button onclick="loadAnalyticsData('week')" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium transition-colors">
                                        Week
                                    </button>
                                    <button onclick="loadAnalyticsData('month')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors">
                                        Month
                                    </button>
                                </div>
                                <span id="analytics-period-indicator" class="text-sm font-medium text-indigo-600">Last 7 Days</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- KPI Cards Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-600">Total Activities</span>
                                <i class="fas fa-chart-line text-indigo-600"></i>
                            </div>
                            <div class="text-3xl font-bold text-gray-900" id="analytics-total-activities">0</div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-600">Calls</span>
                                <i class="fas fa-phone text-blue-600"></i>
                            </div>
                            <div class="text-3xl font-bold text-gray-900" id="analytics-total-calls">0</div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-600">Emails</span>
                                <i class="fas fa-envelope text-green-600"></i>
                            </div>
                            <div class="text-3xl font-bold text-gray-900" id="analytics-total-emails">0</div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-600">Meetings</span>
                                <i class="fas fa-calendar text-purple-600"></i>
                            </div>
                            <div class="text-3xl font-bold text-gray-900" id="analytics-total-meetings">0</div>
                        </div>
                    </div>
                    
                    <!-- Gauges Row -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">Conversion Rate</h3>
                            <div id="conversion-rate-gauge" class="flex justify-center"></div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">Response Rate</h3>
                            <div id="response-rate-gauge" class="flex justify-center"></div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">Goal Progress</h3>
                            <div id="goal-calls-gauge" class="flex justify-center"></div>
                        </div>
                    </div>
                    
                    <!-- Trend Chart -->
                    <div id="activity-trend-chart"></div>
                    
                    <!-- Performance KPIs -->
                    <div id="performance-kpis"></div>
                    
                    <!-- Financial Metrics -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
                            <h4 class="text-sm opacity-90 mb-2">Pipeline Generated</h4>
                            <div class="text-3xl font-bold" id="analytics-pipeline">$0</div>
                            <div class="mt-4 text-sm opacity-75">
                                <i class="fas fa-arrow-up mr-1"></i> 15% from last period
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                            <h4 class="text-sm opacity-90 mb-2">Revenue Closed</h4>
                            <div class="text-3xl font-bold" id="analytics-revenue">$0</div>
                            <div class="mt-4 text-sm opacity-75">
                                <i class="fas fa-arrow-up mr-1"></i> 22% from last period
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            analyticsSection.innerHTML = enhancedHTML;
        }
    }
    
    // ================================
    // INITIALIZATION
    // ================================
    function initialize() {
        console.log('[VISUAL-FIX] Initializing visual analytics enhancements...');
        
        // Apply fixes
        fixAnalyticsViewSwitching();
        addRadialGauges();
        addKPICards();
        
        // Make functions globally available
        window.createRadialGauge = createRadialGauge;
        window.createGaugeChart = createGaugeChart;
        window.createKPICard = createKPICard;
        window.createMetricTile = createMetricTile;
        
        // Auto-enhance sections when shown
        const originalShowSection = window.showSection;
        window.showSection = function(sectionName) {
            if (typeof originalShowSection === 'function') {
                originalShowSection(sectionName);
            }
            
            // Add visual enhancements based on section
            setTimeout(() => {
                if (sectionName === 'analytics') {
                    window.loadAnalyticsData(window.currentAnalyticsPeriod || 'week');
                } else if (sectionName === 'dashboard') {
                    enhanceDashboard();
                }
            }, 100);
        };
        
        function enhanceDashboard() {
            // Add gauges to dashboard if they don't exist
            const dashboardSection = document.getElementById('dashboard-section');
            if (!dashboardSection) return;
            
            // Add performance gauge container if it doesn't exist
            if (!document.getElementById('dashboard-gauges')) {
                const gaugeContainer = document.createElement('div');
                gaugeContainer.id = 'dashboard-gauges';
                gaugeContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mt-6';
                gaugeContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow p-4">
                        <div id="dashboard-performance-gauge"></div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-4">
                        <div id="dashboard-activity-gauge"></div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-4">
                        <div id="dashboard-goal-gauge"></div>
                    </div>
                `;
                
                const firstCard = dashboardSection.querySelector('.grid');
                if (firstCard) {
                    firstCard.parentNode.insertBefore(gaugeContainer, firstCard.nextSibling);
                }
            }
            
            // Update dashboard gauges with sample data
            setTimeout(() => {
                createRadialGauge('dashboard-performance-gauge', 75, 100, 'Performance', '#10B981');
                createRadialGauge('dashboard-activity-gauge', 62, 100, 'Activity Rate', '#3B82F6');
                createRadialGauge('dashboard-goal-gauge', 88, 100, 'Goal Progress', '#F59E0B');
            }, 200);
        }
        
        console.log('[VISUAL-FIX] Visual analytics enhancements initialized');
    }
    
    // Wait for DOM and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }
    
    console.log('✨ VISUAL ANALYTICS ENHANCEMENTS LOADED!');
})();