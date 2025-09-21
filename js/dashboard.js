// Dashboard JavaScript
class SalesDashboard {
    constructor() {
        this.currentView = 'week'; // week or month
        this.currentRole = 'ae'; // ae or am
        this.currentAMCategory = 'cross-sell';
        this.currentUser = null;
        this.isAdmin = false;
        this.selectedUserId = null;
        this.charts = {};
        this.data = {
            activities: [],
            goals: {}
        };
        
        this.init();
    }
    
    async init() {
        this.checkAuthentication();
        this.setupEventListeners();
        await this.loadUserData();
        await this.loadActivities();
        this.updateDashboard();
        this.startAutoRefresh();
        // Real-time sync similar to Analytics Dashboard
        window.addEventListener('storage', async (e)=>{
            if (e.key==='ascm_activities_updated' || e.key==='ascm_week_reset') {
                console.log('[Activity Dashboard] storage event → refresh');
                await this.loadActivities();
                this.updateDashboard();
                this.flashSyncStatus();
            }
        });
        document.addEventListener('visibilitychange', async ()=>{
            if (!document.hidden) {
                console.log('[Activity Dashboard] visibility → refresh');
                await this.loadActivities();
                this.updateDashboard();
            }
        });
    }
    
    checkAuthentication() {
        // Prefer shared ascm_session; fallback to legacy currentUser
        let s = null;
        try { s = JSON.parse(localStorage.getItem('ascm_session')||'null'); } catch {}
        if (!s) {
            const legacy = localStorage.getItem('currentUser');
            if (legacy) { try { s = JSON.parse(legacy); } catch {} }
        }
        if (!s) { window.location.href = 'index.html'; return; }
        this.currentUser = { id: s.id, name: s.name || s.email || 'User', role: (s.role||'').toLowerCase() };
        this.isAdmin = this.currentUser.role === 'admin';
        
        // Update UI with user info
        document.getElementById('currentUser').textContent = 
            `${this.currentUser.name} (${this.currentUser.role})`;
        
        // Show admin controls if admin
        if (this.isAdmin) {
            document.getElementById('adminControls').classList.remove('hidden');
            this.loadUserList();
        }
    }
    
