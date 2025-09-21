// API Integration Layer for Sales Prospecting Activity Tracker

const API = {
    // Base configuration
    baseURL: '', // Using relative URLs for local API
    
    // Generic fetch wrapper
    async fetchAPI(endpoint, options = {}) {
        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            // Check for errors
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            // Handle no content responses
            if (response.status === 204) {
                return null;
            }
            
            // Handle empty responses
            const text = await response.text();
            if (!text) {
                return { data: [], total: 0 };
            }
            
            try {
                return JSON.parse(text);
            } catch (e) {
                console.warn('Response is not JSON:', text);
                return { data: [], total: 0 };
            }
        } catch (error) {
            console.error('API request failed:', error.message);
            
            // If timeout error, provide more specific message
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection and try again.');
            }
            
            throw error;
        }
    },

    // Session helper and audit logger for RBAC-enforced operations
    getSession() { try { return JSON.parse(localStorage.getItem('ascm_session')||'null'); } catch { return null; } },
    async audit(action, details){
        try {
            return await this.fetchAPI('tables/audit_logs', {
                method: 'POST',
                body: JSON.stringify({
                    action,
                    details,
                    target_table: 'goals',
                    target_id: '*',
                    actor_id: (this.getSession()?.id||''),
                    actor_email: (this.getSession()?.email||''),
                    timestamp: Date.now()
                })
            });
        } catch(e){ /* no-op */ }
    },

    // User endpoints
    async getUsers(filters = {}) {
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.team) params.append('team', filters.team);
        if (filters.status) params.append('status', filters.status);
        
        const queryString = params.toString();
        const endpoint = queryString ? `tables/users?${queryString}` : 'tables/users';
        
        return this.fetchAPI(endpoint);
    },
    
    async getUser(userId) {
        return this.fetchAPI(`tables/users/${userId}`);
    },
    
    async createUser(userData) {
        return this.fetchAPI('tables/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async updateUser(userId, userData) {
        return this.fetchAPI(`tables/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },
    
    async deleteUser(userId) {
        return this.fetchAPI(`tables/users/${userId}`, {
            method: 'DELETE'
        });
    },
    
    // Activity endpoints
    async getActivities(filters = {}) {
        const params = new URLSearchParams();
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.type) params.append('type', filters.type);
        if (filters.week) params.append('week', filters.week);
        if (filters.month) params.append('month', filters.month);
        
        const queryString = params.toString();
        const endpoint = queryString ? `tables/activities?${queryString}` : 'tables/activities';
        
        return this.fetchAPI(endpoint);
    },
    
    async getActivity(activityId) {
        return this.fetchAPI(`tables/activities/${activityId}`);
    },
    
    async createActivity(activityData) {
        return this.fetchAPI('tables/activities', {
            method: 'POST',
            body: JSON.stringify(activityData)
        });
    },
    
    async updateActivity(activityId, activityData) {
        return this.fetchAPI(`tables/activities/${activityId}`, {
            method: 'PUT',
            body: JSON.stringify(activityData)
        });
    },
    
    async deleteActivity(activityId) {
        return this.fetchAPI(`tables/activities/${activityId}`, {
            method: 'DELETE'
        });
    },
    
    // Goal endpoints
    async getGoals(filters = {}) {
        const params = new URLSearchParams();
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.type) params.append('type', filters.type);
        if (filters.role) params.append('role', filters.role);
        if (filters.period) params.append('period', filters.period);
        
        const queryString = params.toString();
        const endpoint = queryString ? `tables/goals?${queryString}` : 'tables/goals';
        
        return this.fetchAPI(endpoint);
    },
    
    async getGoal(goalId) {
        return this.fetchAPI(`tables/goals/${goalId}`);
    },
    
    async createGoal(goalData) {
        const sess = this.getSession();
        const isAdmin = (String(sess?.role||'').toLowerCase()==='admin');
        if (!isAdmin){ await this.audit('goals_write_denied', { op:'create', data: goalData }); throw new Error('Not authorized: only Administrators can modify goals'); }
        console.warn('[RBAC] Direct goals writes via API.createGoal are deprecated; prefer GoalsAPI.saveRoleGoals for resilience and queueing.');
        await this.audit('goals_write_attempt', { op:'create', data: goalData });
        try {
            const res = await this.fetchAPI('tables/goals', { method: 'POST', body: JSON.stringify(goalData) });
            try { await this.audit('goals_write_success', { op:'create', id: res?.id||'', data: goalData }); } catch {}
            return res;
        } catch(err){
            try { await this.audit('goals_write_error', { op:'create', error: String(err?.message||err) }); } catch {}
            throw err;
        }
    },
    
    async updateGoal(goalId, goalData) {
        const sess = this.getSession();
        const isAdmin = (String(sess?.role||'').toLowerCase()==='admin');
        if (!isAdmin){ await this.audit('goals_write_denied', { op:'update', id: goalId, data: goalData }); throw new Error('Not authorized: only Administrators can modify goals'); }
        console.warn('[RBAC] Direct goals writes via API.updateGoal are deprecated; prefer GoalsAPI.saveRoleGoals for resilience and queueing.');
        await this.audit('goals_write_attempt', { op:'update', id: goalId, data: goalData });
        try {
            const res = await this.fetchAPI(`tables/goals/${goalId}`, { method: 'PUT', body: JSON.stringify(goalData) });
            try { await this.audit('goals_write_success', { op:'update', id: goalId }); } catch {}
            return res;
        } catch(err){
            try { await this.audit('goals_write_error', { op:'update', id: goalId, error: String(err?.message||err) }); } catch {}
            throw err;
        }
    },
    
    async deleteGoal(goalId) {
        const sess = this.getSession();
        const isAdmin = (String(sess?.role||'').toLowerCase()==='admin');
        if (!isAdmin){ await this.audit('goals_write_denied', { op:'delete', id: goalId }); throw new Error('Not authorized: only Administrators can modify goals'); }
        console.warn('[RBAC] Direct goals deletes via API.deleteGoal are deprecated; prefer admin tools with audit logging.');
        await this.audit('goals_write_attempt', { op:'delete', id: goalId });
        try {
            const res = await this.fetchAPI(`tables/goals/${goalId}`, { method: 'DELETE' });
            try { await this.audit('goals_write_success', { op:'delete', id: goalId }); } catch {}
            return res;
        } catch(err){
            try { await this.audit('goals_write_error', { op:'delete', id: goalId, error: String(err?.message||err) }); } catch {}
            throw err;
        }
    }
};

// Export for global access
window.API = API;