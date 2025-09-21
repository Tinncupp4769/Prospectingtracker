/**
 * Dashboard Visualizations Module
 * Creates modern, interactive dashboard visualizations using Chart.js
 */

// Chart configuration defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#6B7280';

// Color palette for consistent theming
const colorPalette = {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    gradient: {
        blue: ['rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.2)'],
        green: ['rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.2)'],
        purple: ['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.2)'],
        pink: ['rgba(236, 72, 153, 0.8)', 'rgba(236, 72, 153, 0.2)'],
        cyan: ['rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 0.2)']
    }
};

// Store chart instances
const chartInstances = {};

/**
 * Create a conversion funnel chart
 */
async function createConversionFunnelChart(containerId, userId = null, period = 'week') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get conversion data
    const conversionData = await calculateConversionRates(userId, period);
    
    // Create funnel visualization
    const stages = [
        { name: 'Calls Made', value: conversionData.metrics.callsMade || 0, color: colorPalette.info },
        { name: 'Meetings Booked', value: conversionData.metrics.meetingsBooked || 0, color: colorPalette.cyan },
        { name: 'Meetings Conducted', value: conversionData.metrics.meetingsConducted || 0, color: colorPalette.purple },
        { name: 'Opportunities', value: conversionData.metrics.opportunitiesGenerated || 0, color: colorPalette.warning },
        { name: 'Closed Deals', value: conversionData.metrics.dealsWon || 0, color: colorPalette.success }
    ];

    // Clear container and create wrapper with fixed height
    container.innerHTML = '';
    const chartWrapper = document.createElement('div');
    chartWrapper.style.height = '400px';
    chartWrapper.style.position = 'relative';
    container.appendChild(chartWrapper);
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    chartWrapper.appendChild(canvas);

    // Destroy existing chart if it exists
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
    }

    // Create bar chart for funnel
    chartInstances[containerId] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: stages.map(s => s.name),
            datasets: [{
                label: 'Volume',
                data: stages.map(s => s.value),
                backgroundColor: stages.map(s => s.color),
                borderRadius: 8,
                barThickness: 60
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
                        afterLabel: function(context) {
                            if (context.dataIndex > 0) {
                                const prevValue = stages[context.dataIndex - 1].value;
                                const currentValue = stages[context.dataIndex].value;
                                const rate = prevValue > 0 ? ((currentValue / prevValue) * 100).toFixed(1) : 0;
                                return `Conversion: ${rate}%`;
                            }
                        }
                    }
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

    // Add conversion rates between stages
    const ratesHtml = `
        <div class="flex justify-between mt-4 text-sm">
            ${stages.slice(1).map((stage, index) => {
                const prevValue = stages[index].value;
                const currentValue = stage.value;
                const rate = prevValue > 0 ? ((currentValue / prevValue) * 100).toFixed(1) : 0;
                const color = rate >= 30 ? 'text-green-600' : rate >= 15 ? 'text-yellow-600' : 'text-red-600';
                return `
                    <div class="text-center">
                        <p class="text-gray-500">${stages[index].name.split(' ')[0]} → ${stage.name.split(' ')[0]}</p>
                        <p class="${color} font-semibold">${rate}%</p>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', ratesHtml);
}

/**
 * Create a performance gauge chart
 */
function createPerformanceGauge(containerId, value, target, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const percentage = target > 0 ? Math.min((value / target) * 100, 150) : 0;
    const color = percentage >= 100 ? colorPalette.success : 
                  percentage >= 75 ? colorPalette.warning : 
                  percentage >= 50 ? colorPalette.info : 
                  colorPalette.danger;

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.height = '200px';
    container.innerHTML = '';
    container.appendChild(canvas);

    // Destroy existing chart if it exists
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
    }

    // Create doughnut chart as gauge
    chartInstances[containerId] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentage, Math.max(0, 100 - percentage)],
                backgroundColor: [color, 'rgba(229, 231, 235, 0.5)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 180,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });

    // Add center text
    const centerText = `
        <div class="absolute inset-0 flex flex-col items-center justify-center" style="pointer-events: none;">
            <p class="text-3xl font-bold" style="color: ${color}">${percentage.toFixed(0)}%</p>
            <p class="text-sm text-gray-500">${label}</p>
            <p class="text-xs text-gray-400">${value} / ${target}</p>
        </div>
    `;
    
    container.style.position = 'relative';
    container.insertAdjacentHTML('beforeend', centerText);
}

/**
 * Create a team comparison radar chart
 */
