// BRUTE FORCE DEBUG - Trace EVERYTHING that happens
console.log('🔍 BRUTE FORCE DEBUG STARTING...');

// Create debug panel
(function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 400px;
        max-height: 300px;
        background: black;
        color: lime;
        font-family: monospace;
        font-size: 11px;
        padding: 10px;
        border: 2px solid lime;
        z-index: 999999;
        overflow-y: auto;
        display: none;
    `;
    panel.innerHTML = '<div style="color: yellow; font-weight: bold;">DEBUG CONSOLE</div><div id="debug-log"></div>';
    document.body.appendChild(panel);
    
    // Toggle with Ctrl+D
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    });
})();

// Debug log function
window.DEBUG_LOG = [];
window.debugLog = function(message, data = null) {
    const time = new Date().toTimeString().split(' ')[0];
    const entry = `[${time}] ${message}`;
    window.DEBUG_LOG.push({ time, message, data });
    
    console.log(`🔍 ${entry}`, data || '');
    
    const logDiv = document.getElementById('debug-log');
    if (logDiv) {
        const line = document.createElement('div');
        line.style.borderBottom = '1px solid #333';
        line.style.marginBottom = '2px';
        line.innerHTML = `<span style="color: cyan;">${time}</span> ${message}`;
        logDiv.appendChild(line);
        logDiv.parentElement.scrollTop = logDiv.parentElement.scrollHeight;
    }
};

// INTERCEPT ALL CLICKS
document.addEventListener('click', function(e) {
    const target = e.target;
    const onclick = target.getAttribute('onclick');
    
    if (onclick) {
        debugLog(`CLICK: ${target.tagName} with onclick="${onclick}"`);
        
        // Special handling for our problem buttons
        if (onclick.includes('showUserView')) {
            debugLog('⚠️ showUserView button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            // Check if function exists
            if (typeof window.showUserView === 'function') {
                debugLog('✅ showUserView exists, calling it...');
                try {
                    const match = onclick.match(/showUserView\(['"](\w+)['"]\)/);
                    if (match) {
                        const view = match[1];
                        debugLog(`Calling showUserView('${view}')`);
                        window.showUserView(view);
                    }
                } catch (error) {
                    debugLog(`❌ ERROR calling showUserView: ${error.message}`);
                }
            } else {
                debugLog('❌ showUserView does NOT exist!');
                debugLog('Available functions:', Object.keys(window).filter(k => k.includes('User')).join(', '));
            }
        }
        
        if (onclick.includes('resetAllData')) {
            debugLog('⚠️ resetAllData button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof window.resetAllData === 'function') {
                debugLog('✅ resetAllData exists, calling it...');
                try {
                    window.resetAllData();
                } catch (error) {
                    debugLog(`❌ ERROR calling resetAllData: ${error.message}`);
                }
            } else {
                debugLog('❌ resetAllData does NOT exist!');
            }
        }
    }
}, true); // Use capture phase

// TRACE FUNCTION DEFINITIONS
const functionsToTrace = [
    'showUserView',
    'loadUsersList', 
    'setupAddUserForm',
    'resetAllData',
    'showSection',
    'loadUsers'
];

functionsToTrace.forEach(funcName => {
    Object.defineProperty(window, `_traced_${funcName}`, {
        get() {
            return window[`_original_${funcName}`];
        },
        set(value) {
            debugLog(`📝 ${funcName} is being defined!`);
            debugLog(`Function type: ${typeof value}`);
            debugLog(`Function source: ${value ? value.toString().substring(0, 100) + '...' : 'null'}`);
            
            window[`_original_${funcName}`] = value;
            
            // Wrap the function to trace calls
            window[funcName] = function(...args) {
                debugLog(`📞 CALLING ${funcName}(${args.map(a => JSON.stringify(a)).join(', ')})`);
                try {
                    const result = value.apply(this, args);
                    debugLog(`✅ ${funcName} completed successfully`);
                    return result;
                } catch (error) {
                    debugLog(`❌ ${funcName} ERROR: ${error.message}`);
                    throw error;
                }
            };
        }
    });
    
    // If function already exists, wrap it
    if (window[funcName]) {
        const original = window[funcName];
        window[funcName] = function(...args) {
            debugLog(`📞 CALLING ${funcName}(${args.map(a => JSON.stringify(a)).join(', ')})`);
            try {
                const result = original.apply(this, args);
                debugLog(`✅ ${funcName} completed successfully`);
                return result;
            } catch (error) {
                debugLog(`❌ ${funcName} ERROR: ${error.message}`);
                throw error;
            }
        };
    }
});

// CHECK WHAT EXISTS RIGHT NOW
setTimeout(() => {
    debugLog('=== FUNCTION CHECK ===');
    functionsToTrace.forEach(funcName => {
        const exists = typeof window[funcName] === 'function';
        debugLog(`${funcName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    // Check for user view elements
    debugLog('=== ELEMENT CHECK ===');
    const elements = [
        'users-section',
        'users-list-view',
        'users-add-view',
        'users-act-as-view',
        'add-user-form'
    ];
    
    elements.forEach(id => {
        const elem = document.getElementById(id);
        debugLog(`#${id}: ${elem ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    // Find all buttons with showUserView
    const userButtons = document.querySelectorAll('[onclick*="showUserView"]');
    debugLog(`Found ${userButtons.length} showUserView buttons`);
    userButtons.forEach((btn, i) => {
        debugLog(`Button ${i}: ${btn.textContent.trim()} - onclick="${btn.getAttribute('onclick')}"`);
    });
    
    // Find reset button
    const resetButtons = document.querySelectorAll('[onclick*="resetAllData"]');
    debugLog(`Found ${resetButtons.length} resetAllData buttons`);
}, 1000);

console.log('🔍 BRUTE FORCE DEBUG LOADED - Press Ctrl+D to toggle debug panel');