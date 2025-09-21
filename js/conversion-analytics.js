// Conversion Analytics Module - Track conversion rates through the sales funnel

/**
 * Calculate conversion rates between different stages
 */
async function calculateConversionRates(userId = null, period = 'week', teamId = null) {
    try {
        // Get activities based on filters
        const activities = await API.getActivities();
        let filteredActivities = activities.data || [];
        
        // Filter by user if specified
        if (userId) {
            filteredActivities = filteredActivities.filter(a => a.userId === userId);
        }
        
        // Filter by team if specified
        if (teamId) {
            const users = await API.getUsers();
            const teamUsers = users.data.filter(u => u.team === teamId);
            const teamUserIds = teamUsers.map(u => u.id);
            filteredActivities = filteredActivities.filter(a => teamUserIds.includes(a.userId));
        }
        
        // Filter by period
        filteredActivities = filterByPeriod(filteredActivities, period);
        
        // Aggregate metrics
        const metrics = {
            callsMade: 0,
            emailsSent: 0,
            linkedinMessages: 0,
            vidyardVideos: 0,
            meetingsBooked: 0,
            meetingsConducted: 0,
            opportunitiesGenerated: 0,
            revenueClosed: 0,
            pipelineGenerated: 0
        };
        
        filteredActivities.forEach(activity => {
            metrics.callsMade += activity.callsMade || 0;
            metrics.emailsSent += activity.emailsSent || 0;
            metrics.linkedinMessages += activity.linkedinMessages || 0;
            metrics.vidyardVideos += activity.vidyardVideos || 0;
            metrics.meetingsBooked += activity.meetingsBooked || 0;
            metrics.meetingsConducted += activity.meetingsConducted || 0;
            metrics.opportunitiesGenerated += activity.opportunitiesGenerated || 0;
            metrics.revenueClosed += activity.revenueClosed || 0;
            metrics.pipelineGenerated += activity.pipelineGenerated || 0;
        });
        
        // Calculate conversion rates
        const conversions = {
            callsToMeetings: calculateRate(metrics.meetingsBooked, metrics.callsMade),
            meetingsToOpportunities: calculateRate(metrics.opportunitiesGenerated, metrics.meetingsConducted),
            opportunitiesToClosed: calculateRate(metrics.revenueClosed > 0 ? 1 : 0, metrics.opportunitiesGenerated),
            overallConversion: calculateRate(metrics.revenueClosed > 0 ? 1 : 0, metrics.callsMade),
            avgDealSize: metrics.opportunitiesGenerated > 0 ? 
                Math.round(metrics.pipelineGenerated / metrics.opportunitiesGenerated) : 0,
            closeRate: metrics.opportunitiesGenerated > 0 ? 
                (metrics.revenueClosed / metrics.pipelineGenerated * 100).toFixed(1) : 0
        };
        
        return {
            metrics,
            conversions,
            period,
            userId,
            teamId
        };
        
    } catch (error) {
        console.error('Error calculating conversion rates:', error);
        return null;
    }
}

/**
 * Calculate conversion rate percentage
 */
function calculateRate(successes, attempts) {
    if (attempts === 0) return 0;
    return Math.round((successes / attempts) * 100);
}

/**
 * Filter activities by period
 */
function filterByPeriod(activities, period) {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        default:
            return activities; // Return all for 'all' period
    }
    
    return activities.filter(a => {
        const activityDate = new Date(a.date || a.createdAt);
        return activityDate >= startDate;
    });
}

/**
 * Calculate performance predictions based on current activity levels
 */
