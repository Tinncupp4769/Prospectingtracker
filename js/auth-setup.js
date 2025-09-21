// Authentication Setup - Initialize Default Users

async function setupDefaultUsers() {
    try {
        // Check if users already exist
        const existingUsers = await API.getUsers();
        
        // Look for admin user
        const adminExists = existingUsers.data && existingUsers.data.some(u => u.email === 'admin@example.com');
        
        if (!adminExists) {
            console.log('Creating default users...');
            
            // Create default admin user
            const adminUser = {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123', // In production, this should be hashed
                role: 'admin',
                platformRole: 'admin',
                team: 'Management',
                status: 'active',
                createdAt: Date.now()
            };
            
            await API.createUser(adminUser);
            console.log('Created admin user');
            
            // Create default AE user
            const aeUser = {
                name: 'Sarah Johnson',
                email: 'ae@example.com',
                password: 'admin123',
                role: 'ae',
                platformRole: 'user',
                team: 'Sales Team A',
                status: 'active',
                createdAt: Date.now()
            };
            
            await API.createUser(aeUser);
            console.log('Created AE user');
            
            // Create default AM user
            const amUser = {
                name: 'Michael Chen',
                email: 'am@example.com',
                password: 'admin123',
                role: 'am',
                platformRole: 'user',
                team: 'Sales Team B',
                status: 'active',
                createdAt: Date.now()
            };
            
            await API.createUser(amUser);
            console.log('Created AM user');
            
            // Create additional test users
            const testUsers = [
                {
                    name: 'Emily Davis',
                    email: 'emily.davis@example.com',
                    password: 'password123',
                    role: 'ae',
                    platformRole: 'user',
                    team: 'Sales Team A',
                    status: 'active'
                },
                {
                    name: 'James Wilson',
                    email: 'james.wilson@example.com',
                    password: 'password123',
                    role: 'ae',
                    platformRole: 'user',
                    team: 'Sales Team A',
                    status: 'active'
                },
                {
                    name: 'Lisa Anderson',
                    email: 'lisa.anderson@example.com',
                    password: 'password123',
                    role: 'am',
                    platformRole: 'user',
                    team: 'Sales Team B',
                    status: 'active'
                },
                {
                    name: 'Robert Taylor',
                    email: 'robert.taylor@example.com',
                    password: 'password123',
                    role: 'am',
                    platformRole: 'user',
                    team: 'Sales Team B',
                    status: 'active'
                },
                {
                    name: 'Jessica Martinez',
                    email: 'jessica.martinez@example.com',
                    password: 'password123',
                    role: 'ae',
                    platformRole: 'user',
                    team: 'Sales Team C',
                    status: 'inactive'
                }
            ];
            
            for (const user of testUsers) {
                user.createdAt = Date.now();
                await API.createUser(user);
                console.log(`Created user: ${user.name}`);
            }
            
            console.log('Default users created successfully');
            
            // Add some sample activities for the users
            await createSampleActivities();
            
            return true;
        } else {
            console.log('Default users already exist');
            return false;
        }
    } catch (error) {
        console.error('Error setting up default users:', error);
        return false;
    }
}

// Create sample activities for demo purposes
async function createSampleActivities() {
    try {
        const users = await API.getUsers();
        const aeUsers = users.data.filter(u => u.role === 'ae');
        const amUsers = users.data.filter(u => u.role === 'am');
        
        // Create activities for AE users
        for (const user of aeUsers) {
            const activity = {
                userId: user.id,
                userName: user.name,
                type: 'ae_summary',
                week: getCurrentWeek(),
                callsMade: Math.floor(Math.random() * 50) + 20,
                emailsSent: Math.floor(Math.random() * 100) + 50,
                linkedinMessages: Math.floor(Math.random() * 30) + 10,
                vidyardVideos: Math.floor(Math.random() * 20) + 5,
                meetingsBooked: Math.floor(Math.random() * 15) + 5,
                meetingsConducted: Math.floor(Math.random() * 10) + 2,
                opportunitiesGenerated: Math.floor(Math.random() * 5) + 1,
                referralsGenerated: Math.floor(Math.random() * 3),
                pipelineGenerated: Math.floor(Math.random() * 200000) + 50000,
                proposalsSent: Math.floor(Math.random() * 5) + 1
            };
            
            await API.createActivity(activity);
        }
        
        // Create activities for AM users
        for (const user of amUsers) {
            // Dormant category
            const dormantActivity = {
                userId: user.id,
                userName: user.name,
                type: 'am_dormant_summary',
                week: getCurrentWeek(),
                category: 'dormant',
                accountsTargeted: Math.floor(Math.random() * 20) + 10,
                callsMade: Math.floor(Math.random() * 30) + 15,
                emailsSent: Math.floor(Math.random() * 60) + 30,
                linkedinMessages: Math.floor(Math.random() * 20) + 5,
                vidyardVideos: Math.floor(Math.random() * 10) + 2,
                meetingsBooked: Math.floor(Math.random() * 8) + 2,
                meetingsConducted: Math.floor(Math.random() * 5) + 1,
                opportunitiesGenerated: Math.floor(Math.random() * 3) + 1,
                referralsGenerated: Math.floor(Math.random() * 2),
                pipelineGenerated: Math.floor(Math.random() * 100000) + 25000
            };
            
            await API.createActivity(dormantActivity);
            
            // Cross-sell category
            const crossSellActivity = {
                userId: user.id,
                userName: user.name,
                type: 'am_cross_sell_summary',
                week: getCurrentWeek(),
                category: 'cross-sell',
                accountsTargeted: Math.floor(Math.random() * 15) + 5,
                callsMade: Math.floor(Math.random() * 25) + 10,
                emailsSent: Math.floor(Math.random() * 50) + 20,
                linkedinMessages: Math.floor(Math.random() * 15) + 5,
                vidyardVideos: Math.floor(Math.random() * 8) + 2,
                meetingsBooked: Math.floor(Math.random() * 6) + 2,
                meetingsConducted: Math.floor(Math.random() * 4) + 1,
                opportunitiesGenerated: Math.floor(Math.random() * 2) + 1,
                referralsGenerated: Math.floor(Math.random() * 2),
                pipelineGenerated: Math.floor(Math.random() * 80000) + 20000
            };
            
            await API.createActivity(crossSellActivity);
        }
        
        console.log('Sample activities created');
        
    } catch (error) {
        console.error('Error creating sample activities:', error);
    }
}

// Helper function
function getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const days = Math.floor((now - firstDay) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + firstDay.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Initialize default users on first run
if (typeof API !== 'undefined') {
    setupDefaultUsers();
}