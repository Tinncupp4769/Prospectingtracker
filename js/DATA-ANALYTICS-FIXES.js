// ========================================
// COMPREHENSIVE DATA, ANALYTICS, AND LEADERBOARD FIXES
// Fixes: Reset user data dropdown, Analytics data display, Leaderboard calculations
// ========================================

console.log('🔧 DATA & ANALYTICS FIXES LOADING...');

(function() {
    'use strict';
    
    // ================================
    // FIX 1: Reset User Data Dropdown
    // ================================
    function fixResetUserDataDropdown() {
        console.log('[DATA-FIX] Fixing reset user data dropdown...');
        
        // Function to populate the dropdown
        window.populateResetUserDropdown = function() {
            console.log('[DATA-FIX] Populating reset user dropdown...');
            
            const dropdown = document.getElementById('reset-user-selector');
            if (!dropdown) {
                console.error('[DATA-FIX] Reset user dropdown not found');
                return;
            }
            
            // Get all users
            const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
            const sptUsers = JSON.parse(localStorage.getItem('spt_users') || '[]');
            
            // Combine and deduplicate
            const allUsers = [...users];
            const seenIds = new Set(users.map(u => u.id));
            
            sptUsers.forEach(user => {
                if (!seenIds.has(user.id)) {
                    allUsers.push(user);
                    seenIds.add(user.id);
                }
            });
            
            // Clear and populate dropdown
            dropdown.innerHTML = '<option value="">Select a user...</option>';
            
            allUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id || user.email;
                option.textContent = `${user.name || `${user.firstName} ${user.lastName}`} (${user.email}) - ${user.role === 'ae' ? 'AE' : user.role === 'am' ? 'AM' : 'Admin'}`;
                dropdown.appendChild(option);
            });
            
            console.log(`[DATA-FIX] Populated dropdown with ${allUsers.length} users`);
        };
        
        // Function to reset user data
        window.confirmResetUserData = function() {
            const dropdown = document.getElementById('reset-user-selector');
            if (!dropdown || !dropdown.value) {
                alert('Please select a user first');
                return;
            }
            
            const userId = dropdown.value;
            const users = [...JSON.parse(localStorage.getItem('unified_users') || '[]'), 
                          ...JSON.parse(localStorage.getItem('spt_users') || '[]')];
            const user = users.find(u => u.id === userId || u.email === userId);
            
            if (!user) {
                alert('User not found');
                return;
            }
            
            const userName = user.name || `${user.firstName} ${user.lastName}`;
            
            if (!confirm(`⚠️ WARNING!\n\nThis will delete ALL activity records for:\n${userName} (${user.email})\n\nAre you sure?`)) {
                return;
            }
            
            // Delete user's activities
            deleteUserActivities(userId, userName);
        };
        
        function deleteUserActivities(userId, userName) {
            console.log(`[DATA-FIX] Deleting activities for user: ${userId}`);
            
            // Get current activities
            let activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            const originalCount = activities.length;
            
            // Filter out user's activities
            activities = activities.filter(a => 
                a.userId !== userId && 
                a.user_id !== userId && 
                a.userEmail !== userId
            );
            
            const deletedCount = originalCount - activities.length;
            
            // Save updated activities
            localStorage.setItem('spt_activities', JSON.stringify(activities));
            
            // Update display
            alert(`✅ Successfully deleted ${deletedCount} activities for ${userName}`);
            
            // Reset dropdown
            document.getElementById('reset-user-selector').value = '';
            
            // Refresh statistics
            updateDataStatistics();
            
            // Refresh leaderboard if visible
            if (typeof window.loadLeaderboard === 'function') {
                window.loadLeaderboard();
            }
            
            // Refresh analytics if visible
            if (typeof window.loadAnalyticsData === 'function') {
                window.loadAnalyticsData();
            }
            
            console.log(`[DATA-FIX] Deleted ${deletedCount} activities for ${userName}`);
        }
        
        // Auto-populate when users section is shown
        const originalShowSection = window.showSection;
        window.showSection = function(sectionName) {
            if (typeof originalShowSection === 'function') {
                originalShowSection(sectionName);
            }
            
            if (sectionName === 'users') {
                setTimeout(() => {
                    populateResetUserDropdown();
                    updateDataStatistics();
                }, 100);
            }
        };
    }
    
    // ================================
    // FIX 2: Analytics Dashboard Data Display
    // ================================
    function fixAnalyticsDashboard() {
        console.log('[DATA-FIX] Fixing analytics dashboard...');
        
        window.loadAnalyticsData = function(period = 'week') {
            console.log(`[DATA-FIX] Loading analytics data for: ${period}`);
            
            // Get all activities
            const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
            
            console.log(`[DATA-FIX] Found ${activities.length} total activities`);
            
            // Calculate date range
            const now = new Date();
            const startDate = new Date();
            
            if (period === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (period === 'month') {
                startDate.setDate(now.getDate() - 30);
            }
            
            // Filter activities by period
            const filteredActivities = activities.filter(a => {
                const activityDate = new Date(a.timestamp || a.date || a.createdAt || Date.now());
                return activityDate >= startDate && activityDate <= now;
            });
            
            console.log(`[DATA-FIX] Filtered to ${filteredActivities.length} activities for ${period}`);
            
            // Calculate comprehensive metrics
            const metrics = {
                // Overall metrics
                totalActivities: filteredActivities.length,
                totalCalls: countActivityType(filteredActivities, 'call'),
                totalEmails: countActivityType(filteredActivities, 'email'),
                totalMeetings: countActivityType(filteredActivities, 'meeting'),
                totalLinkedIn: countActivityType(filteredActivities, 'linkedin'),
                
                // User metrics
                activeUsers: getActiveUsers(filteredActivities),
                userBreakdown: getUserBreakdown(filteredActivities, users),
                
                // Role-specific metrics
                aeMetrics: getRoleMetrics(filteredActivities, 'ae'),
                amMetrics: getRoleMetrics(filteredActivities, 'am'),
                
                // Performance metrics
                conversionRate: calculateConversionRate(filteredActivities),
                avgActivitiesPerUser: filteredActivities.length / Math.max(users.length, 1),
                
                // Time-based metrics
                dailyTrend: getDailyTrend(filteredActivities, period),
                weeklyComparison: getWeeklyComparison(activities),
                
                // Financial metrics
                totalPipeline: calculateTotalPipeline(filteredActivities),
                totalRevenue: calculateTotalRevenue(filteredActivities)
            };
            
            // Update the analytics display
            updateAnalyticsDisplay(metrics, period);
            
            // Update charts if available
            if (typeof window.updateAnalyticsCharts === 'function') {
                window.updateAnalyticsCharts(metrics, period);
            }
            
            return metrics;
        };
        
        function countActivityType(activities, type) {
            return activities.filter(a => {
                // Check multiple possible field names
                return a.type === type || 
                       a.activityType === type || 
                       a.activity_type === type ||
                       (type === 'call' && (a.calls || a['calls-made'] || a.callsMade)) ||
                       (type === 'email' && (a.emails || a['emails-sent'] || a.emailsSent)) ||
                       (type === 'meeting' && (a.meetings || a['meetings-booked'] || a.meetingsBooked)) ||
                       (type === 'linkedin' && (a.linkedin || a['linkedin-messages'] || a.linkedinMessages));
            }).length;
        }
        
        function getActiveUsers(activities) {
            const userSet = new Set();
            activities.forEach(a => {
                const userId = a.userId || a.user_id || a.userEmail || a.user;
                if (userId) userSet.add(userId);
            });
            return userSet.size;
        }
        
        function getUserBreakdown(activities, users) {
            const breakdown = {};
            
            users.forEach(user => {
                const userId = user.id || user.email;
                const userActivities = activities.filter(a => 
                    a.userId === userId || 
                    a.user_id === userId || 
                    a.userEmail === user.email
                );
                
                breakdown[user.name || `${user.firstName} ${user.lastName}`] = {
                    total: userActivities.length,
                    calls: countActivityType(userActivities, 'call'),
                    emails: countActivityType(userActivities, 'email'),
                    meetings: countActivityType(userActivities, 'meeting'),
                    role: user.role
                };
            });
            
            return breakdown;
        }
        
        function getRoleMetrics(activities, role) {
            const roleActivities = activities.filter(a => {
                // Check if activity belongs to this role
                return a.role === role || a.userRole === role || a.user_role === role;
            });
            
            return {
                total: roleActivities.length,
                calls: countActivityType(roleActivities, 'call'),
                emails: countActivityType(roleActivities, 'email'),
                meetings: countActivityType(roleActivities, 'meeting'),
                linkedin: countActivityType(roleActivities, 'linkedin')
            };
        }
        
        function calculateConversionRate(activities) {
            const totalOutreach = countActivityType(activities, 'call') + countActivityType(activities, 'email');
            const meetings = countActivityType(activities, 'meeting');
            
            if (totalOutreach === 0) return 0;
            return Math.round((meetings / totalOutreach) * 100);
        }
        
        function getDailyTrend(activities, period) {
            const trend = [];
            const days = period === 'week' ? 7 : 30;
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                
                const dayActivities = activities.filter(a => {
                    const activityDate = new Date(a.timestamp || a.date || a.createdAt);
                    return activityDate >= date && activityDate < nextDate;
                });
                
                trend.push({
                    date: date.toLocaleDateString(),
                    count: dayActivities.length
                });
            }
            
            return trend;
        }
        
        function getWeeklyComparison(allActivities) {
            const thisWeek = new Date();
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            
            const thisWeekCount = allActivities.filter(a => {
                const date = new Date(a.timestamp || a.date || a.createdAt);
                return date >= lastWeek && date <= thisWeek;
            }).length;
            
            const lastWeekCount = allActivities.filter(a => {
                const date = new Date(a.timestamp || a.date || a.createdAt);
                return date >= twoWeeksAgo && date < lastWeek;
            }).length;
            
            const change = lastWeekCount === 0 ? 100 : 
                          Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
            
            return {
                thisWeek: thisWeekCount,
                lastWeek: lastWeekCount,
                change: change
            };
        }
        
        function calculateTotalPipeline(activities) {
            let total = 0;
            activities.forEach(a => {
                const pipeline = parseFloat(a.pipeline || a['pipeline-generated'] || a.pipelineGenerated || 0);
                total += pipeline;
            });
            return total;
        }
        
        function calculateTotalRevenue(activities) {
            let total = 0;
            activities.forEach(a => {
                const revenue = parseFloat(a.revenue || a['revenue-closed'] || a.revenueClosed || 0);
                total += revenue;
            });
            return total;
        }
        
        function updateAnalyticsDisplay(metrics, period) {
            console.log('[DATA-FIX] Updating analytics display with:', metrics);
            
            // Update summary cards
            updateElement('analytics-total-activities', metrics.totalActivities);
            updateElement('analytics-total-calls', metrics.totalCalls);
            updateElement('analytics-total-emails', metrics.totalEmails);
            updateElement('analytics-total-meetings', metrics.totalMeetings);
            updateElement('analytics-active-users', metrics.activeUsers);
            updateElement('analytics-conversion-rate', `${metrics.conversionRate}%`);
            updateElement('analytics-avg-activities', Math.round(metrics.avgActivitiesPerUser));
            updateElement('analytics-total-pipeline', `$${metrics.totalPipeline.toLocaleString()}`);
            updateElement('analytics-total-revenue', `$${metrics.totalRevenue.toLocaleString()}`);
            
            // Update period indicator
            updateElement('analytics-period', period === 'week' ? 'This Week' : 'This Month');
            
            // Update comparison
            const comparison = metrics.weeklyComparison;
            updateElement('analytics-week-comparison', 
                `${comparison.change >= 0 ? '↑' : '↓'} ${Math.abs(comparison.change)}% vs last week`);
            
            // Update user breakdown table if exists
            const breakdownTable = document.getElementById('analytics-user-breakdown');
            if (breakdownTable) {
                let html = '<thead><tr><th>User</th><th>Role</th><th>Total</th><th>Calls</th><th>Emails</th><th>Meetings</th></tr></thead><tbody>';
                
                Object.entries(metrics.userBreakdown).forEach(([name, data]) => {
                    html += `
                        <tr>
                            <td class="font-medium">${name}</td>
                            <td>${data.role === 'ae' ? 'AE' : data.role === 'am' ? 'AM' : 'Admin'}</td>
                            <td>${data.total}</td>
                            <td>${data.calls}</td>
                            <td>${data.emails}</td>
                            <td>${data.meetings}</td>
                        </tr>
                    `;
                });
                
                html += '</tbody>';
                breakdownTable.innerHTML = html;
            }
            
            // Create analytics section if it doesn't exist
            ensureAnalyticsSection();
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
            
            // Check if content exists
            if (!document.getElementById('analytics-total-activities')) {
                // Create analytics content
                const analyticsHTML = `
                    <div class="mb-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">Analytics & Insights</h2>
                        
                        <!-- Period Selector -->
                        <div class="bg-white rounded-lg shadow p-4 mb-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <span class="text-sm font-medium text-gray-700">Period:</span>
                                    <button onclick="loadAnalyticsData('week')" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">This Week</button>
                                    <button onclick="loadAnalyticsData('month')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">This Month</button>
                                </div>
                                <span id="analytics-period" class="text-sm text-gray-600">This Week</span>
                            </div>
                        </div>
                        
                        <!-- Summary Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Total Activities</p>
                                <p class="text-3xl font-bold text-gray-900" id="analytics-total-activities">0</p>
                                <p class="text-xs text-gray-500" id="analytics-week-comparison">Loading...</p>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Total Calls</p>
                                <p class="text-3xl font-bold text-blue-600" id="analytics-total-calls">0</p>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Total Emails</p>
                                <p class="text-3xl font-bold text-green-600" id="analytics-total-emails">0</p>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Total Meetings</p>
                                <p class="text-3xl font-bold text-purple-600" id="analytics-total-meetings">0</p>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Active Users</p>
                                <p class="text-3xl font-bold text-indigo-600" id="analytics-active-users">0</p>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Conversion Rate</p>
                                <p class="text-3xl font-bold text-orange-600" id="analytics-conversion-rate">0%</p>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Pipeline Generated</p>
                                <p class="text-2xl font-bold text-emerald-600" id="analytics-total-pipeline">$0</p>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6">
                                <p class="text-sm text-gray-600">Revenue Closed</p>
                                <p class="text-2xl font-bold text-green-600" id="analytics-total-revenue">$0</p>
                            </div>
                        </div>
                        
                        <!-- User Breakdown Table -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">User Performance Breakdown</h3>
                            <div class="overflow-x-auto">
                                <table class="min-w-full" id="analytics-user-breakdown">
                                    <!-- Table content populated by JavaScript -->
                                </table>
                            </div>
                        </div>
                    </div>
                `;
                
                analyticsSection.innerHTML = analyticsHTML;
            }
        }
    }
    
    // ================================
    // FIX 3: Leaderboard Calculations and Refresh
    // ================================
    function fixLeaderboardCalculations() {
        console.log('[DATA-FIX] Fixing leaderboard calculations...');
        
        window.loadLeaderboard = function() {
            console.log('[DATA-FIX] Loading leaderboard with accurate calculations...');
            
            const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
            const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
            
            console.log(`[DATA-FIX] Processing ${activities.length} activities for ${users.length} users`);
            
            // Calculate user scores
            const userScores = {};
            
            // Initialize all users
            users.forEach(user => {
                const userId = user.id || user.email;
                userScores[userId] = {
                    user: user,
                    name: user.name || `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    activities: 0,
                    calls: 0,
                    emails: 0,
                    meetings: 0,
                    linkedin: 0,
                    points: 0,
                    pipeline: 0,
                    revenue: 0
                };
            });
            
            // Process activities
            activities.forEach(activity => {
                const userId = activity.userId || activity.user_id || activity.userEmail;
                
                if (!userId || !userScores[userId]) {
                    // Try to match by email
                    const user = users.find(u => u.email === userId);
                    if (user) {
                        const actualUserId = user.id || user.email;
                        if (!userScores[actualUserId]) {
                            userScores[actualUserId] = {
                                user: user,
                                name: user.name || `${user.firstName} ${user.lastName}`,
                                role: user.role,
                                activities: 0,
                                calls: 0,
                                emails: 0,
                                meetings: 0,
                                linkedin: 0,
                                points: 0,
                                pipeline: 0,
                                revenue: 0
                            };
                        }
                        processActivity(userScores[actualUserId], activity);
                    }
                } else {
                    processActivity(userScores[userId], activity);
                }
            });
            
            // Convert to array and sort by points
            const leaderboardData = Object.values(userScores)
                .sort((a, b) => b.points - a.points)
                .map((score, index) => ({
                    ...score,
                    rank: index + 1
                }));
            
            // Update leaderboard display
            updateLeaderboardDisplay(leaderboardData);
            
            console.log('[DATA-FIX] Leaderboard updated with accurate data');
            
            return leaderboardData;
        };
        
        function processActivity(userScore, activity) {
            userScore.activities++;
            
            // Count activity types
            if (activity.type === 'call' || activity.calls || activity['calls-made'] || activity.callsMade) {
                const callCount = parseInt(activity.calls || activity['calls-made'] || activity.callsMade || 1);
                userScore.calls += callCount;
                userScore.points += callCount * 10; // 10 points per call
            }
            
            if (activity.type === 'email' || activity.emails || activity['emails-sent'] || activity.emailsSent) {
                const emailCount = parseInt(activity.emails || activity['emails-sent'] || activity.emailsSent || 1);
                userScore.emails += emailCount;
                userScore.points += emailCount * 5; // 5 points per email
            }
            
            if (activity.type === 'meeting' || activity.meetings || activity['meetings-booked'] || activity.meetingsBooked) {
                const meetingCount = parseInt(activity.meetings || activity['meetings-booked'] || activity.meetingsBooked || 1);
                userScore.meetings += meetingCount;
                userScore.points += meetingCount * 25; // 25 points per meeting
            }
            
            if (activity.type === 'linkedin' || activity.linkedin || activity['linkedin-messages'] || activity.linkedinMessages) {
                const linkedinCount = parseInt(activity.linkedin || activity['linkedin-messages'] || activity.linkedinMessages || 1);
                userScore.linkedin += linkedinCount;
                userScore.points += linkedinCount * 7; // 7 points per LinkedIn message
            }
            
            // Add pipeline and revenue
            const pipeline = parseFloat(activity.pipeline || activity['pipeline-generated'] || activity.pipelineGenerated || 0);
            const revenue = parseFloat(activity.revenue || activity['revenue-closed'] || activity.revenueClosed || 0);
            
            userScore.pipeline += pipeline;
            userScore.revenue += revenue;
            
            // Add bonus points for pipeline and revenue
            if (pipeline > 0) {
                userScore.points += Math.floor(pipeline / 1000); // 1 point per $1000 pipeline
            }
            if (revenue > 0) {
                userScore.points += Math.floor(revenue / 500); // 2 points per $1000 revenue (1 per $500)
            }
        }
        
        function updateLeaderboardDisplay(data) {
            const leaderboardSection = document.getElementById('leaderboard-section');
            if (!leaderboardSection) return;
            
            // Find or create leaderboard table
            let tableContainer = leaderboardSection.querySelector('.leaderboard-table-container');
            if (!tableContainer) {
                tableContainer = document.createElement('div');
                tableContainer.className = 'leaderboard-table-container bg-white rounded-lg shadow overflow-hidden';
                leaderboardSection.appendChild(tableContainer);
            }
            
            // Create table HTML
            let html = `
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Activities</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Emails</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Meetings</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">LinkedIn</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pipeline</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th class="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
            `;
            
            if (data.length === 0) {
                html += `
                    <tr>
                        <td colspan="10" class="py-8 text-center text-gray-500">
                            <i class="fas fa-trophy text-4xl mb-2 opacity-30"></i>
                            <p>No activity data yet. Start tracking activities to see the leaderboard!</p>
                        </td>
                    </tr>
                `;
            } else {
                data.forEach((user, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${user.rank}`;
                    const rowClass = index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : index === 2 ? 'bg-orange-50' : '';
                    
                    html += `
                        <tr class="${rowClass} hover:bg-gray-50 transition-colors">
                            <td class="py-3 px-4">
                                <span class="text-lg font-bold">${medal}</span>
                            </td>
                            <td class="py-3 px-4">
                                <div>
                                    <div class="font-medium text-gray-900">${user.name}</div>
                                    <div class="text-sm text-gray-500">${user.role === 'ae' ? 'Account Executive' : user.role === 'am' ? 'Account Manager' : 'Admin'}</div>
                                </div>
                            </td>
                            <td class="py-3 px-4 text-center font-medium">${user.activities}</td>
                            <td class="py-3 px-4 text-center">${user.calls}</td>
                            <td class="py-3 px-4 text-center">${user.emails}</td>
                            <td class="py-3 px-4 text-center">${user.meetings}</td>
                            <td class="py-3 px-4 text-center">${user.linkedin}</td>
                            <td class="py-3 px-4 text-center text-sm">$${user.pipeline.toLocaleString()}</td>
                            <td class="py-3 px-4 text-center text-sm">$${user.revenue.toLocaleString()}</td>
                            <td class="py-3 px-4 text-center">
                                <span class="px-2 py-1 text-sm font-bold rounded-full bg-indigo-100 text-indigo-800">
                                    ${user.points}
                                </span>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            tableContainer.innerHTML = html;
            
            // Add last updated timestamp
            const timestamp = document.createElement('div');
            timestamp.className = 'px-4 py-2 bg-gray-50 text-xs text-gray-500 text-right';
            timestamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            tableContainer.appendChild(timestamp);
        }
        
        // Setup auto-refresh when activities change
        setupActivityTracking();
    }
    
    // ================================
    // Activity Tracking for Auto-Refresh
    // ================================
    function setupActivityTracking() {
        console.log('[DATA-FIX] Setting up activity tracking for auto-refresh...');
        
        // Override activity save functions
        const originalSaveWeekData = window.saveWeekData;
        window.saveWeekData = function() {
            console.log('[DATA-FIX] Activity data being saved...');
            
            // Call original if exists
            if (typeof originalSaveWeekData === 'function') {
                originalSaveWeekData();
            }
            
            // Refresh displays
            setTimeout(() => {
                if (typeof window.loadLeaderboard === 'function') {
                    window.loadLeaderboard();
                }
                if (typeof window.loadAnalyticsData === 'function') {
                    window.loadAnalyticsData();
                }
            }, 500);
        };
        
        // Also track add to week total
        const originalAddToWeekTotal = window.addToWeekTotal;
        window.addToWeekTotal = function() {
            console.log('[DATA-FIX] Adding to week total...');
            
            // Call original if exists
            if (typeof originalAddToWeekTotal === 'function') {
                originalAddToWeekTotal();
            }
            
            // Refresh displays
            setTimeout(() => {
                if (typeof window.loadLeaderboard === 'function') {
                    window.loadLeaderboard();
                }
            }, 500);
        };
    }
    
    // ================================
    // Helper: Update Data Statistics
    // ================================
    function updateDataStatistics() {
        const activities = JSON.parse(localStorage.getItem('spt_activities') || '[]');
        const users = JSON.parse(localStorage.getItem('unified_users') || '[]');
        const goals = JSON.parse(localStorage.getItem('spt_goals') || '[]');
        
        updateElement('total-activities-count', activities.length);
        updateElement('total-users-count', users.length);
        updateElement('total-goals-count', goals.length);
        
        function updateElement(id, value) {
            const elem = document.getElementById(id);
            if (elem) {
                elem.textContent = value;
            }
        }
    }
    
    // ================================
    // INITIALIZATION
    // ================================
    function initialize() {
        console.log('[DATA-FIX] Initializing all data and analytics fixes...');
        
        // Apply fixes
        fixResetUserDataDropdown();
        fixAnalyticsDashboard();
        fixLeaderboardCalculations();
        
        // Ensure functions are available globally
        window.populateResetUserDropdown = populateResetUserDropdown;
        window.confirmResetUserData = confirmResetUserData;
        window.loadAnalyticsData = loadAnalyticsData;
        window.loadLeaderboard = loadLeaderboard;
        
        // Auto-load analytics when section is shown
        const originalShowSection = window.showSection;
        window.showSection = function(sectionName) {
            if (typeof originalShowSection === 'function') {
                originalShowSection(sectionName);
            }
            
            if (sectionName === 'analytics') {
                setTimeout(() => {
                    window.loadAnalyticsData('week');
                }, 100);
            } else if (sectionName === 'leaderboard') {
                setTimeout(() => {
                    window.loadLeaderboard();
                }, 100);
            }
        };
        
        console.log('[DATA-FIX] All data and analytics fixes applied');
    }
    
    // Wait for DOM and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }
    
    console.log('✨ DATA & ANALYTICS FIXES LOADED!');
})();