async function calculatePerformancePredictions(userId, currentWeek = null) {
    try {
        // Get user's goals
        const user = await API.getUser(userId);
        if (!user) return null;
        
        // Get current week if not provided
        if (!currentWeek) {
            currentWeek = getCurrentWeek();
        }
        
        // Get user's activities for current period
        const activities = await API.getActivities();
        const userActivities = activities.data.filter(a => 
            a.userId === userId && 
            a.week === currentWeek
        );
        
        // Get current metrics
        const current = {
            calls: 0,
            emails: 0,
            linkedin: 0,
            vidyard: 0,
            meetings: 0,
            opportunities: 0,
            referrals: 0,
            pipeline: 0
        };
        
        userActivities.forEach(a => {
            current.calls += a.callsMade || 0;
            current.emails += a.emailsSent || 0;
            current.linkedin += a.linkedinMessages || 0;
            current.vidyard += a.vidyardVideos || 0;
            current.meetings += a.meetingsConducted || 0;
            current.opportunities += a.opportunitiesGenerated || 0;
            current.pipeline += a.pipelineGenerated || 0;
        });
        
        // Get goals for comparison
        const goals = await getEffectiveGoalsForUser(userId);
        
        // Calculate days remaining in week
        const today = new Date().getDay();
        const daysRemaining = 5 - today; // Assuming Mon-Fri work week
        const daysElapsed = today === 0 ? 5 : today; // If Sunday, count as Friday
        
        // Calculate current pace
        const dailyPace = {
            calls: daysElapsed > 0 ? current.calls / daysElapsed : 0,
            emails: daysElapsed > 0 ? current.emails / daysElapsed : 0,
            linkedin: daysElapsed > 0 ? current.linkedin / daysElapsed : 0,
            vidyard: daysElapsed > 0 ? current.vidyard / daysElapsed : 0,
            meetings: daysElapsed > 0 ? current.meetings / daysElapsed : 0
        };
        
        // Project end of week performance
        const projected = {
            calls: Math.round(current.calls + (dailyPace.calls * daysRemaining)),
            emails: Math.round(current.emails + (dailyPace.emails * daysRemaining)),
            linkedin: Math.round(current.linkedin + (dailyPace.linkedin * daysRemaining)),
            vidyard: Math.round(current.vidyard + (dailyPace.vidyard * daysRemaining)),
            meetings: Math.round(current.meetings + (dailyPace.meetings * daysRemaining)),
            opportunities: Math.round(current.opportunities * (5 / daysElapsed)), // Scale to full week
            pipeline: Math.round(current.pipeline * (5 / daysElapsed))
        };
        
        // Calculate attainment predictions
        const predictions = {
            callsAttainment: goals.calls > 0 ? Math.round((projected.calls / goals.calls) * 100) : 0,
            emailsAttainment: goals.emails > 0 ? Math.round((projected.emails / goals.emails) * 100) : 0,
            meetingsAttainment: goals.meetings > 0 ? Math.round((projected.meetings / goals.meetings) * 100) : 0,
            status: 'on-track', // Will be updated below
            requiredDailyPace: {},
            risk: []
        };
        
        // Calculate required daily pace to hit goals
        if (daysRemaining > 0) {
            predictions.requiredDailyPace = {
                calls: Math.max(0, Math.ceil((goals.calls - current.calls) / daysRemaining)),
                emails: Math.max(0, Math.ceil((goals.emails - current.emails) / daysRemaining)),
                meetings: Math.max(0, Math.ceil((goals.meetings - current.meetings) / daysRemaining))
            };
        }
        
        // Determine overall status
        const avgAttainment = (predictions.callsAttainment + predictions.emailsAttainment + predictions.meetingsAttainment) / 3;
        if (avgAttainment >= 100) {
            predictions.status = 'exceeding';
        } else if (avgAttainment >= 80) {
            predictions.status = 'on-track';
        } else if (avgAttainment >= 60) {
            predictions.status = 'at-risk';
        } else {
            predictions.status = 'off-track';
        }
        
        // Identify risk areas
        if (predictions.callsAttainment < 80) {
            predictions.risk.push('Calls below target');
        }
        if (predictions.emailsAttainment < 80) {
            predictions.risk.push('Emails below target');
        }
        if (predictions.meetingsAttainment < 80) {
            predictions.risk.push('Meetings below target');
        }
        
        return {
            user: user.name,
            currentWeek,
            current,
            goals,
            projected,
            predictions,
            dailyPace,
            daysRemaining
        };
        
    } catch (error) {
        console.error('Error calculating performance predictions:', error);
        return null;
    }
}

/**
 * Get effective goals for a user
 */
async function getEffectiveGoalsForUser(userId) {
    try {
        const user = await API.getUser(userId);
        if (!user) return { calls: 0, emails: 0, meetings: 0 };
        
        // Get goals using the goal calculator
        const callsGoal = await getEffectiveGoalForUser(userId, 'calls_made', 'weekly');
        const emailsGoal = await getEffectiveGoalForUser(userId, 'emails_sent', 'weekly');
        const meetingsGoal = await getEffectiveGoalForUser(userId, 'meetings_booked', 'weekly');
        
        return {
            calls: callsGoal?.value || 0,
            emails: emailsGoal?.value || 0,
            meetings: meetingsGoal?.value || 0
        };
        
    } catch (error) {
        console.error('Error getting user goals:', error);
        return { calls: 0, emails: 0, meetings: 0 };
    }
}

