// Bulletproof Local Storage API - Complete replacement for external API
// 100% self-contained with NO external dependencies
// This is the DEFINITIVE solution for all API operations

const BulletproofLocalAPI = {
    // API configuration
    debugMode: true,
    delayMs: 50, // Small delay to simulate async
    
    // Initialize the entire API and data store
    init() {
        console.log('=== Bulletproof Local API Initialization ===');
        
        // Initialize storage structure
        this.initializeStorage();
        
        // Restore default data if needed
        this.checkAndRestoreData();
        
        console.log('=== Local API Ready - No External Dependencies ===');
        return true;
    },
    
    // Initialize storage structure
    initializeStorage() {
        // Create storage keys if they don't exist
        const storageKeys = ['bp_users', 'bp_activities', 'bp_goals', 'bp_settings'];
        
        storageKeys.forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
                this.log(`Initialized storage: ${key}`);
            }
        });
        
        // Initialize settings
        if (localStorage.getItem('bp_settings') === '[]') {
            const settings = {
                initialized: true,
                lastReset: Date.now(),
                version: '2.0'
            };
            localStorage.setItem('bp_settings', JSON.stringify(settings));
        }
    },
    
    // Check and restore default data
    checkAndRestoreData() {
        const users = JSON.parse(localStorage.getItem('bp_users') || '[]');
        
        if (users.length === 0) {
            console.log('No users found - restoring default data...');
            this.restoreDefaultUsers();
            this.restoreDefaultGoals();
            this.generateSampleActivities();
        } else {
            console.log(`Found ${users.length} existing users`);
            
            // Ensure Bryan Miller exists
            const bryanExists = users.some(u => u.email === 'bmiller@ascm.org');
            if (!bryanExists) {
                console.log('Restoring Bryan Miller...');
                this.restoreBryanMiller();
            }
        }
    },
    
    // Restore default users including Bryan Miller
    restoreDefaultUsers() {
        const defaultUsers = [
            // Bryan Miller - Priority User
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
                createdAt: Date.now(),
                lastLogin: Date.now() - 86400000,
                department: 'Executive',
                manager: null,
                targets: {
                    calls: 100,
                    emails: 200,
                    meetings: 15
                }
            },
            // Admin User
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
                createdAt: Date.now(),
                lastLogin: Date.now() - 3600000,
                department: 'Management',
                manager: 'bmiller-001'
            },
            // Account Executives
            {
                id: 'ae-001',
                firstName: 'Sarah',
                lastName: 'Johnson',
                name: 'Sarah Johnson',
                email: 'sjohnson@example.com',
                username: 'sjohnson',
                password: 'password123',
                phone: '555-0101',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team A',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 30 * 86400000,
                lastLogin: Date.now() - 7200000,
                department: 'Sales',
                manager: 'admin-001'
            },
            {
                id: 'ae-002',
                firstName: 'John',
                lastName: 'Smith',
                name: 'John Smith',
                email: 'jsmith@example.com',
                username: 'jsmith',
                password: 'password123',
                phone: '555-0103',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team A',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 60 * 86400000,
                lastLogin: Date.now() - 14400000,
                department: 'Sales',
                manager: 'admin-001'
            },
            {
                id: 'ae-003',
                firstName: 'Emily',
                lastName: 'Davis',
                name: 'Emily Davis',
                email: 'edavis@example.com',
                username: 'edavis',
                password: 'password123',
                phone: '555-0104',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team B',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 45 * 86400000,
                lastLogin: Date.now() - 28800000,
                department: 'Sales',
                manager: 'admin-001'
            },
            // Account Managers
            {
                id: 'am-001',
                firstName: 'Michael',
                lastName: 'Chen',
                name: 'Michael Chen',
                email: 'mchen@example.com',
                username: 'mchen',
                password: 'password123',
                phone: '555-0102',
                role: 'am',
                platformRole: 'user',
                team: 'Account Management',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 90 * 86400000,
                lastLogin: Date.now() - 43200000,
                department: 'Account Management',
                manager: 'admin-001'
            },
            {
                id: 'am-002',
                firstName: 'Lisa',
                lastName: 'Anderson',
                name: 'Lisa Anderson',
                email: 'landerson@example.com',
                username: 'landerson',
                password: 'password123',
                phone: '555-0105',
                role: 'am',
                platformRole: 'user',
                team: 'Account Management',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 75 * 86400000,
                lastLogin: Date.now() - 86400000,
                department: 'Account Management',
                manager: 'admin-001'
            },
            // Additional test users
            {
                id: 'ae-004',
                firstName: 'Robert',
                lastName: 'Williams',
                name: 'Robert Williams',
                email: 'rwilliams@example.com',
                username: 'rwilliams',
                password: 'password123',
                phone: '555-0106',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team A',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 120 * 86400000,
                lastLogin: null,
                department: 'Sales',
                manager: 'admin-001'
            },
            {
                id: 'ae-005',
                firstName: 'Jennifer',
                lastName: 'Brown',
                name: 'Jennifer Brown',
                email: 'jbrown@example.com',
                username: 'jbrown',
                password: 'password123',
                phone: '555-0107',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team B',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 150 * 86400000,
                lastLogin: Date.now() - 172800000,
                department: 'Sales',
                manager: 'admin-001'
            },
            {
                id: 'am-003',
                firstName: 'David',
                lastName: 'Martinez',
                name: 'David Martinez',
                email: 'dmartinez@example.com',
                username: 'dmartinez',
                password: 'password123',
                phone: '555-0108',
                role: 'am',
                platformRole: 'user',
                team: 'Account Management',
                status: 'active',
                createdBy: 'admin-001',
                createdAt: Date.now() - 100 * 86400000,
                lastLogin: Date.now() - 259200000,
                department: 'Account Management',
                manager: 'admin-001'
            }
        ];
        
        localStorage.setItem('bp_users', JSON.stringify(defaultUsers));
        console.log(`Restored ${defaultUsers.length} default users including Bryan Miller`);
        return defaultUsers;
    },
    
    // Restore just Bryan Miller if missing
    restoreBryanMiller() {
        const users = JSON.parse(localStorage.getItem('bp_users') || '[]');
        
        const bryan = {
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
            createdAt: Date.now(),
            lastLogin: Date.now() - 86400000,
            department: 'Executive',
            manager: null,
            targets: {
                calls: 100,
                emails: 200,
                meetings: 15
            }
        };
        
        users.unshift(bryan); // Add at the beginning
        localStorage.setItem('bp_users', JSON.stringify(users));
        console.log('Bryan Miller restored successfully');
        return bryan;
    },
    
    // Restore default goals
    restoreDefaultGoals() {
        const defaultGoals = [
            // Role-based goals
            { id: 'goal-ae-calls', role: 'ae', metric: 'calls_made', target: 150, period: 'weekly', type: 'role', name: 'AE Weekly Calls Goal' },
            { id: 'goal-ae-emails', role: 'ae', metric: 'emails_sent', target: 300, period: 'weekly', type: 'role', name: 'AE Weekly Emails Goal' },
            { id: 'goal-ae-meetings', role: 'ae', metric: 'meetings_booked', target: 15, period: 'weekly', type: 'role', name: 'AE Weekly Meetings Goal' },
            { id: 'goal-am-calls', role: 'am', metric: 'calls_made', target: 100, period: 'weekly', type: 'role', name: 'AM Weekly Calls Goal' },
            { id: 'goal-am-emails', role: 'am', metric: 'emails_sent', target: 200, period: 'weekly', type: 'role', name: 'AM Weekly Emails Goal' },
            { id: 'goal-am-meetings', role: 'am', metric: 'meetings_booked', target: 10, period: 'weekly', type: 'role', name: 'AM Weekly Meetings Goal' },
            
            // Individual goals for specific users
            { id: 'goal-sarah-calls', userId: 'ae-001', metric: 'calls_made', target: 175, period: 'weekly', type: 'individual', name: 'Sarah\'s Stretch Calls Goal' },
            { id: 'goal-michael-meetings', userId: 'am-001', metric: 'meetings_booked', target: 12, period: 'weekly', type: 'individual', name: 'Michael\'s Meetings Goal' }
        ];
        
        localStorage.setItem('bp_goals', JSON.stringify(defaultGoals));
        console.log(`Restored ${defaultGoals.length} default goals`);
        return defaultGoals;
    },
    
    // Generate sample activities
    generateSampleActivities() {
        const activities = [];
        const users = JSON.parse(localStorage.getItem('bp_users') || '[]');
        const salesUsers = users.filter(u => u.role === 'ae' || u.role === 'am');
        
        // Generate activities for the last 4 weeks
        const weeksToGenerate = 4;
        const today = new Date();
        
        salesUsers.forEach(user => {
            for (let week = 0; week < weeksToGenerate; week++) {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - (week * 7));
                const weekNumber = this.getWeekNumber(weekStart);
                
                // Generate varied activity counts
                const callsBase = user.role === 'ae' ? 30 : 20;
                const emailsBase = user.role === 'ae' ? 60 : 40;
                const meetingsBase = user.role === 'ae' ? 3 : 2;
                
                // Add some randomness
                const calls = callsBase + Math.floor(Math.random() * 10) - 5;
                const emails = emailsBase + Math.floor(Math.random() * 20) - 10;
                const meetings = meetingsBase + Math.floor(Math.random() * 3);
                
                // Create activity record
                const activity = {
                    id: `activity-${user.id}-week${weekNumber}`,
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    userTeam: user.team,
                    week: weekNumber,
                    month: weekStart.getMonth() + 1,
                    year: weekStart.getFullYear(),
                    calls_made: Math.max(0, calls),
                    emails_sent: Math.max(0, emails),
                    meetings_booked: Math.max(0, meetings),
                    linkedin_connections: Math.floor(Math.random() * 15) + 5,
                    proposals_sent: Math.floor(Math.random() * 5),
                    deals_closed: week === 0 ? Math.floor(Math.random() * 3) : 0,
                    revenue_generated: week === 0 ? Math.floor(Math.random() * 50000) : 0,
                    notes: `Week ${weekNumber} activities`,
                    createdAt: weekStart.getTime(),
                    updatedAt: Date.now()
                };
                
                activities.push(activity);
            }
        });
        
        localStorage.setItem('bp_activities', JSON.stringify(activities));
        console.log(`Generated ${activities.length} sample activities`);
        return activities;
    },
    
    // Utility: Get week number
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    // Utility: Simulate async delay
    async delay(ms = null) {
        const delayTime = ms || this.delayMs;
        return new Promise(resolve => setTimeout(resolve, delayTime));
    },
    
    // Utility: Debug logging
    log(message, data = null) {
        if (this.debugMode) {
            if (data) {
                console.log(`[LocalAPI] ${message}`, data);
            } else {
                console.log(`[LocalAPI] ${message}`);
            }
        }
    },
    
    // ======================
    // USER API METHODS
    // ======================
    
    async getUsers(filters = {}) {
        await this.delay();
        
        try {
            let users = JSON.parse(localStorage.getItem('bp_users') || '[]');
            
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
            if (filters.platformRole) {
                users = users.filter(u => u.platformRole === filters.platformRole);
            }
            
            this.log(`getUsers: Returning ${users.length} users`, filters);
            
            return {
                data: users,
                total: users.length,
                success: true
            };
        } catch (error) {
            console.error('getUsers error:', error);
            return { data: [], total: 0, success: false, error: error.message };
        }
    },
    
    async getUser(userId) {
        await this.delay();
        
        try {
            const users = JSON.parse(localStorage.getItem('bp_users') || '[]');
            const user = users.find(u => u.id === userId);
            
            if (user) {
                this.log(`getUser: Found user ${userId}`, user);
                return { data: user, success: true };
            } else {
                this.log(`getUser: User ${userId} not found`);
                return { data: null, success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('getUser error:', error);
            return { data: null, success: false, error: error.message };
        }
    },
    
    async createUser(userData) {
        await this.delay();
        
        try {
            const users = JSON.parse(localStorage.getItem('bp_users') || '[]');
            
            // Check for duplicate email
            if (users.some(u => u.email === userData.email)) {
                throw new Error('User with this email already exists');
            }
            
            // Generate ID if not provided
            if (!userData.id) {
                userData.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Add timestamps
            userData.createdAt = Date.now();
            userData.updatedAt = Date.now();
            
            // Ensure required fields
            userData.status = userData.status || 'active';
            userData.platformRole = userData.platformRole || 'user';
            
            users.push(userData);
            localStorage.setItem('bp_users', JSON.stringify(users));
            
            this.log('createUser: User created', userData);
            return userData;
        } catch (error) {
            console.error('createUser error:', error);
            throw error;
        }
    },
    
    async updateUser(userId, userData) {
        await this.delay();
        
        try {
            const users = JSON.parse(localStorage.getItem('bp_users') || '[]');
            const index = users.findIndex(u => u.id === userId);
            
            if (index === -1) {
                throw new Error('User not found');
            }
            
            // Merge data
            users[index] = {
                ...users[index],
                ...userData,
                id: userId, // Preserve ID
                updatedAt: Date.now()
            };
            
            localStorage.setItem('bp_users', JSON.stringify(users));
            
            this.log('updateUser: User updated', users[index]);
            return users[index];
        } catch (error) {
            console.error('updateUser error:', error);
            throw error;
        }
    },
    
    async deleteUser(userId) {
        await this.delay();
        
        try {
            const users = JSON.parse(localStorage.getItem('bp_users') || '[]');
            const filtered = users.filter(u => u.id !== userId);
            
            if (filtered.length === users.length) {
                throw new Error('User not found');
            }
            
            localStorage.setItem('bp_users', JSON.stringify(filtered));
            
            this.log(`deleteUser: User ${userId} deleted`);
            return null;
        } catch (error) {
            console.error('deleteUser error:', error);
            throw error;
        }
    },
    
    // ======================
    // ACTIVITY API METHODS
    // ======================
    
    async getActivities(filters = {}) {
        await this.delay();
        
        try {
            let activities = JSON.parse(localStorage.getItem('bp_activities') || '[]');
            
            // Apply filters
            if (filters.userId) {
                activities = activities.filter(a => a.userId === filters.userId);
            }
            if (filters.week) {
                activities = activities.filter(a => a.week === parseInt(filters.week));
            }
            if (filters.month) {
                activities = activities.filter(a => a.month === parseInt(filters.month));
            }
            if (filters.year) {
                activities = activities.filter(a => a.year === parseInt(filters.year));
            }
            
            this.log(`getActivities: Returning ${activities.length} activities`, filters);
            
            return {
                data: activities,
                total: activities.length,
                success: true
            };
        } catch (error) {
            console.error('getActivities error:', error);
            return { data: [], total: 0, success: false, error: error.message };
        }
    },
    
    async getActivity(activityId) {
        await this.delay();
        
        try {
            const activities = JSON.parse(localStorage.getItem('bp_activities') || '[]');
            const activity = activities.find(a => a.id === activityId);
            
            if (activity) {
                this.log(`getActivity: Found activity ${activityId}`);
                return { data: activity, success: true };
            } else {
                return { data: null, success: false, error: 'Activity not found' };
            }
        } catch (error) {
            console.error('getActivity error:', error);
            return { data: null, success: false, error: error.message };
        }
    },
    
    async createActivity(activityData) {
        await this.delay();
        
        try {
            const activities = JSON.parse(localStorage.getItem('bp_activities') || '[]');
            
            // Generate ID if not provided
            if (!activityData.id) {
                activityData.id = `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Add timestamps
            activityData.createdAt = Date.now();
            activityData.updatedAt = Date.now();
            
            activities.push(activityData);
            localStorage.setItem('bp_activities', JSON.stringify(activities));
            
            this.log('createActivity: Activity created', activityData);
            return activityData;
        } catch (error) {
            console.error('createActivity error:', error);
            throw error;
        }
    },
    
    async updateActivity(activityId, activityData) {
        await this.delay();
        
        try {
            const activities = JSON.parse(localStorage.getItem('bp_activities') || '[]');
            const index = activities.findIndex(a => a.id === activityId);
            
            if (index === -1) {
                throw new Error('Activity not found');
            }
            
            activities[index] = {
                ...activities[index],
                ...activityData,
                id: activityId,
                updatedAt: Date.now()
            };
            
            localStorage.setItem('bp_activities', JSON.stringify(activities));
            
            this.log('updateActivity: Activity updated', activities[index]);
            return activities[index];
        } catch (error) {
            console.error('updateActivity error:', error);
            throw error;
        }
    },
    
    async deleteActivity(activityId) {
        await this.delay();
        
        try {
            const activities = JSON.parse(localStorage.getItem('bp_activities') || '[]');
            const filtered = activities.filter(a => a.id !== activityId);
            
            if (filtered.length === activities.length) {
                throw new Error('Activity not found');
            }
            
            localStorage.setItem('bp_activities', JSON.stringify(filtered));
            
            this.log(`deleteActivity: Activity ${activityId} deleted`);
            return null;
        } catch (error) {
            console.error('deleteActivity error:', error);
            throw error;
        }
    },
    
    // ======================
    // GOAL API METHODS
    // ======================
    
    async getGoals(filters = {}) {
        await this.delay();
        
        try {
            let goals = JSON.parse(localStorage.getItem('bp_goals') || '[]');
            
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
            if (filters.period) {
                goals = goals.filter(g => g.period === filters.period);
            }
            
            this.log(`getGoals: Returning ${goals.length} goals`, filters);
            
            return {
                data: goals,
                total: goals.length,
                success: true
            };
        } catch (error) {
            console.error('getGoals error:', error);
            return { data: [], total: 0, success: false, error: error.message };
        }
    },
    
    async getGoal(goalId) {
        await this.delay();
        
        try {
            const goals = JSON.parse(localStorage.getItem('bp_goals') || '[]');
            const goal = goals.find(g => g.id === goalId);
            
            if (goal) {
                this.log(`getGoal: Found goal ${goalId}`);
                return { data: goal, success: true };
            } else {
                return { data: null, success: false, error: 'Goal not found' };
            }
        } catch (error) {
            console.error('getGoal error:', error);
            return { data: null, success: false, error: error.message };
        }
    },
    
    async createGoal(goalData) {
        await this.delay();
        
        try {
            const goals = JSON.parse(localStorage.getItem('bp_goals') || '[]');
            
            // Generate ID if not provided
            if (!goalData.id) {
                goalData.id = `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Add timestamps
            goalData.createdAt = Date.now();
            goalData.updatedAt = Date.now();
            
            goals.push(goalData);
            localStorage.setItem('bp_goals', JSON.stringify(goals));
            
            this.log('createGoal: Goal created', goalData);
            return goalData;
        } catch (error) {
            console.error('createGoal error:', error);
            throw error;
        }
    },
    
    async updateGoal(goalId, goalData) {
        await this.delay();
        
        try {
            const goals = JSON.parse(localStorage.getItem('bp_goals') || '[]');
            const index = goals.findIndex(g => g.id === goalId);
            
            if (index === -1) {
                throw new Error('Goal not found');
            }
            
            goals[index] = {
                ...goals[index],
                ...goalData,
                id: goalId,
                updatedAt: Date.now()
            };
            
            localStorage.setItem('bp_goals', JSON.stringify(goals));
            
            this.log('updateGoal: Goal updated', goals[index]);
            return goals[index];
        } catch (error) {
            console.error('updateGoal error:', error);
            throw error;
        }
    },
    
    async deleteGoal(goalId) {
        await this.delay();
        
        try {
            const goals = JSON.parse(localStorage.getItem('bp_goals') || '[]');
            const filtered = goals.filter(g => g.id !== goalId);
            
            if (filtered.length === goals.length) {
                throw new Error('Goal not found');
            }
            
            localStorage.setItem('bp_goals', JSON.stringify(filtered));
            
            this.log(`deleteGoal: Goal ${goalId} deleted`);
            return null;
        } catch (error) {
            console.error('deleteGoal error:', error);
            throw error;
        }
    },
    
    // ======================
    // UTILITY METHODS
    // ======================
    
    // Clear all data and restore defaults
    async resetAllData() {
        console.log('=== RESETTING ALL DATA ===');
        
        // Clear existing data
        localStorage.removeItem('bp_users');
        localStorage.removeItem('bp_activities');
        localStorage.removeItem('bp_goals');
        localStorage.removeItem('bp_settings');
        
        // Reinitialize
        this.init();
        
        console.log('=== DATA RESET COMPLETE ===');
        return { success: true, message: 'All data reset to defaults' };
    },
    
    // Export data for backup
    exportData() {
        const data = {
            users: JSON.parse(localStorage.getItem('bp_users') || '[]'),
            activities: JSON.parse(localStorage.getItem('bp_activities') || '[]'),
            goals: JSON.parse(localStorage.getItem('bp_goals') || '[]'),
            settings: JSON.parse(localStorage.getItem('bp_settings') || '{}'),
            exportDate: new Date().toISOString()
        };
        
        return data;
    },
    
    // Import data from backup
    importData(data) {
        try {
            if (data.users) {
                localStorage.setItem('bp_users', JSON.stringify(data.users));
            }
            if (data.activities) {
                localStorage.setItem('bp_activities', JSON.stringify(data.activities));
            }
            if (data.goals) {
                localStorage.setItem('bp_goals', JSON.stringify(data.goals));
            }
            if (data.settings) {
                localStorage.setItem('bp_settings', JSON.stringify(data.settings));
            }
            
            console.log('Data imported successfully');
            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            console.error('Import error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize immediately
BulletproofLocalAPI.init();

// Replace global API
window.API = BulletproofLocalAPI;

// Also make available as LocalAPI for compatibility
window.LocalAPI = BulletproofLocalAPI;

console.log('✅ Bulletproof Local API loaded and active');
console.log('✅ Bryan Miller and all default users available');
console.log('✅ No external dependencies - 100% self-contained');