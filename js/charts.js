// Chart.js configurations for Sales Prospecting Activity Tracker

let aeActivityChart = null;
let aeTrendChart = null;
let aeGoalChart = null;
let amTeamChart = null;
let amGoalChart = null;
let amCategoryCharts = {
    dormant: { activity: null, trend: null, goal: null },
    'cross-sell': { activity: null, trend: null, goal: null },
    'up-sell': { activity: null, trend: null, goal: null }
};

// Initialize all charts
function initializeCharts() {
    initializeAECharts();
    initializeAMCharts();
}

// Initialize Account Executive charts
function initializeAECharts() {
    // Activity Breakdown Chart
    const aeActivityCtx = document.getElementById('ae-activity-chart');
    if (aeActivityCtx) {
        aeActivityChart = new Chart(aeActivityCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Calls', 'Emails', 'LinkedIn', 'Vidyard', 'Meetings'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#3B82F6', // Blue
                        '#10B981', // Green
                        '#0077B5', // LinkedIn Blue
                        '#FF6B6B', // Vidyard Red
                        '#8B5CF6'  // Purple
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Goal Progress Chart
    const aeGoalCtx = document.getElementById('ae-goal-chart');
    if (aeGoalCtx) {
        aeGoalChart = new Chart(aeGoalCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Calls', 'Emails', 'Meetings', 'Pipeline'],
                datasets: [{
                    label: 'Progress (%)',
                    data: [0, 0, 0, 0],
                    backgroundColor: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        if (value >= 100) return '#10B981'; // Green
                        if (value >= 70) return '#F59E0B';  // Yellow
                        return '#EF4444'; // Red
                    },
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Progress: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 120,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Weekly Trend Chart
    const aeTrendCtx = document.getElementById('ae-trend-chart');
    if (aeTrendCtx) {
        aeTrendChart = new Chart(aeTrendCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Calls',
                    data: [12, 15, 18, 14, 20, 8, 5],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3
                }, {
                    label: 'Emails',
                    data: [25, 30, 28, 35, 32, 15, 10],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3
                }, {
                    label: 'Meetings',
                    data: [3, 5, 4, 6, 5, 2, 1],
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Initialize Account Manager charts
function initializeAMCharts() {
    // Team Activity Distribution Chart
    const amTeamCtx = document.getElementById('am-team-chart');
    if (amTeamCtx) {
        amTeamChart = new Chart(amTeamCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['John S.', 'Sarah J.', 'Mike C.', 'Emily D.', 'Lisa W.', 'Tom R.'],
                datasets: [{
                    label: 'Calls',
                    data: [45, 52, 38, 41, 35, 48],
                    backgroundColor: '#3B82F6'
                }, {
                    label: 'Emails',
                    data: [65, 70, 55, 60, 50, 62],
                    backgroundColor: '#10B981'
                }, {
                    label: 'Meetings',
                    data: [12, 15, 10, 14, 8, 11],
                    backgroundColor: '#8B5CF6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Goal Attainment Chart
    const amGoalCtx = document.getElementById('am-goal-chart');
    if (amGoalCtx) {
        amGoalChart = new Chart(amGoalCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['John S.', 'Sarah J.', 'Mike C.', 'Emily D.', 'Lisa W.', 'Tom R.'],
                datasets: [{
                    label: 'Goal Achievement %',
                    data: [95, 110, 85, 102, 78, 92],
                    backgroundColor: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        if (value >= 100) return '#10B981'; // Green
                        if (value >= 80) return '#F59E0B';  // Yellow
                        return '#EF4444'; // Red
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Achievement: ${context.parsed.y}%`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 100,
                                yMax: 100,
                                borderColor: '#10B981',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: 'Target: 100%',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 120,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Update AE Charts with real data
async function updateAECharts() {
    if (!currentUser || !currentUser.id) return;
    
    try {
        // Get current week data
        const currentWeek = getCurrentWeek();
        const response = await API.getActivities();
        
        // Filter for current user's AE activities for current week
        const activities = response.data ? response.data.filter(a => 
            a.userId === currentUser.id && 
            a.type === 'ae_summary' && 
            a.week === currentWeek
        ) : [];
        
        let metrics = {
            calls: 0,
            emails: 0,
            linkedin: 0,
            vidyard: 0,
            meetings: 0,
            opportunities: 0,
            pipeline: 0,
            referrals: 0
        };
        
        // Aggregate metrics from activities
        if (activities.length > 0) {
            const data = activities[0];
            metrics.calls = data.callsMade || 0;
            metrics.emails = data.emailsSent || 0;
            metrics.linkedin = data.linkedinMessages || 0;
            metrics.vidyard = data.vidyardVideos || 0;
            metrics.meetings = data.meetingsConducted || 0;
            metrics.opportunities = data.opportunitiesGenerated || 0;
            metrics.pipeline = data.pipelineGenerated || 0;
            metrics.referrals = data.referralsGenerated || 0;
        }
        
        // Update Activity Mix Chart
        if (aeActivityChart) {
            aeActivityChart.data.datasets[0].data = [
                metrics.calls,
                metrics.emails,
                metrics.linkedin,
                metrics.vidyard,
                metrics.meetings
            ];
            aeActivityChart.data.labels = ['Calls', 'Emails', 'LinkedIn', 'Vidyard', 'Meetings'];
            aeActivityChart.update();
        }
        
        // Update Trend Chart with last 4 weeks
        if (aeTrendChart) {
            const weeks = [];
            const callsData = [];
            const emailsData = [];
            const meetingsData = [];
            
            // Get all activities once
            const allActivitiesResponse = await API.getActivities();
            const allActivities = allActivitiesResponse.data || [];
            
            // Get last 4 weeks of data
            for (let i = 3; i >= 0; i--) {
                const weekDate = new Date();
                weekDate.setDate(weekDate.getDate() - (i * 7));
                const weekStr = getWeekString(weekDate);
                weeks.push(`W${weekStr.split('W')[1]}`);
                
                // Filter activities for this week
                const weekActivities = allActivities.filter(a => 
                    a.userId === currentUser.id && 
                    a.type === 'ae_summary' && 
                    a.week === weekStr
                );
                
                if (weekActivities.length > 0) {
                    callsData.push(weekActivities[0].callsMade || 0);
                    emailsData.push(weekActivities[0].emailsSent || 0);
                    meetingsData.push(weekActivities[0].meetingsConducted || 0);
                } else {
                    callsData.push(0);
                    emailsData.push(0);
                    meetingsData.push(0);
                }
            }
            
            aeTrendChart.data.labels = weeks;
            aeTrendChart.data.datasets[0].data = callsData;
            aeTrendChart.data.datasets[1].data = emailsData;
            aeTrendChart.data.datasets[2].data = meetingsData;
            aeTrendChart.update();
        }
        
        // Update Goal Progress Chart
        if (aeGoalChart) {
            // Get user goals
            const goalsResponse = await API.getGoals();
            const userGoals = goalsResponse.data ? goalsResponse.data.filter(g => 
                g.userId === currentUser.id && g.status === 'active'
            ) : [];
            
            let goalData = {
                calls: 50,
                emails: 100,
                meetings: 10,
                pipeline: 100000
            };
            
            // Update goal values from database
            userGoals.forEach(goal => {
                if (goal.metric === 'calls_made') goalData.calls = goal.target;
                if (goal.metric === 'emails_sent') goalData.emails = goal.target;
                if (goal.metric === 'meetings_conducted') goalData.meetings = goal.target;
                if (goal.metric === 'pipeline_generated') goalData.pipeline = goal.target;
            });
            
            const achieved = [
                goalData.calls > 0 ? Math.min((metrics.calls / goalData.calls) * 100, 120) : 0,
                goalData.emails > 0 ? Math.min((metrics.emails / goalData.emails) * 100, 120) : 0,
                goalData.meetings > 0 ? Math.min((metrics.meetings / goalData.meetings) * 100, 120) : 0,
                goalData.pipeline > 0 ? Math.min((metrics.pipeline / goalData.pipeline) * 100, 120) : 0
            ];
            
            aeGoalChart.data.datasets[0].data = achieved;
            aeGoalChart.update();
        }
        
    } catch (error) {
        console.error('Error updating AE charts:', error);
    }
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

// Update AM Charts with real data
async function updateAMCategoryCharts(category) {
    if (!currentUser || !currentUser.id) return;
    
    try {
        const currentWeek = getCurrentWeek();
        const response = await API.getActivities();
        
        // Map category names to activity types
        const typeMap = {
            'dormant': 'am_dormant_summary',
            'cross-sell': 'am_cross_sell_summary',
            'up-sell': 'am_up_sell_summary'
        };
        
        const activityType = typeMap[category];
        
        // Filter for current user's AM activities for current week
        const activities = response.data ? response.data.filter(a => 
            a.userId === currentUser.id && 
            a.type === activityType && 
            a.week === currentWeek
        ) : [];
        
        let metrics = {
            calls: 0,
            emails: 0,
            linkedin: 0,
            vidyard: 0,
            meetings: 0,
            opportunities: 0,
            pipeline: 0,
            referrals: 0
        };
        
        // Aggregate metrics from activities
        if (activities.length > 0) {
            const data = activities[0];
            metrics.calls = data.callsMade || 0;
            metrics.emails = data.emailsSent || 0;
            metrics.linkedin = data.linkedinMessages || 0;
            metrics.vidyard = data.vidyardVideos || 0;
            metrics.meetings = data.meetingsConducted || 0;
            metrics.opportunities = data.opportunitiesGenerated || 0;
            metrics.pipeline = data.pipelineGenerated || 0;
            metrics.referrals = data.referralsGenerated || 0;
        }
        
        // Update Activity Chart
        const activityChart = Chart.getChart(`am-${category}-activity-chart`);
        if (activityChart) {
            activityChart.data.labels = ['Calls', 'Emails', 'LinkedIn', 'Vidyard', 'Meetings'];
            activityChart.data.datasets[0].data = [
                metrics.calls,
                metrics.emails,
                metrics.linkedin,
                metrics.vidyard,
                metrics.meetings
            ];
            activityChart.update();
        }
        
        // Update Trend Chart
        const trendChart = Chart.getChart(`am-${category}-trend-chart`);
        if (trendChart) {
            const weeks = [];
            const totalActivities = [];
            
            // Get all activities once
            const allActivitiesResponse = await API.getActivities();
            const allActivities = allActivitiesResponse.data || [];
            
            // Get last 4 weeks of data
            for (let i = 3; i >= 0; i--) {
                const weekDate = new Date();
                weekDate.setDate(weekDate.getDate() - (i * 7));
                const weekStr = getWeekString(weekDate);
                weeks.push(`W${weekStr.split('W')[1]}`);
                
                // Filter activities for this week (excluding deleted records)
                const weekActivities = allActivities.filter(a => 
                    !a.deleted &&  // Exclude soft-deleted records
                    a.userId === currentUser.id && 
                    a.type === activityType && 
                    a.week === weekStr
                );
                
                if (weekActivities.length > 0) {
                    const data = weekActivities[0];
                    const total = (data.callsMade || 0) + (data.emailsSent || 0) + 
                                  (data.linkedinMessages || 0) + (data.vidyardVideos || 0) + 
                                  (data.meetingsConducted || 0);
                    totalActivities.push(total);
                } else {
                    totalActivities.push(0);
                }
            }
            
            trendChart.data.labels = weeks;
            trendChart.data.datasets[0].data = totalActivities;
            trendChart.update();
        }
        
        // Update Goal Chart
        const goalChart = Chart.getChart(`am-${category}-goal-chart`);
        if (goalChart) {
            // Get user goals
            const goalsResponse = await API.getGoals();
            const userGoals = goalsResponse.data ? goalsResponse.data.filter(g => 
                g.userId === currentUser.id && 
                g.status === 'active' &&
                g.category === category
            ) : [];
            
            let goalData = {
                calls: 30,
                emails: 50,
                meetings: 5,
                pipeline: 50000
            };
            
            // Update goal values from database
            userGoals.forEach(goal => {
                if (goal.metric === 'calls_made') goalData.calls = goal.target;
                if (goal.metric === 'emails_sent') goalData.emails = goal.target;
                if (goal.metric === 'meetings_conducted') goalData.meetings = goal.target;
                if (goal.metric === 'pipeline_generated') goalData.pipeline = goal.target;
            });
            
            const achieved = [
                goalData.calls > 0 ? Math.min((metrics.calls / goalData.calls) * 100, 120) : 0,
                goalData.emails > 0 ? Math.min((metrics.emails / goalData.emails) * 100, 120) : 0,
                goalData.meetings > 0 ? Math.min((metrics.meetings / goalData.meetings) * 100, 120) : 0,
                goalData.pipeline > 0 ? Math.min((metrics.pipeline / goalData.pipeline) * 100, 120) : 0
            ];
            
            goalChart.data.datasets[0].data = achieved;
            goalChart.update();
        }
    } catch (error) {
        console.error(`Error updating AM ${category} charts:`, error);
    }
}

// Initialize AM Charts for all categories
function initializeAMCharts() {
    // Initialize charts for each category
    initializeAMCategoryCharts('dormant');
    initializeAMCategoryCharts('cross-sell');  
    initializeAMCategoryCharts('up-sell');
}

// Initialize charts for a specific AM category
function initializeAMCategoryCharts(category) {
    const activityCtx = document.getElementById(`am-${category}-activity-chart`);
    const trendCtx = document.getElementById(`am-${category}-trend-chart`);
    const goalCtx = document.getElementById(`am-${category}-goal-chart`);
    
    if (activityCtx) {
        amCategoryCharts[category].activity = new Chart(activityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Calls', 'Emails', 'LinkedIn', 'Vidyard', 'Meetings'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#3B82F6', // Blue
                        '#10B981', // Green
                        '#0077B5', // LinkedIn Blue
                        '#FF6B6B', // Vidyard Red
                        '#8B5CF6'  // Purple
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    if (trendCtx) {
        amCategoryCharts[category].trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Activities',
                    data: [],
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
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
    
    if (goalCtx) {
        amCategoryCharts[category].goal = new Chart(goalCtx, {
            type: 'bar',
            data: {
                labels: ['Calls', 'Emails', 'Meetings', 'Pipeline'],
                datasets: [{
                    label: 'Achievement %',
                    data: [0, 0, 0, 0],
                    backgroundColor: 'rgba(99, 102, 241, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 120
                    }
                }
            }
        });
    }
}

async function updateAMCharts() {
    if (!currentUser || !currentUser.id) return;
    
    try {
        // Determine which category to display based on the active tab
        const activeTab = document.querySelector('.am-tab-btn.active');
        if (activeTab) {
            const category = activeTab.dataset.category;
            if (category && category !== 'all') {
                // Update charts for the specific category
                await updateAMCategoryCharts(category);
            }
        } else {
            // Update all category charts
            await updateAMCategoryCharts('dormant');
            await updateAMCategoryCharts('cross-sell');
            await updateAMCategoryCharts('up-sell');
        }
        
        // Also update team-wide charts if user is a manager
        if (currentUser.role === 'am' && amTeamChart) {
            // Get all team activities
            const response = await API.getActivities();
            const currentWeek = getCurrentWeek();
            
            // Get team members
            const usersResponse = await API.getUsers();
            const teamMembers = usersResponse.data ? usersResponse.data.filter(u => 
                u.team === currentUser.team && u.role === 'ae'
            ) : [];
            
            const teamData = [];
            
            for (const member of teamMembers) {
                const memberActivities = response.data ? response.data.filter(a => 
                    a.userId === member.id && 
                    a.week === currentWeek &&
                    a.type === 'ae_summary'
                ) : [];
                
                let calls = 0, emails = 0, meetings = 0;
                
                if (memberActivities.length > 0) {
                    const data = memberActivities[0];
                    calls = data.callsMade || 0;
                    emails = data.emailsSent || 0;
                    meetings = data.meetingsConducted || 0;
                }
                
                teamData.push({
                    name: member.name,
                    calls,
                    emails,
                    meetings
                });
            }
            
            if (teamData.length > 0) {
                const labels = teamData.map(m => {
                    const names = m.name.split(' ');
                    return `${names[0]} ${names[1] ? names[1][0] + '.' : ''}`;
                });
                
                amTeamChart.data.labels = labels;
                amTeamChart.data.datasets[0].data = teamData.map(m => m.calls);
                amTeamChart.data.datasets[1].data = teamData.map(m => m.emails);
                amTeamChart.data.datasets[2].data = teamData.map(m => m.meetings);
                amTeamChart.update();
            }
        }
        
        // Update Goal Attainment Chart
        if (currentUser.role === 'am' && amGoalChart) {
            const response = await API.getActivities();
            const goalsResponse = await API.getGoals();
            const usersResponse = await API.getUsers();
            const currentWeek = getCurrentWeek();
            
            const teamMembers = usersResponse.data ? usersResponse.data.filter(u => 
                u.team === currentUser.team && u.role === 'ae'
            ) : [];
            
            const goalData = [];
            
            for (const member of teamMembers) {
                const memberGoals = goalsResponse.data ? goalsResponse.data.filter(g => 
                    g.userId === member.id && g.status === 'active'
                ) : [];
                
                const memberActivities = response.data ? response.data.filter(a => 
                    a.userId === member.id && 
                    a.week === currentWeek &&
                    a.type === 'ae_summary'
                ) : [];
                
                let totalActivities = 0;
                if (memberActivities.length > 0) {
                    const data = memberActivities[0];
                    totalActivities = (data.callsMade || 0) + (data.emailsSent || 0) + 
                                      (data.meetingsConducted || 0) + (data.linkedinMessages || 0);
                }
                
                let targetActivities = 100; // Default
                if (memberGoals.length > 0) {
                    // Sum up all activity targets
                    memberGoals.forEach(goal => {
                        if (goal.target) targetActivities = goal.target;
                    });
                }
                
                const achievement = targetActivities > 0 ? 
                    Math.min((totalActivities / targetActivities) * 100, 120) : 0;
                
                goalData.push({
                    name: member.name,
                    achievement: Math.round(achievement)
                });
            }
            
            if (goalData.length > 0) {
                const labels = goalData.map(g => {
                    const names = g.name.split(' ');
                    return `${names[0]} ${names[1] ? names[1][0] + '.' : ''}`;
                });
                
                amGoalChart.data.labels = labels;
                amGoalChart.data.datasets[0].data = goalData.map(g => g.achievement);
                amGoalChart.update();
            }
        }
    } catch (error) {
        console.error('Error updating AM charts:', error);
    }
}

// Refresh all charts
function refreshCharts() {
    if (dashboardView === 'ae') {
        updateAECharts();
    } else {
        updateAMCharts();
    }
}

// Export functions for use in other modules
window.chartUtils = {
    initializeCharts,
    updateAECharts,
    updateAMCharts,
    refreshCharts
};