/**
 * Team vs Team Benchmarking
 */
async function calculateTeamBenchmarks(period = 'week') {
    try {
        // Get all users and their teams
        const users = await API.getUsers();
        const teams = [...new Set(users.data.map(u => u.team))].filter(t => t);
        
        const teamMetrics = {};
        
        for (const team of teams) {
            const teamUsers = users.data.filter(u => u.team === team && u.status === 'active');
            const teamUserIds = teamUsers.map(u => u.id);
            
            // Get team activities
            const activities = await API.getActivities();
            const teamActivities = activities.data.filter(a => 
                teamUserIds.includes(a.userId)
            );
            
            const filteredActivities = filterByPeriod(teamActivities, period);
            
            // Calculate team totals
            const totals = {
                calls: 0,
                emails: 0,
                linkedin: 0,
                vidyard: 0,
                meetings: 0,
                opportunities: 0,
                pipeline: 0,
                revenue: 0,
                userCount: teamUsers.length
            };
            
            filteredActivities.forEach(a => {
                totals.calls += a.callsMade || 0;
                totals.emails += a.emailsSent || 0;
                totals.linkedin += a.linkedinMessages || 0;
                totals.vidyard += a.vidyardVideos || 0;
                totals.meetings += a.meetingsConducted || 0;
                totals.opportunities += a.opportunitiesGenerated || 0;
                totals.pipeline += a.pipelineGenerated || 0;
                totals.revenue += a.revenueClosed || 0;
            });
            
            // Calculate averages per user
            const averages = {
                callsPerUser: totals.userCount > 0 ? Math.round(totals.calls / totals.userCount) : 0,
                emailsPerUser: totals.userCount > 0 ? Math.round(totals.emails / totals.userCount) : 0,
                linkedinPerUser: totals.userCount > 0 ? Math.round(totals.linkedin / totals.userCount) : 0,
                vidyardPerUser: totals.userCount > 0 ? Math.round(totals.vidyard / totals.userCount) : 0,
                meetingsPerUser: totals.userCount > 0 ? Math.round(totals.meetings / totals.userCount) : 0,
                pipelinePerUser: totals.userCount > 0 ? Math.round(totals.pipeline / totals.userCount) : 0
            };
            
            // Calculate conversion rates
            const conversions = await calculateConversionRates(null, period, team);
            
            teamMetrics[team] = {
                name: team,
                totals,
                averages,
                conversions: conversions?.conversions || {},
                score: calculateTeamScore(totals, conversions?.conversions)
            };
        }
        
        // Rank teams by score
        const rankedTeams = Object.values(teamMetrics).sort((a, b) => b.score - a.score);
        rankedTeams.forEach((team, index) => {
            team.rank = index + 1;
        });
        
        return {
            teams: rankedTeams,
            period,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Error calculating team benchmarks:', error);
        return null;
    }
}

/**
 * Calculate team score for ranking
 */
function calculateTeamScore(totals, conversions) {
    // Weighted scoring system
    const weights = {
        calls: 1,
        emails: 0.5,
        linkedin: 0.7,
        vidyard: 1.5,
        meetings: 5,
        opportunities: 10,
        pipeline: 0.001,
        revenue: 0.002,
        conversionBonus: 20
    };
    
    let score = 0;
    score += totals.calls * weights.calls;
    score += totals.emails * weights.emails;
    score += (totals.linkedin || 0) * weights.linkedin;
    score += (totals.vidyard || 0) * weights.vidyard;
    score += totals.meetings * weights.meetings;
    score += totals.opportunities * weights.opportunities;
    score += totals.pipeline * weights.pipeline;
    score += totals.revenue * weights.revenue;
    
    // Add bonus for good conversion rates
    if (conversions.callsToMeetings > 10) score += weights.conversionBonus;
    if (conversions.meetingsToOpportunities > 30) score += weights.conversionBonus;
    
    return Math.round(score);
}

/**
 * Create conversion funnel data for visualization
 */
function createFunnelData(metrics) {
    return [
        { stage: 'Calls Made', value: metrics.callsMade || 0, color: '#3B82F6' },
        { stage: 'Meetings Booked', value: metrics.meetingsBooked || 0, color: '#10B981' },
        { stage: 'Meetings Conducted', value: metrics.meetingsConducted || 0, color: '#F59E0B' },
        { stage: 'Opportunities', value: metrics.opportunitiesGenerated || 0, color: '#8B5CF6' },
        { stage: 'Closed Won', value: metrics.revenueClosed > 0 ? 1 : 0, color: '#EF4444' }
    ];
}

/**
 * Generate coaching insights based on performance data
 */
async function generateCoachingInsights(userId = null, period = 'week') {
    const insights = [];
    
    try {
        // Get performance predictions
        const predictions = await calculatePerformancePredictions(userId, period);
        
        // Get conversion rates
        const conversions = await calculateConversionRates(userId, period);
        
        // Analyze predictions for at-risk metrics
        predictions.predictions.forEach(pred => {
            if (pred.status === 'off-track') {
                insights.push({
                    type: 'warning',
                    icon: 'exclamation-triangle',
                    title: `${getMetricLabel(pred.metric)} Performance Alert`,
                    message: `Currently at ${pred.current} out of ${pred.goal} goal. At current pace, projected to reach only ${pred.projected} (${pred.projectedPercentage.toFixed(0)}% of goal).`,
                    action: `Increase daily ${pred.metric} by ${Math.ceil((pred.goal - pred.projected) / pred.daysRemaining)} to meet goal.`
                });
            } else if (pred.status === 'at-risk') {
                insights.push({
                    type: 'info',
                    icon: 'info-circle',
                    title: `${getMetricLabel(pred.metric)} Needs Attention`,
                    message: `Currently at ${pred.projectedPercentage.toFixed(0)}% of goal. Maintain or slightly increase current pace to ensure goal achievement.`,
                    action: `Continue with at least ${Math.ceil(pred.requiredDailyRate)} ${pred.metric} per day.`
                });
            }
        });
        
        // Analyze conversion rates
        if (conversions.conversions.callsToMeetings < 15) {
            insights.push({
                type: 'improvement',
                icon: 'chart-line',
                title: 'Call to Meeting Conversion Low',
                message: `Your call to meeting conversion rate is ${conversions.conversions.callsToMeetings.toFixed(1)}%, below the 15% benchmark.`,
                action: 'Focus on call quality: research prospects better, improve opening pitch, and ask more engaging questions.'
            });
        }
        
        if (conversions.conversions.meetingsToOpportunities < 30) {
            insights.push({
                type: 'improvement',
                icon: 'users',
                title: 'Meeting to Opportunity Conversion',
                message: `Converting only ${conversions.conversions.meetingsToOpportunities.toFixed(1)}% of meetings to opportunities.`,
                action: 'Improve meeting preparation, focus on pain points, and ensure clear next steps are defined.'
            });
        }
        
        // Add positive insights for good performance
        const successMetrics = predictions.predictions.filter(p => p.status === 'on-track' && p.projectedPercentage > 100);
        if (successMetrics.length > 0) {
            insights.push({
                type: 'success',
                icon: 'trophy',
                title: 'Excellent Performance',
                message: `You're exceeding goals in ${successMetrics.map(m => getMetricLabel(m.metric)).join(', ')}.`,
                action: 'Keep up the great work! Consider sharing your best practices with the team.'
            });
        }
        
    } catch (error) {
        console.error('Error generating coaching insights:', error);
    }
    
    return insights;
}

/**
 * Helper function to get metric label
 */
function getMetricLabel(metric) {
    const labels = {
        callsMade: 'Calls',
        emailsSent: 'Emails',
        linkedinMessages: 'LinkedIn Messages',
        meetingsBooked: 'Meetings Booked',
        meetingsConducted: 'Meetings Conducted',
        opportunitiesGenerated: 'Opportunities',
        proposalsSent: 'Proposals',
        dealsWon: 'Deals Won'
    };
    return labels[metric] || metric;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateConversionRates,
        calculatePerformancePredictions,
        calculateTeamBenchmarks,
        createFunnelData,
        generateCoachingInsights
    };
}

// Also export to window for browser use
window.conversionAnalytics = {
    calculateConversionRates,
    calculatePerformancePredictions,
    calculateTeamBenchmarks,
    createFunnelData,
    generateCoachingInsights
};