    setupEventListeners() {
        // View toggles
        document.getElementById('weekView').addEventListener('click', () => {
            this.setView('week');
        });
        
        document.getElementById('monthView').addEventListener('click', () => {
            this.setView('month');
        });
        
        // Role toggles
        document.getElementById('aeView').addEventListener('click', () => {
            this.setRole('ae');
        });
        
        document.getElementById('amView').addEventListener('click', () => {
            this.setRole('am');
        });
        
        // AM category tabs
        document.querySelectorAll('.am-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setAMCategory(e.target.dataset.category);
            });
        });
        
        // Trend metric buttons
        document.querySelectorAll('.trend-metric').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateTrendChart(e.target.dataset.metric);
                // Update active state
                document.querySelectorAll('.trend-metric').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Admin user selector
        if (this.isAdmin) {
            document.getElementById('userSelector').addEventListener('change', (e) => {
                this.selectedUserId = e.target.value;
                this.loadActivities();
            });
        }
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
    
    setView(view) {
        this.currentView = view;
        
        // Update toggle buttons
        document.querySelectorAll('.view-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');
        
        this.updateDashboard();
    }
    
    setRole(role) {
        this.currentRole = role;
        
        // Update toggle buttons
        document.querySelectorAll('.role-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${role}View`).classList.add('active');
        
        // Show/hide AM tabs
        if (role === 'am') {
            document.getElementById('amTabs').classList.remove('hidden');
        } else {
            document.getElementById('amTabs').classList.add('hidden');
        }
        
        this.updateDashboard();
    }
    
    setAMCategory(category) {
        this.currentAMCategory = category;
        
        // Update tab active states
        document.querySelectorAll('.am-tab').forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        this.updateDashboard();
    }
    
    async loadUserData() {
        try {
            // Load goals from API via resilient wrapper
            const result = await this.apiJson('GET','tables/goals');
            // Process goals by user and period
            this.data.goals = {};
            (result.data||[]).forEach(goal => {
                const key = `${goal.user_id}_${goal.period}_${goal.metric}`;
                this.data.goals[key] = goal.target;
            });
        } catch (error) {
            console.error('Error loading goals:', error);
            // Use default goals as fallback
            this.setDefaultGoals();
        }
    }
    
    setDefaultGoals() {
        // Default weekly goals
        const weeklyGoals = {
            calls: 50,
            emails: 80,
            meetings: 30,
            demos: 15,
            deals: 5,
            pipelineGenerated: 150000,
            revenueClosed: 75000
        };
        
        // Default monthly goals (4x weekly)
        const monthlyGoals = {
            calls: 200,
            emails: 320,
            meetings: 120,
            demos: 60,
            deals: 20,
            pipelineGenerated: 600000,
            revenueClosed: 300000
        };
        
        this.data.goals = { weekly: weeklyGoals, monthly: monthlyGoals };
    }
    
    async apiRequest(method, path, body, tries=3){
        let last='';
        for (let i=0;i<tries;i++){
            const res = await fetch(path, { method, headers:{'Content-Type':'application/json'}, body: body!=null?JSON.stringify(body):undefined, cache:'no-store', credentials:'same-origin' });
            const ct = (res.headers.get('content-type')||'').toLowerCase();
            if (res.status===401 || res.status===403 || ct.includes('text/html')){
                try { last = await res.text(); } catch {}
                try { await fetch('tables/users?limit=1', { cache:'no-store', credentials:'same-origin' }); } catch {}
                await new Promise(r=>setTimeout(r,1200));
                continue;
            }
            return res;
        }
        throw new Error('API blocked '+last.slice(0,160));
    }
    async apiJson(method, path, body, tries=3){ const res=await this.apiRequest(method, path, body, tries); if(!res.ok){ let t=''; try{ t=await res.text(); }catch{}; throw new Error(method+' '+path+' -> '+res.status+' '+t.slice(0,160)); } if(res.status===204) return {}; try{ return await res.json(); }catch{ return {}; } }

    async loadActivities() {
        try {
            const all = await this.apiJson('GET','tables/activities?limit=2000');
            const allRows = all.data || [];
            const uid = this.selectedUserId || this.currentUser.id;
            // Filter by user when selected; admins may choose all users by leaving selector empty
            this.data.activities = uid ? allRows.filter(a => (a.userId||a.user_id) === uid) : allRows;
            console.log('[Activity Dashboard] loaded activities:', this.data.activities.length);
            document.getElementById('lastSync').textContent = new Date().toLocaleString();
            if (this.data.activities.length === 0) {
                document.getElementById('noDataOverlay').classList.remove('hidden');
            } else {
                document.getElementById('noDataOverlay').classList.add('hidden');
            }
        } catch (error) {
            console.error('Error loading activities:', error);
            // Fallback: keep previous data
        }
    }
    
    loadMockData() {
        // Generate mock data for demonstration
        const types = ['call', 'email', 'meeting', 'demo', 'deal'];
        const outcomes = ['positive', 'neutral', 'negative'];
        const activities = [];
        
        const now = new Date();
        for (let i = 0; i < 100; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
            
            activities.push({
                id: `mock-${i}`,
                type: types[Math.floor(Math.random() * types.length)],
                outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
                prospect_name: `Prospect ${i + 1}`,
                prospect_company: `Company ${Math.floor(i / 5) + 1}`,
                date: date.toISOString(),
                notes: `Activity notes for item ${i + 1}`,
                user_id: this.currentUser.id
            });
        }
        
        this.data.activities = activities;
        document.getElementById('noDataOverlay').classList.add('hidden');
    }
    
    async loadUserList() {
        if (!this.isAdmin) return;
        
        try {
            const result = await this.apiJson('GET','tables/users?limit=1000');
            const selector = document.getElementById('userSelector');
            selector.innerHTML = '<option value="">All Users</option>';
            (result.data||[]).forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.name || user.email || 'User'} (${(user.role||'').toUpperCase()})`;
                selector.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading users:', error);
            // Add mock users for demonstration
            const selector = document.getElementById('userSelector');
            selector.innerHTML = `
                <option value="">All Users</option>
                <option value="user1">John Smith (AE)</option>
                <option value="user2">Jane Doe (AM)</option>
                <option value="user3">Bob Johnson (AE)</option>
            `;
        }
    }
    
    updateDashboard() {
        this.updateKPICards();
        this.updateCharts();
        this.updateRecentActivities();
    }
    
    updateKPICards() {
        const metrics = this.getMetricsForRole();
        const kpiGrid = document.getElementById('kpiGrid');
        kpiGrid.innerHTML = '';
        
        metrics.forEach(metric => {
            const card = this.createKPICard(metric);
            kpiGrid.appendChild(card);
        });
    }
    
    getMetricsForRole() {
        // For consistency, align with shared field keys in activities table
        return ['calls','emails','meetings','demos','deals','pipelineGenerated','revenueClosed'];
    }
    
    createKPICard(metric) {
        const current = this.calculateMetric(metric, this.currentView);
        const previous = this.calculateMetric(metric, this.currentView, true);
        const goal = this.getGoal(metric, this.currentView);
        const progress = goal > 0 ? (current / goal) * 100 : 0;
        const trend = this.calculateTrend(current, previous);
        const isMoney = (metric === 'pipelineGenerated' || metric === 'revenueClosed');
        const label = metric === 'pipelineGenerated' ? 'Pipeline Generated ($)'
                    : metric === 'revenueClosed' ? 'Revenue Closed ($)'
                    : metric.replace(/_/g, ' ');
        const currentDisplay = isMoney ? ('$' + Number(current||0).toLocaleString()) : current;
        const goalDisplay = isMoney ? ('$' + Number(goal||0).toLocaleString()) : goal;
        
        const card = document.createElement('div');
        card.className = 'kpi-card';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="text-sm font-medium text-gray-600">${label}</h4>
                <span class="text-xs text-gray-500">Goal: ${goalDisplay}</span>
            </div>
            <div class="kpi-metric">${currentDisplay}</div>
            <div class="kpi-goal">
                ${this.createRadialGauge(progress)}
                <span class="text-sm font-medium">${Math.round(progress)}% of goal</span>
            </div>
            <div class="flex justify-between mt-3">
                <div class="trend-indicator ${trend.class}">
                    <span>${trend.icon}</span>
                    <span>${Math.abs(trend.value)}%</span>
                </div>
                <span class="text-xs text-gray-500">vs prev ${this.currentView}</span>
            </div>
        `;
        
        return card;
    }
    
    calculateMetric(metric, period, isPrevious = false) {
        const METRIC_MAP = { calls:'callsMade', emails:'emailsSent', meetings:'meetingsBooked', demos:'meetingsConducted', deals:'opportunitiesGenerated' };
        const field = METRIC_MAP[metric] || metric;
        const now = new Date();
        let startDate, endDate;
        if (period === 'week') {
            const offset = isPrevious ? 7 : 0;
            startDate = new Date(now); startDate.setDate(now.getDate() - (6 + offset)); startDate.setHours(0,0,0,0);
            endDate = new Date(now); endDate.setDate(now.getDate() - offset); endDate.setHours(23,59,59,999);
        } else {
            const offsetDays = isPrevious ? 30 : 0;
            startDate = new Date(now); startDate.setDate(now.getDate() - (29 + offsetDays)); startDate.setHours(0,0,0,0);
            endDate = new Date(now); endDate.setDate(now.getDate() - offsetDays); endDate.setHours(23,59,59,999);
        }
        const cat = (this.currentRole==='am') ? (this.currentAMCategory||'all') : 'all';
        const rows = this.data.activities.filter(a=>{
            const d = new Date(a.date || a.createdAt);
            if (d < startDate || d > endDate) return false;
            if (this.currentRole==='am' && cat!=='all') { if ((a.category||'') !== cat) return false; }
            return true;
        });
        return rows.reduce((s,a)=> s + (Number(a[field])||0), 0);
    }
    
    getGoal(metric, period) {
        const userId = this.selectedUserId || this.currentUser.id;
        const norm = period === 'week' ? 'weekly' : (period === 'month' ? 'monthly' : period);
        const key1 = `${userId}_${norm}_${metric}`;
        const key2 = `${userId}_${period}_${metric}`;
        if (this.data.goals[key1] != null) return this.data.goals[key1];
        if (this.data.goals[key2] != null) return this.data.goals[key2];
        
        // Default goals
        const defaults = {
            week: { calls: 50, emails: 80, meetings: 30, demos: 15, deals: 5, pipelineGenerated: 150000, revenueClosed: 75000 },
            month: { calls: 200, emails: 320, meetings: 120, demos: 60, deals: 20, pipelineGenerated: 600000, revenueClosed: 300000 }
        };
        
        return defaults[period]?.[metric] || 10;
    }
    
    calculateTrend(current, previous) {
        if (previous === 0) {
            return { value: current > 0 ? 100 : 0, icon: '▲', class: 'trend-up' };
        }
        
        const change = ((current - previous) / previous) * 100;
        
        if (change > 0) {
            return { value: Math.round(change), icon: '▲', class: 'trend-up' };
        } else if (change < 0) {
            return { value: Math.round(Math.abs(change)), icon: '▼', class: 'trend-down' };
        } else {
            return { value: 0, icon: '–', class: 'trend-flat' };
        }
    }
    
    createRadialGauge(percentage) {
        const radius = 25;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        
        let colorClass = 'low';
        if (percentage >= 80) colorClass = 'high';
        else if (percentage >= 50) colorClass = 'medium';
        
        return `
            <div class="radial-gauge">
                <svg width="60" height="60">
                    <circle class="gauge-background" cx="30" cy="30" r="${radius}"></circle>
                    <circle class="gauge-progress ${colorClass}" cx="30" cy="30" r="${radius}"
                            style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}"></circle>
                </svg>
                <div class="gauge-text">${Math.round(percentage)}%</div>
            </div>
        `;
    }
    
    updateCharts() {
        this.updateDistributionChart();
        this.updateTrendChart('calls'); // Default to calls
    }
    
    updateDistributionChart() {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }
        
        const metrics = this.getMetricsForRole().filter(m=> m!=='pipelineGenerated' && m!=='revenueClosed');
        const data = metrics.map(metric => this.calculateMetric(metric, this.currentView));
        
        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: metrics.map(m => m.replace(/_/g, ' ').toUpperCase()),
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#14B8A6',
                        '#1E3A8A',
                        '#8B5CF6',
                        '#22C55E',
                        '#F59E0B'
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateTrendChart(metric) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }
        
        const labels = [];
        const currentData = [];
        const previousData = [];
        
        if (this.currentView === 'week') {
            // Daily data for past 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                
                // Calculate daily metrics
                currentData.push(this.calculateDailyMetric(metric, date));
                
                const prevDate = new Date(date);
                prevDate.setDate(prevDate.getDate() - 7);
                previousData.push(this.calculateDailyMetric(metric, prevDate));
            }
        } else {
            // Weekly data for past 4 weeks
            for (let i = 3; i >= 0; i--) {
                labels.push(`Week ${4 - i}`);
                
                // Calculate weekly metrics
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);
                
                currentData.push(this.calculatePeriodMetric(metric, weekStart, weekEnd));
                
                const prevWeekStart = new Date(weekStart);
                prevWeekStart.setDate(prevWeekStart.getDate() - 28);
                const prevWeekEnd = new Date(prevWeekStart);
                prevWeekEnd.setDate(prevWeekEnd.getDate() + 7);
                
                previousData.push(this.calculatePeriodMetric(metric, prevWeekStart, prevWeekEnd));
            }
        }
        
        this.charts.trend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Current Period',
                        data: currentData,
                        backgroundColor: '#14B8A6',
                        borderColor: '#14B8A6',
                        borderWidth: 2
                    },
                    {
                        label: 'Previous Period',
                        data: previousData,
                        backgroundColor: '#9CA3AF',
                        borderColor: '#9CA3AF',
                        borderWidth: 2
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
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    calculateDailyMetric(metric, date) {
        const METRIC_MAP = { calls:'callsMade', emails:'emailsSent', meetings:'meetingsBooked', demos:'meetingsConducted', deals:'opportunitiesGenerated' };
        const field = METRIC_MAP[metric] || metric;
        const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(date); endOfDay.setHours(23,59,59,999);
        const cat = (this.currentRole==='am') ? (this.currentAMCategory||'all') : 'all';
        const rows = this.data.activities.filter(a=>{
            const d=new Date(a.date||a.createdAt);
            if (d < startOfDay || d > endOfDay) return false;
            if (this.currentRole==='am' && cat!=='all') { if ((a.category||'') !== cat) return false; }
            return true;
        });
        return rows.reduce((s,a)=> s + (Number(a[field])||0), 0);
    }
    
    calculatePeriodMetric(metric, startDate, endDate) {
        const METRIC_MAP = { calls:'callsMade', emails:'emailsSent', meetings:'meetingsBooked', demos:'meetingsConducted', deals:'opportunitiesGenerated' };
        const field = METRIC_MAP[metric] || metric;
        const cat = (this.currentRole==='am') ? (this.currentAMCategory||'all') : 'all';
        const rows = this.data.activities.filter(a=>{
            const d=new Date(a.date||a.createdAt);
            if (d < startDate || d > endDate) return false;
            if (this.currentRole==='am' && cat!=='all') { if ((a.category||'') !== cat) return false; }
            return true;
        });
        return rows.reduce((s,a)=> s + (Number(a[field])||0), 0);
    }
    
    updateRecentActivities() {
        const container = document.getElementById('recentActivities');
        const recent = [...this.data.activities]
            .sort((a,b)=> (new Date(b.date||b.createdAt)) - (new Date(a.date||a.createdAt)))
            .slice(0,10);
        if (!recent.length){ container.innerHTML = '<p class="text-gray-500 text-center">No recent activities</p>'; return; }
        container.innerHTML = recent.map(r=>{
            const when = new Date(r.date||r.createdAt);
            const line = [
              r.accountsTargeted?`${r.accountsTargeted} accts`:'' ,
              r.callsMade?`${r.callsMade} calls`:'' ,
              r.emailsSent?`${r.emailsSent} emails`:'' ,
              r.meetingsBooked?`${r.meetingsBooked} mtgs`:''
            ].filter(Boolean).join(', ');
            return `<div class="flex justify-between items-center border-b py-2">
              <div>
                <div class="font-medium">${when.toLocaleDateString()} ${when.toLocaleTimeString()}</div>
                <div class="text-sm text-gray-600">${line || '-'}</div>
              </div>
              <div class="text-xs text-gray-500">${r.category||'-'}</div>
            </div>`;
        }).join('');
    }
    
    startAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => { this.loadActivities().then(()=> this.updateDashboard()); }, 30000);
    }

    flashSyncStatus(){
        const el = document.getElementById('syncStatus');
        if (!el) return; const dot = el.querySelector('span');
        if (dot) { const prev = dot.style.backgroundColor; dot.style.backgroundColor='#F59E0B'; setTimeout(()=>{ dot.style.backgroundColor=prev||''; }, 1000); }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SalesDashboard();
});