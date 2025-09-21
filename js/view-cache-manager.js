// View Cache Manager - Optimizes view switching and data loading
// Caches rendered views and data to eliminate loading delays when switching

const ViewCacheManager = {
    // Configuration
    cache: new Map(),
    dataCache: new Map(),
    renderCache: new Map(),
    cacheTimeout: 60000, // 1 minute
    maxCacheSize: 100,
    pendingLoads: new Map(),
    
    // Initialize the cache manager
    init() {
        console.log('View Cache Manager initialized');
        this.setupCacheInvalidation();
        this.injectCachingMethods();
    },
    
    // Setup automatic cache invalidation
    setupCacheInvalidation() {
        // Clear old entries every 30 seconds
        setInterval(() => {
            this.clearExpiredCache();
        }, 30000);
        
        // Clear cache on data changes
        document.addEventListener('dataUpdated', () => {
            this.invalidateDataCache();
        });
    },
    
    // Inject caching into existing functions
    injectCachingMethods() {
        // Cache leaderboard view switches
        this.cacheLeaderboardViews();
        
        // Cache dashboard view switches
        this.cacheDashboardViews();
        
        // Cache analytics views
        this.cacheAnalyticsViews();
        
        // Cache user management views
        this.cacheUserManagementViews();
    },
    
    // Cache leaderboard view switches
    cacheLeaderboardViews() {
        if (typeof updateLeaderboard === 'function') {
            const originalUpdate = updateLeaderboard;
            window.updateLeaderboard = async (view) => {
                const cacheKey = `leaderboard-${view}`;
                
                // Check cache first
                const cached = this.getCache(cacheKey);
                if (cached) {
                    console.log('Using cached leaderboard for:', view);
                    this.renderCachedView('leaderboard', cached);
                    return;
                }
                
                // Show loading state immediately
                this.showLoadingState('leaderboard');
                
                // Check if already loading
                if (this.pendingLoads.has(cacheKey)) {
                    await this.pendingLoads.get(cacheKey);
                    return;
                }
                
                // Load data
                const loadPromise = (async () => {
                    try {
                        // Capture the rendered content
                        const startCapture = this.startContentCapture('leaderboard');
                        await originalUpdate(view);
                        const content = this.endContentCapture(startCapture);
                        
                        // Cache the result
                        this.setCache(cacheKey, content);
                        
                    } finally {
                        this.pendingLoads.delete(cacheKey);
                        this.hideLoadingState('leaderboard');
                    }
                })();
                
                this.pendingLoads.set(cacheKey, loadPromise);
                await loadPromise;
            };
        }
    },
    
    // Cache dashboard view switches
    cacheDashboardViews() {
        // Cache dashboard type switches (AE, AM, Admin, All Sales)
        if (typeof changeDashboardView === 'function') {
            const originalChange = changeDashboardView;
            window.changeDashboardView = async (view) => {
                const cacheKey = `dashboard-${view}`;
                
                // Check cache
                const cached = this.getCache(cacheKey);
                if (cached) {
                    console.log('Using cached dashboard for:', view);
                    this.renderCachedView('dashboard', cached);
                    return;
                }
                
                // Show loading immediately
                this.showLoadingState('dashboard');
                
                // Load with caching
                try {
                    const startCapture = this.startContentCapture('dashboard');
                    await originalChange(view);
                    const content = this.endContentCapture(startCapture);
                    this.setCache(cacheKey, content);
                } finally {
                    this.hideLoadingState('dashboard');
                }
            };
        }
        
        // Cache period switches (week, month, quarter)
        if (typeof updateDashboardPeriod === 'function') {
            const originalUpdate = updateDashboardPeriod;
            window.updateDashboardPeriod = async (period) => {
                const currentView = window.dashboardView || 'ae';
                const cacheKey = `dashboard-${currentView}-${period}`;
                
                // Check cache
                const cached = this.getCache(cacheKey);
                if (cached) {
                    console.log('Using cached dashboard period:', period);
                    this.renderCachedView('dashboard-metrics', cached);
                    return;
                }
                
                // Load with caching
                this.showLoadingState('dashboard-metrics');
                try {
                    await originalUpdate(period);
                    // Cache the metrics data
                    const metricsData = this.captureMetricsData();
                    this.setCache(cacheKey, metricsData);
                } finally {
                    this.hideLoadingState('dashboard-metrics');
                }
            };
        }
    },
    
    // Cache analytics views
    cacheAnalyticsViews() {
        if (typeof loadAnalyticsView === 'function') {
            const originalLoad = loadAnalyticsView;
            window.loadAnalyticsView = async (view, params) => {
                const cacheKey = `analytics-${view}-${JSON.stringify(params || {})}`;
                
                // Check cache
                const cached = this.getCache(cacheKey);
                if (cached) {
                    console.log('Using cached analytics for:', view);
                    this.renderCachedView('analytics', cached);
                    return;
                }
                
                // Load with caching
                this.showLoadingState('analytics');
                try {
                    const result = await originalLoad(view, params);
                    this.setCache(cacheKey, result);
                    return result;
                } finally {
                    this.hideLoadingState('analytics');
                }
            };
        }
    },
    
    // Cache user management views
    cacheUserManagementViews() {
        if (typeof loadUserManagementView === 'function') {
            const originalLoad = loadUserManagementView;
            window.loadUserManagementView = async (filter) => {
                const cacheKey = `users-${filter || 'all'}`;
                
                // Check cache
                const cached = this.getCache(cacheKey);
                if (cached) {
                    console.log('Using cached user list for:', filter);
                    this.renderCachedView('users', cached);
                    return;
                }
                
                // Load with caching
                this.showLoadingState('users');
                try {
                    const result = await originalLoad(filter);
                    this.setCache(cacheKey, result);
                    return result;
                } finally {
                    this.hideLoadingState('users');
                }
            };
        }
    },
    
    // Cache API calls
    async cachedAPICall(apiFunction, args, cacheKey, forceRefresh = false) {
        // Generate cache key if not provided
        if (!cacheKey) {
            cacheKey = `api-${apiFunction.name}-${JSON.stringify(args)}`;
        }
        
        // Check cache unless force refresh
        if (!forceRefresh) {
            const cached = this.getDataCache(cacheKey);
            if (cached) {
                console.log('API cache hit:', cacheKey);
                return cached;
            }
        }
        
        // Check if already loading
        if (this.pendingLoads.has(cacheKey)) {
            console.log('Waiting for pending load:', cacheKey);
            return await this.pendingLoads.get(cacheKey);
        }
        
        // Make API call
        const loadPromise = (async () => {
            try {
                const result = await apiFunction(...args);
                this.setDataCache(cacheKey, result);
                return result;
            } finally {
                this.pendingLoads.delete(cacheKey);
            }
        })();
        
        this.pendingLoads.set(cacheKey, loadPromise);
        return await loadPromise;
    },
    
    // Get from cache
    getCache(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < this.cacheTimeout) {
            item.hits = (item.hits || 0) + 1;
            console.log(`Cache hit for ${key} (${item.hits} hits)`);
            return item.data;
        }
        return null;
    },
    
    // Set cache
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            hits: 0
        });
        
        // Limit cache size
        if (this.cache.size > this.maxCacheSize) {
            // Remove least recently used
            const lru = this.findLeastRecentlyUsed();
            if (lru) {
                this.cache.delete(lru);
            }
        }
    },
    
    // Get data cache
    getDataCache(key) {
        const item = this.dataCache.get(key);
        if (item && Date.now() - item.timestamp < this.cacheTimeout) {
            return item.data;
        }
        return null;
    },
    
    // Set data cache
    setDataCache(key, data) {
        this.dataCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    },
    
    // Clear expired cache entries
    clearExpiredCache() {
        const now = Date.now();
        let cleared = 0;
        
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                cleared++;
            }
        }
        
        for (const [key, item] of this.dataCache.entries()) {
            if (now - item.timestamp > this.cacheTimeout) {
                this.dataCache.delete(key);
                cleared++;
            }
        }
        
        if (cleared > 0) {
            console.log(`Cleared ${cleared} expired cache entries`);
        }
    },
    
    // Invalidate data cache
    invalidateDataCache() {
        this.dataCache.clear();
        console.log('Data cache invalidated');
    },
    
    // Invalidate specific cache pattern
    invalidatePattern(pattern) {
        let cleared = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                cleared++;
            }
        }
        for (const key of this.dataCache.keys()) {
            if (key.includes(pattern)) {
                this.dataCache.delete(key);
                cleared++;
            }
        }
        console.log(`Invalidated ${cleared} cache entries matching: ${pattern}`);
    },
    
    // Find least recently used cache entry
    findLeastRecentlyUsed() {
        let oldest = null;
        let oldestTime = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTime) {
                oldest = key;
                oldestTime = item.timestamp;
            }
        }
        
        return oldest;
    },
    
    // Start content capture
    startContentCapture(sectionId) {
        const section = document.getElementById(`${sectionId}-section`) || 
                       document.querySelector(`[data-section="${sectionId}"]`);
        if (section) {
            return {
                section: section,
                originalContent: section.innerHTML
            };
        }
        return null;
    },
    
    // End content capture
    endContentCapture(capture) {
        if (capture && capture.section) {
            return capture.section.innerHTML;
        }
        return null;
    },
    
    // Render cached view
    renderCachedView(sectionId, content) {
        const section = document.getElementById(`${sectionId}-section`) || 
                       document.querySelector(`[data-section="${sectionId}"]`);
        if (section && content) {
            // Add fade effect
            section.style.opacity = '0.5';
            section.innerHTML = content;
            
            // Re-initialize any necessary event listeners
            this.reinitializeEventListeners(sectionId);
            
            // Fade back in
            requestAnimationFrame(() => {
                section.style.opacity = '1';
                section.style.transition = 'opacity 0.2s';
            });
        }
    },
    
    // Capture metrics data
    captureMetricsData() {
        const metrics = {};
        document.querySelectorAll('[data-metric]').forEach(el => {
            metrics[el.dataset.metric] = el.textContent;
        });
        return metrics;
    },
    
    // Show loading state for a section
    showLoadingState(sectionId) {
        const section = document.getElementById(`${sectionId}-section`) || 
                       document.querySelector(`[data-section="${sectionId}"]`);
        if (section) {
            // Add loading overlay
            if (!section.querySelector('.cache-loading-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'cache-loading-overlay';
                overlay.innerHTML = `
                    <div style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); 
                               display: flex; align-items: center; justify-content: center; z-index: 100;">
                        <div style="text-align: center;">
                            <i class="fas fa-spinner fa-spin text-2xl text-indigo-600"></i>
                            <p class="mt-2 text-sm text-gray-600">Loading...</p>
                        </div>
                    </div>
                `;
                section.style.position = 'relative';
                section.appendChild(overlay);
            }
        }
    },
    
    // Hide loading state
    hideLoadingState(sectionId) {
        const section = document.getElementById(`${sectionId}-section`) || 
                       document.querySelector(`[data-section="${sectionId}"]`);
        if (section) {
            const overlay = section.querySelector('.cache-loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    },
    
    // Reinitialize event listeners after cached render
    reinitializeEventListeners(sectionId) {
        // Re-attach chart click handlers
        if (sectionId === 'dashboard' || sectionId === 'analytics') {
            if (typeof attachChartHandlers === 'function') {
                attachChartHandlers();
            }
        }
        
        // Re-attach table sorting
        if (sectionId === 'leaderboard' || sectionId === 'users') {
            if (typeof attachTableHandlers === 'function') {
                attachTableHandlers();
            }
        }
    },
    
    // Preload views in background
    preloadViews(views) {
        console.log('Preloading views in background...');
        
        // Use requestIdleCallback for non-blocking preload
        if ('requestIdleCallback' in window) {
            views.forEach(view => {
                requestIdleCallback(() => {
                    this.preloadView(view);
                }, { timeout: 5000 });
            });
        }
    },
    
    // Preload a single view
    async preloadView(view) {
        try {
            // Simulate loading the view without displaying it
            console.log('Preloading view:', view);
            // Implementation depends on your view loading logic
        } catch (error) {
            console.warn('Failed to preload view:', view, error);
        }
    },
    
    // Get cache statistics
    getStats() {
        return {
            cacheSize: this.cache.size,
            dataCacheSize: this.dataCache.size,
            pendingLoads: this.pendingLoads.size,
            totalHits: Array.from(this.cache.values()).reduce((sum, item) => sum + (item.hits || 0), 0),
            memoryEstimate: this.estimateMemoryUsage()
        };
    },
    
    // Estimate memory usage
    estimateMemoryUsage() {
        let bytes = 0;
        
        // Estimate cache memory
        for (const [key, value] of this.cache.entries()) {
            bytes += key.length * 2; // Unicode chars
            bytes += JSON.stringify(value.data).length * 2;
        }
        
        for (const [key, value] of this.dataCache.entries()) {
            bytes += key.length * 2;
            bytes += JSON.stringify(value.data).length * 2;
        }
        
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    },
    
    // Clear all caches
    clearAll() {
        this.cache.clear();
        this.dataCache.clear();
        this.renderCache.clear();
        this.pendingLoads.clear();
        console.log('All caches cleared');
    }
};

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ViewCacheManager.init());
} else {
    ViewCacheManager.init();
}

// Export for global access
window.ViewCacheManager = ViewCacheManager;