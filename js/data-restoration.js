// Data Restoration Module - Restores default users and essential data
// This ensures the app always has the necessary data to function

const DataRestoration = {
    // Default users that should always exist
    defaultUsers: [
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
        },
        {
            id: 'am-002',
            firstName: 'Robert',
            lastName: 'Wilson',
            name: 'Robert Wilson',
            email: 'robert.wilson@example.com',
            username: 'rwilson',
            password: 'password123',
            phone: '555-0105',
            role: 'am',
            platformRole: 'user',
            team: 'Sales Team A',
            status: 'active',
            createdBy: 'admin-001',
            lastLogin: null
        },
        {
            id: 'ae-004',
            firstName: 'Lisa',
            lastName: 'Anderson',
            name: 'Lisa Anderson',
            email: 'lisa.anderson@example.com',
            username: 'landerson',
            password: 'password123',
            phone: '555-0106',
            role: 'ae',
            platformRole: 'user',
            team: 'Sales Team C',
            status: 'active',
            createdBy: 'admin-001',
            lastLogin: null
        },
        {
            id: 'am-003',
            firstName: 'David',
            lastName: 'Martinez',
            name: 'David Martinez',
            email: 'david.martinez@example.com',
            username: 'dmartinez',
            password: 'password123',
            phone: '555-0107',
            role: 'am',
            platformRole: 'user',
            team: 'Sales Team C',
            status: 'active',
            createdBy: 'admin-001',
            lastLogin: null
        },
        {
            id: 'ae-005',
            firstName: 'Jennifer',
            lastName: 'Taylor',
            name: 'Jennifer Taylor',
            email: 'jennifer.taylor@example.com',
            username: 'jtaylor',
            password: 'password123',
            phone: '555-0108',
            role: 'ae',
            platformRole: 'admin',
            team: 'Sales Team A',
            status: 'active',
            createdBy: 'admin-001',
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
        }
    ],

    // Default goals for roles
    defaultGoals: [
        // AE Weekly Goals
        { id: 'goal-ae-1', role: 'ae', metric: 'calls_made', target: 150, period: 'weekly', type: 'role', category: null },
        { id: 'goal-ae-2', role: 'ae', metric: 'emails_sent', target: 300, period: 'weekly', type: 'role', category: null },
        { id: 'goal-ae-3', role: 'ae', metric: 'linkedin_messages', target: 75, period: 'weekly', type: 'role', category: null },
        { id: 'goal-ae-4', role: 'ae', metric: 'meetings_booked', target: 15, period: 'weekly', type: 'role', category: null },
        { id: 'goal-ae-5', role: 'ae', metric: 'pipeline_generated', target: 150000, period: 'weekly', type: 'role', category: null },
        
        // AM Weekly Goals
        { id: 'goal-am-1', role: 'am', metric: 'calls_made', target: 100, period: 'weekly', type: 'role', category: null },
        { id: 'goal-am-2', role: 'am', metric: 'emails_sent', target: 200, period: 'weekly', type: 'role', category: null },
        { id: 'goal-am-3', role: 'am', metric: 'linkedin_messages', target: 50, period: 'weekly', type: 'role', category: null },
        { id: 'goal-am-4', role: 'am', metric: 'meetings_booked', target: 10, period: 'weekly', type: 'role', category: null },
        { id: 'goal-am-5', role: 'am', metric: 'pipeline_generated', target: 200000, period: 'weekly', type: 'role', category: null }
    ],

    // Restore all default data
    async restoreAllData() {
        console.log('Starting data restoration...');
        
        const results = {
            users: false,
            goals: false,
            activities: false
        };
        
        // Try to restore users
        try {
            await this.restoreUsers();
            results.users = true;
        } catch (error) {
            console.warn('Failed to restore users:', error);
        }
        
        // Try to restore goals
        try {
            await this.restoreGoals();
            results.goals = true;
        } catch (error) {
            console.warn('Failed to restore goals:', error);
        }
        
        // Try to create sample activities (optional)
        try {
            await this.createSampleActivities();
            results.activities = true;
        } catch (error) {
            console.warn('Failed to create activities:', error);
        }
        
        console.log('Data restoration results:', results);
        
        // Success if at least users were restored
        return { success: results.users, results };
    },

    // Restore default users
    async restoreUsers() {
        console.log('Restoring users...');
        
        let existingUsers = [];
        
        // Try to get existing users
        try {
            const response = await API.getUsers();
            existingUsers = response.data || [];
        } catch (error) {
            console.warn('Could not fetch existing users:', error);
            // Continue anyway - will try to create all users
        }
        
        const existingEmails = existingUsers.map(u => u.email);
        let created = 0;
        let failed = 0;
        
        // Add missing users
        for (const user of this.defaultUsers) {
            if (!existingEmails.includes(user.email)) {
                try {
                    await API.createUser(user);
                    console.log(`Created user: ${user.name}`);
                    created++;
                } catch (error) {
                    console.warn(`Failed to create user ${user.name}:`, error.message);
                    failed++;
                }
            }
        }
        
        console.log(`Users restored: ${created} created, ${failed} failed, ${existingUsers.length} existing`);
        
        // Success if we have any users
        if (created > 0 || existingUsers.length > 0) {
            return true;
        }
        
        throw new Error('No users available');
    },

    // Restore default goals
    async restoreGoals() {
        console.log('Restoring goals...');
        
        try {
            // Get existing goals
            const response = await API.getGoals();
            const existingGoals = response.data || [];
            const existingIds = existingGoals.map(g => g.id);
            
            // Add missing goals
            for (const goal of this.defaultGoals) {
                if (!existingIds.includes(goal.id)) {
                    try {
                        await API.createGoal(goal);
                        console.log(`Created goal: ${goal.id}`);
                    } catch (error) {
                        console.warn(`Failed to create goal ${goal.id}:`, error.message);
                    }
                }
            }
            
            console.log('Goals restored successfully');
        } catch (error) {
            console.error('Failed to restore goals:', error);
            throw error;
        }
    },

    // Create sample activities
    async createSampleActivities() {
        console.log('Creating sample activities...');
        
        try {
            const currentWeek = this.getCurrentWeek();
            
            // Sample activities for AEs
            const aeActivities = [
                {
                    userId: 'ae-001',
                    userName: 'Sarah Johnson',
                    type: 'ae_summary',
                    week: currentWeek,
                    callsMade: 120,
                    emailsSent: 250,
                    linkedinMessages: 60,
                    meetingsBooked: 12,
                    opportunitiesGenerated: 3,
                    pipelineGenerated: 125000
                },
                {
                    userId: 'ae-002',
                    userName: 'John Smith',
                    type: 'ae_summary',
                    week: currentWeek,
                    callsMade: 145,
                    emailsSent: 290,
                    linkedinMessages: 70,
                    meetingsBooked: 14,
                    opportunitiesGenerated: 4,
                    pipelineGenerated: 175000
                }
            ];
            
            // Sample activities for AMs
            const amActivities = [
                {
                    userId: 'am-001',
                    userName: 'Michael Chen',
                    type: 'am_dormant_summary',
                    week: currentWeek,
                    category: 'dormant',
                    callsMade: 40,
                    emailsSent: 80,
                    linkedinMessages: 20,
                    meetingsBooked: 5,
                    opportunitiesGenerated: 2,
                    pipelineGenerated: 75000
                },
                {
                    userId: 'am-002',
                    userName: 'Robert Wilson',
                    type: 'am_cross-sell_summary',
                    week: currentWeek,
                    category: 'cross-sell',
                    callsMade: 35,
                    emailsSent: 70,
                    linkedinMessages: 15,
                    meetingsBooked: 4,
                    opportunitiesGenerated: 1,
                    pipelineGenerated: 50000
                }
            ];
            
            // Check if activities already exist for this week
            const existingActivities = await API.getActivities({ week: currentWeek });
            if (!existingActivities.data || existingActivities.data.length === 0) {
                // Add AE activities
                for (const activity of aeActivities) {
                    try {
                        await API.createActivity(activity);
                        console.log(`Created activity for ${activity.userName}`);
                    } catch (error) {
                        console.warn(`Failed to create activity:`, error.message);
                    }
                }
                
                // Add AM activities
                for (const activity of amActivities) {
                    try {
                        await API.createActivity(activity);
                        console.log(`Created activity for ${activity.userName}`);
                    } catch (error) {
                        console.warn(`Failed to create activity:`, error.message);
                    }
                }
            }
            
            console.log('Sample activities created successfully');
        } catch (error) {
            console.error('Failed to create sample activities:', error);
            // Don't throw - sample activities are optional
        }
    },

    // Get current week in format YYYY-Www
    getCurrentWeek() {
        const now = new Date();
        const year = now.getFullYear();
        const firstDay = new Date(year, 0, 1);
        const days = Math.floor((now - firstDay) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + firstDay.getDay() + 1) / 7);
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    }
};

// Export for global access
window.DataRestoration = DataRestoration;