async function createTeamComparisonRadar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get team benchmarks
    const benchmarks = await calculateTeamBenchmarks('week');
    
    // Prepare data for radar chart
    const metrics = ['Calls', 'Emails', 'LinkedIn', 'Meetings', 'Opportunities'];
    const teams = {
        ae: benchmarks.teams.find(t => t.role === 'ae') || { averages: {} },
        am: benchmarks.teams.find(t => t.role === 'am') || { averages: {} }
    };

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.height = '400px';
    container.innerHTML = '';
    container.appendChild(canvas);

    // Destroy existing chart if it exists
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
    }

    // Create radar chart
    chartInstances[containerId] = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: metrics,
            datasets: [
                {
                    label: 'Account Executives',
                    data: [
                        teams.ae.averages.callsMade || 0,
                        teams.ae.averages.emailsSent || 0,
                        teams.ae.averages.linkedinMessages || 0,
                        teams.ae.averages.meetingsConducted || 0,
                        teams.ae.averages.opportunitiesGenerated || 0
                    ],
                    borderColor: colorPalette.primary,
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    pointBackgroundColor: colorPalette.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colorPalette.primary
                },
                {
                    label: 'Account Managers',
                    data: [
                        teams.am.averages.callsMade || 0,
                        teams.am.averages.emailsSent || 0,
                        teams.am.averages.linkedinMessages || 0,
                        teams.am.averages.meetingsConducted || 0,
                        teams.am.averages.opportunitiesGenerated || 0
                    ],
                    borderColor: colorPalette.success,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    pointBackgroundColor: colorPalette.success,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colorPalette.success
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

/**
 * Create activity trend line chart
 */
async function createActivityTrendChart(containerId, userId = null, metric = 'callsMade', weeks = 8) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get historical data
    const activities = await loadActivities();
    const userActivities = activities && Array.isArray(activities) ? 
        (userId ? activities.filter(a => a.userId === userId) : activities) : [];
    
    // Group by week and calculate totals
    const weeklyData = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * 7));

    userActivities.forEach(activity => {
        if (activity[metric] && activity.week) {
            if (!weeklyData[activity.week]) {
                weeklyData[activity.week] = 0;
            }
            weeklyData[activity.week] += parseInt(activity[metric]) || 0;
        }
    });

    // Generate labels and data for the chart
    const labels = [];
    const data = [];
    for (let i = weeks - 1; i >= 0; i--) {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const weekStr = getWeekString(weekDate);
        labels.push(weekStr);
        data.push(weeklyData[weekStr] || 0);
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.height = '300px';
    container.innerHTML = '';
    container.appendChild(canvas);

    // Destroy existing chart if it exists
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
    }

    // Create line chart
    chartInstances[containerId] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: getMetricLabel(metric),
                data: data,
                borderColor: colorPalette.primary,
                backgroundColor: createGradient(canvas, colorPalette.gradient.blue),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: colorPalette.primary,
                pointHoverRadius: 6
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
                    grid: {
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

/**
 * Create performance prediction cards
 */
async function createPerformancePredictions(containerId, userId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get predictions
    const predictions = await calculatePerformancePredictions(userId, 'week');
    
    // Create prediction cards
    const cardsHtml = predictions.predictions.map(pred => {
        const statusColor = pred.status === 'on-track' ? 'green' : 
                           pred.status === 'at-risk' ? 'yellow' : 'red';
        const statusIcon = pred.status === 'on-track' ? 'check-circle' : 
                          pred.status === 'at-risk' ? 'exclamation-triangle' : 'times-circle';
        
        return `
            <div class="bg-white rounded-lg shadow-sm p-4 border-l-4 border-${statusColor}-500">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-800">${getMetricLabel(pred.metric)}</h4>
                    <i class="fas fa-${statusIcon} text-${statusColor}-500"></i>
                </div>
                <div class="grid grid-cols-3 gap-2 text-sm">
                    <div>
                        <p class="text-gray-500">Current</p>
                        <p class="font-bold">${pred.current}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Projected</p>
                        <p class="font-bold">${pred.projected}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Goal</p>
                        <p class="font-bold">${pred.goal}</p>
                    </div>
                </div>
                <div class="mt-2">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-${statusColor}-500 h-2 rounded-full" style="width: ${Math.min(pred.projectedPercentage, 100)}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">${pred.projectedPercentage.toFixed(0)}% of goal (projected)</p>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = cardsHtml;
}

/**
 * Create activity distribution pie chart
 */
async function createActivityDistributionChart(containerId, userId = null, period = 'week') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get current week activities
    const activities = await loadActivities();
    const currentWeek = getCurrentWeek();
    const userActivities = activities && Array.isArray(activities) ? 
        activities.filter(a => 
            (!userId || a.userId === userId) && 
            a.week === currentWeek
        ) : [];

    // Calculate totals
    const totals = {
        calls: userActivities.reduce((sum, a) => sum + (parseInt(a.callsMade) || 0), 0),
        emails: userActivities.reduce((sum, a) => sum + (parseInt(a.emailsSent) || 0), 0),
        linkedin: userActivities.reduce((sum, a) => sum + (parseInt(a.linkedinMessages) || 0), 0),
        abm: userActivities.reduce((sum, a) => sum + (parseInt(a.abmCampaigns) || 0), 0)
    };

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.height = '300px';
    container.innerHTML = '';
    container.appendChild(canvas);

    // Destroy existing chart if it exists
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
    }

    // Create pie chart
    chartInstances[containerId] = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['Calls', 'Emails', 'LinkedIn', 'ABM'],
            datasets: [{
                data: [totals.calls, totals.emails, totals.linkedin, totals.abm],
                backgroundColor: [
                    colorPalette.info,
                    colorPalette.success,
                    colorPalette.primary,
                    colorPalette.purple
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
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Helper function to create gradient
 */
function createGradient(canvas, colors) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
}

/**
 * Helper function to get week string
 */
function getWeekString(date) {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Helper function to get week number
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Helper function to get metric label
 */
function getMetricLabel(metric) {
    const labels = {
        callsMade: 'Calls Made',
        emailsSent: 'Emails Sent',
        linkedinMessages: 'LinkedIn Messages',
        abmCampaigns: 'ABM Campaigns',
        meetingsBooked: 'Meetings Booked',
        meetingsConducted: 'Meetings Conducted',
        opportunitiesGenerated: 'Opportunities Generated',
        proposalsSent: 'Proposals Sent',
        dealsWon: 'Deals Won',
        revenueClosed: 'Revenue Closed'
    };
    return labels[metric] || metric;
}

/**
 * Initialize enhanced dashboard
 */
async function initializeEnhancedDashboard() {
    try {
        // Get current user from global state
        if (typeof currentUser === 'undefined' || !currentUser) {
            console.error('No current user found');
            return;
        }

        // Create conversion funnel
        await createConversionFunnelChart('conversion-funnel-chart', currentUser.id);

        // Create performance gauges
        const goals = await loadGoals();
        const activities = await loadActivities();
        const currentWeek = getCurrentWeek();
        const weekActivities = activities && Array.isArray(activities) ? 
            activities.filter(a => a.userId === currentUser.id && a.week === currentWeek) : [];

        // Calculate current values
        const currentMetrics = {
            calls: weekActivities.reduce((sum, a) => sum + (parseInt(a.callsMade) || 0), 0),
            meetings: weekActivities.reduce((sum, a) => sum + (parseInt(a.meetingsConducted) || 0), 0),
            opportunities: weekActivities.reduce((sum, a) => sum + (parseInt(a.opportunitiesGenerated) || 0), 0)
        };

        // Get goals for each metric
        const callsGoal = await getEffectiveGoalForUser(currentUser.id, 'callsMade', 'weekly');
        const meetingsGoal = await getEffectiveGoalForUser(currentUser.id, 'meetingsConducted', 'weekly');
        const oppsGoal = await getEffectiveGoalForUser(currentUser.id, 'opportunitiesGenerated', 'weekly');

        // Create gauges
        createPerformanceGauge('calls-gauge', currentMetrics.calls, callsGoal?.value || 50, 'Calls');
        createPerformanceGauge('meetings-gauge', currentMetrics.meetings, meetingsGoal?.value || 10, 'Meetings');
        createPerformanceGauge('opportunities-gauge', currentMetrics.opportunities, oppsGoal?.value || 5, 'Opportunities');

        // Create team comparison radar
        await createTeamComparisonRadar('team-comparison-chart');

        // Create activity trend
        await createActivityTrendChart('activity-trend-chart', currentUser.id, 'callsMade');

        // Create performance predictions
        await createPerformancePredictions('performance-predictions', currentUser.id);

        // Create activity distribution
        await createActivityDistributionChart('activity-distribution-chart', currentUser.id);
        
        // Coaching insights removed per user request
        // await displayCoachingInsights('coaching-insights', currentUser.id);

    } catch (error) {
        console.error('Error initializing enhanced dashboard:', error);
    }
}

/**
 * Display coaching insights
 */
async function displayCoachingInsights(containerId, userId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        // Get coaching insights
        const insights = await conversionAnalytics.generateCoachingInsights(userId, 'week');
        
        if (insights.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-check-circle text-4xl mb-2 text-green-500"></i>
                    <p>Great job! No immediate concerns or recommendations at this time.</p>
                </div>
            `;
            return;
        }
        
        // Create insight cards
        const insightsHtml = insights.map(insight => {
            const colorClass = insight.type === 'warning' ? 'red' :
                              insight.type === 'info' ? 'blue' :
                              insight.type === 'improvement' ? 'yellow' :
                              insight.type === 'success' ? 'green' : 'gray';
            
            return `
                <div class="border-l-4 border-${colorClass}-500 bg-${colorClass}-50 p-4 rounded-r-lg">
                    <div class="flex items-start">
                        <i class="fas fa-${insight.icon} text-${colorClass}-500 mt-1 mr-3"></i>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800">${insight.title}</h4>
                            <p class="text-sm text-gray-600 mt-1">${insight.message}</p>
                            <p class="text-sm font-medium text-${colorClass}-700 mt-2">
                                <i class="fas fa-arrow-right mr-1"></i>${insight.action}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = insightsHtml;
        
    } catch (error) {
        console.error('Error displaying coaching insights:', error);
        container.innerHTML = '<p class="text-red-500">Error loading coaching insights</p>';
    }
}

// Export functions for use in other modules
window.dashboardVisualizations = {
    createConversionFunnelChart,
    createPerformanceGauge,
    createTeamComparisonRadar,
    createActivityTrendChart,
    createPerformancePredictions,
    createActivityDistributionChart,
    initializeEnhancedDashboard
};