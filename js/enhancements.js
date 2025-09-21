// Visual Enhancements and Animations

// Add animation classes to dashboard cards
function enhanceDashboardCards() {
    // Add hover effects to all metric cards
    document.querySelectorAll('.bg-white.rounded-lg.shadow-sm').forEach(card => {
        if (!card.classList.contains('card-hover')) {
            card.classList.add('card-hover');
        }
    });
    
    // Animate numbers on load
    animateNumbers();
}

// Animate number counting
function animateNumbers() {
    const elements = document.querySelectorAll('[data-animate-number]');
    elements.forEach(element => {
        const target = parseInt(element.textContent) || 0;
        let current = 0;
        const increment = target / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.round(current).toLocaleString();
        }, 30);
    });
}

// Enhanced chart colors and gradients
function getEnhancedChartColors() {
    return {
        primary: {
            gradient: (ctx) => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
                gradient.addColorStop(1, 'rgba(118, 75, 162, 0.8)');
                return gradient;
            },
            solid: 'rgba(102, 126, 234, 0.8)',
            light: 'rgba(102, 126, 234, 0.1)'
        },
        success: {
            gradient: (ctx) => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
                return gradient;
            },
            solid: 'rgba(52, 211, 153, 0.8)',
            light: 'rgba(52, 211, 153, 0.1)'
        },
        warning: {
            gradient: (ctx) => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
                gradient.addColorStop(1, 'rgba(245, 158, 11, 0.8)');
                return gradient;
            },
            solid: 'rgba(251, 191, 36, 0.8)',
            light: 'rgba(251, 191, 36, 0.1)'
        },
        danger: {
            gradient: (ctx) => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
                gradient.addColorStop(1, 'rgba(220, 38, 38, 0.8)');
                return gradient;
            },
            solid: 'rgba(239, 68, 68, 0.8)',
            light: 'rgba(239, 68, 68, 0.1)'
        }
    };
}

// Add loading states
function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        `;
    }
}

// Enhanced notifications
function showEnhancedNotification(message, type = 'info', duration = 3000) {
    const colors = {
        success: 'bg-gradient-to-r from-green-400 to-green-600',
        error: 'bg-gradient-to-r from-red-400 to-red-600',
        warning: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        info: 'bg-gradient-to-r from-blue-400 to-blue-600'
    };
    
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg mb-3 notification-enter flex items-center`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)} mr-3"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('notification-exit');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed top-4 right-4 z-50';
    document.body.appendChild(container);
    return container;
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Add sparkline charts to metric cards
function addSparklines() {
    const sparklineData = {
        calls: [30, 45, 38, 52, 48, 55, 60],
        emails: [80, 95, 88, 102, 98, 110, 105],
        meetings: [3, 4, 3, 5, 4, 6, 5],
        pipeline: [50000, 75000, 65000, 90000, 85000, 120000, 150000]
    };
    
    // This would integrate with Chart.js to create small inline charts
    // Implementation depends on specific metric card structure
}

// Progress bars with animation
function createProgressBar(current, goal, color = 'indigo') {
    const percentage = Math.min((current / goal) * 100, 100);
    return `
        <div class="mt-2">
            <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>${current} / ${goal}</span>
                <span>${Math.round(percentage)}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div class="bg-${color}-500 h-2 rounded-full progress-bar transition-all duration-500 ease-out"
                     style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

// Enhanced table sorting
function makeTableSortable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            sortTable(table, index);
            // Add visual feedback
            header.classList.add('bg-gray-100');
            setTimeout(() => header.classList.remove('bg-gray-100'), 200);
        });
    });
}

function sortTable(table, columnIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const sortedRows = rows.sort((a, b) => {
        const aText = a.cells[columnIndex].textContent.trim();
        const bText = b.cells[columnIndex].textContent.trim();
        
        // Try to parse as number first
        const aNum = parseFloat(aText.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bText.replace(/[^0-9.-]/g, ''));
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }
        
        return aText.localeCompare(bText);
    });
    
    // Clear and re-append sorted rows
    tbody.innerHTML = '';
    sortedRows.forEach(row => tbody.appendChild(row));
}

// Add tooltips
function addTooltip(element, text) {
    element.setAttribute('title', text);
    element.classList.add('cursor-help');
    
    // Create custom tooltip on hover
    element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg tooltip';
        tooltip.textContent = text;
        tooltip.style.top = `${e.pageY + 10}px`;
        tooltip.style.left = `${e.pageX + 10}px`;
        document.body.appendChild(tooltip);
        
        setTimeout(() => tooltip.classList.add('show'), 10);
        
        element.addEventListener('mouseleave', () => {
            tooltip.remove();
        }, { once: true });
    });
}

// Keyboard shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for quick search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showQuickSearch();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
        
        // Number keys for quick navigation
        if (e.altKey && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const sections = ['dashboard', 'activity-entry', 'leaderboard', 'goals', 'users'];
            const index = parseInt(e.key) - 1;
            if (sections[index]) {
                showSection(sections[index]);
            }
        }
    });
}

// Quick search functionality
function showQuickSearch() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 w-96 animate-slideInDown">
            <h3 class="text-lg font-semibold mb-4">Quick Search</h3>
            <input type="text" id="quick-search-input" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                   placeholder="Search users, activities, or sections...">
            <div id="quick-search-results" class="mt-4 max-h-64 overflow-y-auto"></div>
            <button onclick="this.closest('.fixed').remove()" 
                    class="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    
    const input = document.getElementById('quick-search-input');
    input.focus();
    input.addEventListener('input', performQuickSearch);
}

function performQuickSearch(e) {
    const query = e.target.value.toLowerCase();
    const results = document.getElementById('quick-search-results');
    
    if (query.length < 2) {
        results.innerHTML = '';
        return;
    }
    
    // Search sections
    const sections = [
        { name: 'Dashboard', id: 'dashboard', icon: 'fa-chart-line' },
        { name: 'Activity Entry', id: 'activity-entry', icon: 'fa-plus-circle' },
        { name: 'Leaderboard', id: 'leaderboard', icon: 'fa-trophy' },
        { name: 'Goals', id: 'goals', icon: 'fa-bullseye' },
        { name: 'Users', id: 'users', icon: 'fa-users' }
    ];
    
    const matches = sections.filter(s => s.name.toLowerCase().includes(query));
    
    results.innerHTML = matches.map(section => `
        <div class="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center"
             onclick="showSection('${section.id}'); this.closest('.fixed').remove()">
            <i class="fas ${section.icon} mr-3 text-indigo-600"></i>
            <span>${section.name}</span>
        </div>
    `).join('');
}

function closeAllModals() {
    document.querySelectorAll('.fixed.inset-0').forEach(modal => modal.remove());
}

// Initialize all enhancements
function initializeEnhancements() {
    enhanceDashboardCards();
    initKeyboardShortcuts();
    
    // Add progress bars to goals
    document.querySelectorAll('[data-goal-progress]').forEach(element => {
        const current = parseInt(element.dataset.current) || 0;
        const goal = parseInt(element.dataset.goal) || 100;
        element.innerHTML = createProgressBar(current, goal);
    });
    
    // Make tables sortable
    ['leaderboard-table', 'users-table', 'activities-table'].forEach(tableId => {
        makeTableSortable(tableId);
    });
    
    console.log('Visual enhancements initialized');
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
    initializeEnhancements();
}