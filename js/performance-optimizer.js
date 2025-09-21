// Performance Optimization Module
// Improves loading times, reduces API calls, and enhances rendering performance

const PerformanceOptimizer = {
    // Configuration
    LAZY_LOAD_THRESHOLD: 100, // Items to load at once
    DEBOUNCE_DELAY: 300, // Milliseconds
    THROTTLE_DELAY: 1000, // Milliseconds
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    
    // State
    cache: new Map(),
    pendingRequests: new Map(),
    loadingStates: new Map(),
    
    // Initialize performance optimizations
    init() {
        try {
            this.setupLazyLoading();
            this.setupIntersectionObserver();
            this.setupRequestDeduplication();
            this.optimizeInitialLoad();
            console.log('Performance Optimizer initialized');
        } catch (error) {
            console.warn('Performance Optimizer init error (non-fatal):', error);
        }
    },
    
    // Optimize initial page load
    optimizeInitialLoad() {
        // Defer non-critical scripts
        this.deferNonCriticalScripts();
        
        // Load critical data first
        this.prioritizeCriticalData();
        
        // Progressive rendering
        this.enableProgressiveRendering();
        
        // Preload critical resources
        this.preloadCriticalResources();
    },
    
    // Defer non-critical scripts
    deferNonCriticalScripts() {
        // Move chart initialization to after initial render
        if (typeof initializeCharts === 'function') {
            const originalInit = initializeCharts;
            window.initializeCharts = () => {
                requestIdleCallback(() => {
                    originalInit();
                }, { timeout: 2000 });
            };
        }
        
        // Defer analytics and non-essential features
        window.addEventListener('load', () => {
            requestIdleCallback(() => {
                // Load analytics and tracking
                this.loadDeferredModules();
            });
        });
    },
    
    // Prioritize critical data loading
    prioritizeCriticalData() {
        // Define critical data priorities
        const priorities = {
            high: ['currentUser', 'dashboardMetrics'],
            medium: ['activities', 'goals'],
            low: ['leaderboard', 'analytics']
        };
        
        // Load in priority order
        this.loadDataByPriority(priorities);
    },
    
    // Load data by priority
    async loadDataByPriority(priorities) {
        // High priority - load immediately
        for (const dataType of priorities.high) {
            this.loadCriticalData(dataType);
        }
        
        // Medium priority - load after initial render
        requestAnimationFrame(() => {
            for (const dataType of priorities.medium) {
                this.loadCriticalData(dataType); // Use loadCriticalData instead
            }
        });
        
        // Low priority - load when idle
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                for (const dataType of priorities.low) {
                    this.loadCriticalData(dataType); // Use loadCriticalData instead
                }
            });
        }
    },
    
    // Load critical data with caching
    async loadCriticalData(dataType) {
        // Check cache first
        const cached = this.getFromCache(dataType);
        if (cached) {
            return cached;
        }
        
        // Load data based on type
        let data;
        switch (dataType) {
            case 'currentUser':
                // User data is handled by Auth module
                break;
            case 'dashboardMetrics':
                data = await this.loadDashboardMetricsOptimized();
                break;
        }
        
        if (data) {
            this.setCache(dataType, data);
        }
        return data;
    },
    
    // Optimized dashboard metrics loading
    async loadDashboardMetricsOptimized() {
        // Load only essential metrics first
        const essentialMetrics = {
            todayActivities: 0,
            weekProgress: 0,
            monthProgress: 0
        };
        
        // Update UI immediately with placeholders
        this.updateUIWithPlaceholders(essentialMetrics);
        
        // Load actual data in background
        requestAnimationFrame(async () => {
            try {
                // Simple metrics fetch - don't call non-existent function
                if (typeof loadDashboardMetrics === 'function') {
                    const fullMetrics = await loadDashboardMetrics();
                    this.updateUIWithData(fullMetrics);
                }
            } catch (error) {
                console.error('Failed to load metrics:', error);
            }
        });
        
        return essentialMetrics;
    },
    
    // Enable progressive rendering
    enableProgressiveRendering() {
        // Render visible content first
        const visibleSections = document.querySelectorAll('.content-section:not(.hidden)');
        visibleSections.forEach(section => {
            section.style.contentVisibility = 'auto';
            section.style.containIntrinsicSize = '1000px';
        });
        
        // Defer hidden content rendering
        const hiddenSections = document.querySelectorAll('.content-section.hidden');
        hiddenSections.forEach(section => {
            section.style.contentVisibility = 'hidden';
        });
    },
    
    // Setup lazy loading for lists and tables
    setupLazyLoading() {
        // Find all data tables and lists
        const dataContainers = document.querySelectorAll('[data-lazy-load]');
        
        dataContainers.forEach(container => {
            this.applyLazyLoading(container);
        });
    },
    
    // Apply lazy loading to a container
    applyLazyLoading(container) {
        let loadedItems = 0;
        const totalItems = parseInt(container.dataset.totalItems || '0');
        
        if (totalItems <= this.LAZY_LOAD_THRESHOLD) {
            return; // No need for lazy loading
        }
        
        // Initial load
        this.loadBatch(container, 0, this.LAZY_LOAD_THRESHOLD);
        
        // Load more on scroll
        container.addEventListener('scroll', this.throttle(() => {
            const scrollPercentage = (container.scrollTop + container.clientHeight) / container.scrollHeight;
            
            if (scrollPercentage > 0.8 && loadedItems < totalItems) {
                loadedItems = Math.min(loadedItems + this.LAZY_LOAD_THRESHOLD, totalItems);
                this.loadBatch(container, loadedItems - this.LAZY_LOAD_THRESHOLD, loadedItems);
            }
        }, this.THROTTLE_DELAY));
    },
    
    // Load batch of items
    async loadBatch(container, start, end) {
        const loadingIndicator = this.showLoadingIndicator(container);
        
        try {
            const items = await this.fetchItems(container.dataset.source, start, end);
            this.renderItems(container, items);
        } catch (error) {
            console.error('Failed to load batch:', error);
        } finally {
            this.hideLoadingIndicator(loadingIndicator);
        }
    },
    
    // Setup Intersection Observer for viewport-based loading
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Load content when element comes into view
                    if (element.dataset.lazyContent) {
                        this.loadLazyContent(element);
                        observer.unobserve(element);
                    }
                    
                    // Initialize charts when visible
                    if (element.dataset.lazyChart) {
                        this.initializeLazyChart(element);
                        observer.unobserve(element);
                    }
                }
            });
        }, options);
        
        // Observe all lazy elements
        document.querySelectorAll('[data-lazy-content], [data-lazy-chart]').forEach(el => {
            observer.observe(el);
        });
    },
    
    // Setup request deduplication
    setupRequestDeduplication() {
        // Override API methods to deduplicate requests
        if (typeof API !== 'undefined') {
            const originalGet = API.getActivities;
            API.getActivities = async (filters) => {
                const key = JSON.stringify(filters);
                
                // Check if request is already pending
                if (this.pendingRequests.has(key)) {
                    return this.pendingRequests.get(key);
                }
                
                // Check cache
                const cached = this.getFromCache(key);
                if (cached) {
                    return cached;
                }
                
                // Make request and cache promise
                const promise = originalGet.call(API, filters);
                this.pendingRequests.set(key, promise);
                
                try {
                    const result = await promise;
                    this.setCache(key, result);
                    return result;
                } finally {
                    this.pendingRequests.delete(key);
                }
            };
        }
    },
    
    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    },
    
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    },
    
    // Utility functions
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    },
    
    // UI updates with placeholders
    updateUIWithPlaceholders(data) {
        // Add skeleton loaders
        const elements = document.querySelectorAll('[data-metric]');
        elements.forEach(el => {
            el.classList.add('skeleton-loader');
            el.innerHTML = '<span class="loading-placeholder">Loading...</span>';
        });
    },
    
    updateUIWithData(data) {
        // Remove skeleton loaders and update with real data
        const elements = document.querySelectorAll('[data-metric]');
        elements.forEach(el => {
            el.classList.remove('skeleton-loader');
            const metric = el.dataset.metric;
            if (data[metric] !== undefined) {
                el.textContent = data[metric];
            }
        });
    },
    
    // Loading indicators
    showLoadingIndicator(container) {
        const loader = document.createElement('div');
        loader.className = 'loading-indicator';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        container.appendChild(loader);
        return loader;
    },
    
    hideLoadingIndicator(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    },
    
    // Preload critical resources
    preloadCriticalResources() {
        // Preload fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.as = 'font';
        fontLink.type = 'font/woff2';
        fontLink.href = 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2';
        fontLink.crossOrigin = 'anonymous';
        document.head.appendChild(fontLink);
        
        // Prefetch API endpoints
        if ('connection' in navigator && navigator.connection.effectiveType === '4g') {
            this.prefetchAPIEndpoints();
        }
    },
    
    // Prefetch common API endpoints
    prefetchAPIEndpoints() {
        const endpoints = [
            'tables/users',
            'tables/activities?limit=20',
            'tables/goals'
        ];
        
        endpoints.forEach(endpoint => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = endpoint;
            document.head.appendChild(link);
        });
    },
    
    // Load deferred modules
    loadDeferredModules() {
        // Don't load non-existent modules
        console.log('Deferred modules loading skipped (modules not yet implemented)');
    },
    
    // Memory cleanup
    cleanup() {
        this.cache.clear();
        this.pendingRequests.clear();
        this.loadingStates.clear();
    },
    
    // Performance metrics
    getMetrics() {
        const metrics = {
            cacheSize: this.cache.size,
            cacheHitRate: this.calculateCacheHitRate(),
            pendingRequests: this.pendingRequests.size,
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 'N/A'
        };
        
        return metrics;
    },
    
    calculateCacheHitRate() {
        // Implementation would track cache hits vs misses
        return 'Not implemented';
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PerformanceOptimizer.init());
} else {
    PerformanceOptimizer.init();
}

// Export for debugging
window.PerformanceOptimizer = PerformanceOptimizer;