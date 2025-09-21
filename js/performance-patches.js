// Performance Patches - Optimizes slow-loading sections
// This module patches existing functions to add caching and improve performance

const PerformancePatches = {
    
    // Initialize all patches
    init() {
        console.log('Applying performance patches...');
        
        // Apply patches after other modules are loaded
        setTimeout(() => {
            this.patchLeaderboard();
            this.patchDashboard();
            this.patchActivityEntry();
            this.patchUserManagement();
            this.patchAnalytics();
            console.log('✅ Performance patches applied');
        }, 1000);
    },
    
    // Patch leaderboard for faster switching
    patchLeaderboard() {
        // Patch updateLeaderboard
        if (typeof updateLeaderboard === 'function') {
            const original = updateLeaderboard;
            window.updateLeaderboard = async function() {
                const startTime = performance.now();
                
                // Generate cache key
                const view = document.getElementById('leaderboard-view-selector')?.value || 'ae';
                const period = window.currentLeaderboardPeriod || 'all';
                const metric = document.getElementById('leaderboard-metric-filter')?.value || 'all';
                const cacheKey = `leaderboard-${view}-${period}-${metric}`;
                
                // Check cache
                if (ViewCacheManager) {
                    const cached = ViewCacheManager.getDataCache(cacheKey);
                    if (cached) {
                        console.log(`Leaderboard loaded from cache in ${(performance.now() - startTime).toFixed(2)}ms`);
                        
                        // Apply cached data directly to UI
                        if (typeof displayTop3 === 'function') displayTop3(cached);
                        if (typeof displayLeaderboardTable === 'function') displayLeaderboardTable(cached);
                        if (typeof renderLeaderboardCharts === 'function') renderLeaderboardCharts(cached);
                        return;
                    }
                }
                
                // Show loading state
                const content = document.getElementById('leaderboard-content');
                if (content) {
                    content.style.opacity = '0.6';
                }
                
                // Call original function
                await original.apply(this, arguments);
                
                // Cache the results by capturing the data
                setTimeout(() => {
                    const data = window.lastLeaderboardData; // Assuming this is set
                    if (data && ViewCacheManager) {
                        ViewCacheManager.setDataCache(cacheKey, data);
                    }
                    
                    // Restore opacity
                    if (content) {
                        content.style.opacity = '1';
                    }
                    
                    console.log(`Leaderboard loaded in ${(performance.now() - startTime).toFixed(2)}ms`);
                }, 100);
            };
        }
        
        // Patch calculateUserScore for batch processing
        if (typeof calculateUserScore === 'function') {
            const original = calculateUserScore;
            window.calculateUserScore = async function(user, selectedMetric, amCategory) {
                // Check if we have cached score
                const cacheKey = `score-${user.id}-${selectedMetric}-${amCategory}-${currentLeaderboardPeriod}`;
                
                if (ViewCacheManager) {
                    const cached = ViewCacheManager.getDataCache(cacheKey);
                    if (cached) {
                        return cached;
                    }
                }
                
                // Calculate score
                const result = await original.apply(this, arguments);
                
                // Cache result
                if (ViewCacheManager) {
                    ViewCacheManager.setDataCache(cacheKey, result);
                }
                
                return result;
            };
        }
    },
    
    // Patch dashboard for faster view switching
    patchDashboard() {
        // Patch changeDashboardView
        if (typeof changeDashboardView === 'function') {
            const original = changeDashboardView;
            window.changeDashboardView = async function(view) {
                const startTime = performance.now();
                const cacheKey = `dashboard-view-${view}`;
                
                // Check cache
                if (ViewCacheManager) {
                    const cached = ViewCacheManager.getDataCache(cacheKey);
                    if (cached) {
                        console.log(`Dashboard view loaded from cache in ${(performance.now() - startTime).toFixed(2)}ms`);
                        
                        // Apply cached view
                        window.dashboardView = view;
                        if (typeof loadDashboardForView === 'function') {
                            loadDashboardForView(view, cached);
                        }
                        return;
                    }
                }
                
                // Show loading
                const content = document.getElementById('dashboard-content');
                if (content) {
                    content.style.opacity = '0.6';
                }
                
                // Call original
                await original.apply(this, arguments);
                
                // Restore opacity
                if (content) {
                    content.style.opacity = '1';
                }
                
                console.log(`Dashboard view loaded in ${(performance.now() - startTime).toFixed(2)}ms`);
            };
        }
        
        // Patch loadDashboardMetrics
        if (typeof loadDashboardMetrics === 'function') {
            const original = loadDashboardMetrics;
            window.loadDashboardMetrics = async function() {
                const cacheKey = `dashboard-metrics-${dashboardView}-${getCurrentWeek()}`;
                
                // Batch API calls
                if (ViewCacheManager) {
                    const cached = ViewCacheManager.getDataCache(cacheKey);
                    if (cached) {
                        return cached;
                    }
                }
                
                const result = await original.apply(this, arguments);
                
                if (ViewCacheManager) {
                    ViewCacheManager.setDataCache(cacheKey, result);
                }
                
                return result;
            };
        }
    },
    
    // Patch activity entry for faster data loading
    patchActivityEntry() {
        // Patch loadActivitySummary
        if (typeof loadActivitySummary === 'function') {
            const original = loadActivitySummary;
            window.loadActivitySummary = async function() {
                const week = document.getElementById('activity-week-selector')?.value || getCurrentWeek();
                const cacheKey = `activity-summary-${currentUser?.id}-${week}`;
                
                if (ViewCacheManager) {
                    const cached = ViewCacheManager.getDataCache(cacheKey);
                    if (cached) {
                        console.log('Activity summary loaded from cache');
                        displayActivitySummary(cached);
                        return cached;
                    }
                }
                
                const result = await original.apply(this, arguments);
                
                if (ViewCacheManager && result) {
                    ViewCacheManager.setDataCache(cacheKey, result);
                }
                
                return result;
            };
        }
    },
    
    // Patch user management for faster list updates
    patchUserManagement() {
        // Patch loadUsers
        if (typeof loadUsers === 'function') {
            const original = loadUsers;
            window.loadUsers = async function() {
                const cacheKey = 'user-list-all';
                
                if (ViewCacheManager) {
                    const cached = ViewCacheManager.getDataCache(cacheKey);
                    if (cached) {
                        console.log('User list loaded from cache');
                        displayUsers(cached);
                        return cached;
                    }
                }
                
                const result = await original.apply(this, arguments);
                
                if (ViewCacheManager && result) {
                    ViewCacheManager.setDataCache(cacheKey, result);
                }
                
                return result;
            };
        }
    },
    
    // Patch analytics for faster chart rendering
    patchAnalytics() {
        // Patch renderAnalyticsCharts
        if (typeof renderAnalyticsCharts === 'function') {
            const original = renderAnalyticsCharts;
            window.renderAnalyticsCharts = async function(data) {
                // Use requestAnimationFrame for smooth rendering
                return new Promise((resolve) => {
                    requestAnimationFrame(async () => {
                        await original.apply(this, arguments);
                        resolve();
                    });
                });
            };
        }
        
        // Patch loadAnalyticsData
        if (typeof loadAnalyticsData === 'function') {
            const original = loadAnalyticsData;
            window.loadAnalyticsData = async function(period) {
                const cacheKey = `analytics-data-${period}`;
                
                if (ViewCacheManager) {
                    const cached = ViewCacheManager.getDataCache(cacheKey);
                    if (cached) {
                        console.log('Analytics data loaded from cache');
                        return cached;
                    }
                }
                
                const result = await original.apply(this, arguments);
                
                if (ViewCacheManager && result) {
                    ViewCacheManager.setDataCache(cacheKey, result);
                }
                
                return result;
            };
        }
    },
    
    // Batch API calls for better performance
    batchAPICall(calls) {
        return Promise.all(calls.map(call => 
            call.catch(error => {
                console.warn('Batch API call failed:', error);
                return null; // Return null for failed calls instead of throwing
            })
        ));
    },
    
    // Debounce function for input handlers
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // Throttle function for scroll handlers
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Initialize patches when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PerformancePatches.init();
    });
} else {
    PerformancePatches.init();
}

// Export for global access
window.PerformancePatches = PerformancePatches;