// Local Storage API - Complete replacement for external API
// Works entirely with localStorage - NO external dependencies

const LocalStorageAPI = {
    // Initialize with default data
    init() {
        console.log('Initializing Local Storage API...');
        
        // Initialize storage structure if not exists
        if (!localStorage.getItem('ls_users')) {
            this.initializeDefaultUsers();
        }
        if (!localStorage.getItem('ls_activities')) {
            localStorage.setItem('ls_activities', JSON.stringify([]));
        }
        if (!localStorage.getItem('ls_goals')) {
            this.initializeDefaultGoals();
        }
        
        console.log('Local Storage API initialized');
    },
    
    // Initialize default users
    initializeDefaultUsers() {
        const defaultUsers = [
            {
                id: 'admin-001',
                firstName: 'Admin',
                lastName: 'User',
                name: 'Admin User',
                email: 'admin@example.com',
                username: 'admin',
                password: 'admin123',
                phone: '555-0100',
                role: 'admin',
                platformRole: 'admin',
                team: 'Management',
                status: 'active',
                createdBy: 'system',
                lastLogin: null
            },
            {
                id: 'ae-001',
                firstName: 'Sarah',
                lastName: 'Johnson',
                name: 'Sarah Johnson',
                email: 'ae@example.com',
                username: 'sjohnson',
                password: 'admin123',
                phone: '555-0101',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team A',
                status: 'active',
                createdBy: 'system',
                lastLogin: null
            },
            {
                id: 'am-001',
                firstName: 'Michael',
                lastName: 'Chen',
                name: 'Michael Chen',
                email: 'am@example.com',
                username: 'mchen',
                password: 'admin123',
                phone: '555-0102',
                role: 'am',
                platformRole: 'user',
                team: 'Sales Team B',
                status: 'active',
                createdBy: 'system',
                lastLogin: null
            },
            {
                id: 'bmiller-001',
                firstName: 'Bryan',
                lastName: 'Miller',
                name: 'Bryan Miller',
                email: 'bmiller@ascm.org',
                username: 'bmiller',
                password: 'admin123',
                phone: '555-0109',
                role: 'admin',
                platformRole: 'admin',
                team: 'ASCM Leadership',
                status: 'active',
                createdBy: 'system',
                lastLogin: null
            },
            {
                id: 'ae-002',
                firstName: 'John',
                lastName: 'Smith',
                name: 'John Smith',
                email: 'john.smith@example.com',
                username: 'jsmith',
                password: 'password123',
                phone: '555-0103',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team A',
                status: 'active',
                createdBy: 'admin-001',
                lastLogin: null
            },
            {
                id: 'ae-003',
                firstName: 'Emily',
                lastName: 'Davis',
                name: 'Emily Davis',
                email: 'emily.davis@example.com',
                username: 'edavis',
                password: 'password123',
                phone: '555-0104',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team B',
                status: 'active',
                createdBy: 'admin-001',
                lastLogin: null
            }
        ];
        
        localStorage.setItem('ls_users', JSON.stringify(defaultUsers));
        console.log('Default users created:', defaultUsers.length);
    },
    
    // Initialize default goals
    initializeDefaultGoals() {
        const defaultGoals = [
            { id: 'goal-ae-1', role: 'ae', metric: 'calls_made', target: 150, period: 'weekly', type: 'role' },
            { id: 'goal-ae-2', role: 'ae', metric: 'emails_sent', target: 300, period: 'weekly', type: 'role' },
            { id: 'goal-ae-3', role: 'ae', metric: 'meetings_booked', target: 15, period: 'weekly', type: 'role' },
            { id: 'goal-am-1', role: 'am', metric: 'calls_made', target: 100, period: 'weekly', type: 'role' },
            { id: 'goal-am-2', role: 'am', metric: 'emails_sent', target: 200, period: 'weekly', type: 'role' },
            { id: 'goal-am-3', role: 'am', metric: 'meetings_booked', target: 10, period: 'weekly', type: 'role' }
        ];
        
        localStorage.setItem('ls_goals', JSON.stringify(defaultGoals));
        console.log('Default goals created:', defaultGoals.length);
    },
    
    // Generic method to simulate async API behavior
    async delay(ms = 10) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // User methods
    async getUsers(filters = {}) {
        await this.delay();
        
        let users = JSON.parse(localStorage.getItem('ls_users') || '[]');
        
        // Apply filters
        if (filters.role) {
            users = users.filter(u => u.role === filters.role);
        }
        if (filters.team) {
            users = users.filter(u => u.team === filters.team);
        }
        if (filters.status) {
            users = users.filter(u => u.status === filters.status);
        }
        
        return { data: users, total: users.length };
    },
    
    async getUser(userId) {
        await this.delay();
        
        const users = JSON.parse(localStorage.getItem('ls_users') || '[]');
        const user = users.find(u => u.id === userId);
        
        return { data: user };
    },
    
    async createUser(userData) {
        await this.delay();
        
        const users = JSON.parse(localStorage.getItem('ls_users') || '[]');
        
        // Generate ID if not provided
        if (!userData.id) {
            userData.id = `user-${Date.now()}`;
        }
        
        users.push(userData);
        localStorage.setItem('ls_users', JSON.stringify(users));
        
        return userData;
    },
    
    async updateUser(userId, userData) {
        await this.delay();
        
        const users = JSON.parse(localStorage.getItem('ls_users') || '[]');
        const index = users.findIndex(u => u.id === userId);
        
        if (index >= 0) {
            users[index] = { ...users[index], ...userData };
            localStorage.setItem('ls_users', JSON.stringify(users));
            return users[index];
        }
        
        throw new Error('User not found');
    },
    
    async deleteUser(userId) {
        await this.delay();
        
        const users = JSON.parse(localStorage.getItem('ls_users') || '[]');
        const filtered = users.filter(u => u.id !== userId);
        
        localStorage.setItem('ls_users', JSON.stringify(filtered));
        return null;
    },
    
    // Activity methods
    async getActivities(filters = {}) {
        await this.delay();
        
        let activities = JSON.parse(localStorage.getItem('ls_activities') || '[]');
        
        // Apply filters
        if (filters.userId) {
            activities = activities.filter(a => a.userId === filters.userId);
        }
        if (filters.type) {
            activities = activities.filter(a => a.type === filters.type);
        }
        if (filters.week) {
            activities = activities.filter(a => a.week === filters.week);
        }
        
        return { data: activities, total: activities.length };
    },
    
    async getActivity(activityId) {
        await this.delay();
        
        const activities = JSON.parse(localStorage.getItem('ls_activities') || '[]');
        const activity = activities.find(a => a.id === activityId);
        
        return { data: activity };
    },
    
    async createActivity(activityData) {
        await this.delay();
        
        const activities = JSON.parse(localStorage.getItem('ls_activities') || '[]');
        
        // Generate ID if not provided
        if (!activityData.id) {
            activityData.id = `activity-${Date.now()}`;
        }
        
        activities.push(activityData);
        localStorage.setItem('ls_activities', JSON.stringify(activities));
        
        return activityData;
    },
    
    async updateActivity(activityId, activityData) {
        await this.delay();
        
        const activities = JSON.parse(localStorage.getItem('ls_activities') || '[]');
        const index = activities.findIndex(a => a.id === activityId);
        
        if (index >= 0) {
            activities[index] = { ...activities[index], ...activityData };
            localStorage.setItem('ls_activities', JSON.stringify(activities));
            return activities[index];
        }
        
        throw new Error('Activity not found');
    },
    
    async deleteActivity(activityId) {
        await this.delay();
        
        const activities = JSON.parse(localStorage.getItem('ls_activities') || '[]');
        const filtered = activities.filter(a => a.id !== activityId);
        
        localStorage.setItem('ls_activities', JSON.stringify(filtered));
        return null;
    },
    
    // Goal methods
    async getGoals(filters = {}) {
        await this.delay();
        
        let goals = JSON.parse(localStorage.getItem('ls_goals') || '[]');
        
        // Apply filters
        if (filters.userId) {
            goals = goals.filter(g => g.userId === filters.userId);
        }
        if (filters.role) {
            goals = goals.filter(g => g.role === filters.role);
        }
        if (filters.type) {
            goals = goals.filter(g => g.type === filters.type);
        }
        
        return { data: goals, total: goals.length };
    },
    
    async getGoal(goalId) {
        await this.delay();
        
        const goals = JSON.parse(localStorage.getItem('ls_goals') || '[]');
        const goal = goals.find(g => g.id === goalId);
        
        return { data: goal };
    },
    
    async createGoal(goalData) {
        await this.delay();
        
        const goals = JSON.parse(localStorage.getItem('ls_goals') || '[]');
        
        // Generate ID if not provided
        if (!goalData.id) {
            goalData.id = `goal-${Date.now()}`;
        }
        
        goals.push(goalData);
        localStorage.setItem('ls_goals', JSON.stringify(goals));
        
        return goalData;
    },
    
    async updateGoal(goalId, goalData) {
        await this.delay();
        
        const goals = JSON.parse(localStorage.getItem('ls_goals') || '[]');
        const index = goals.findIndex(g => g.id === goalId);
        
        if (index >= 0) {
            goals[index] = { ...goals[index], ...goalData };
            localStorage.setItem('ls_goals', JSON.stringify(goals));
            return goals[index];
        }
        
        throw new Error('Goal not found');
    },
    
    async deleteGoal(goalId) {
        await this.delay();
        
        const goals = JSON.parse(localStorage.getItem('ls_goals') || '[]');
        const filtered = goals.filter(g => g.id !== goalId);
        
        localStorage.setItem('ls_goals', JSON.stringify(filtered));
        return null;
    }
};

// Initialize on load
LocalStorageAPI.init();

// Replace the global API with LocalStorageAPI
window.API = LocalStorageAPI;

console.log('Local Storage API loaded and replaced global API');