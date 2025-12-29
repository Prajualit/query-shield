// QueryShield API Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    FIREWALLS: '/firewalls',
    VALIDATE: '/proxy/validate',
  },
  DEFAULT_SETTINGS: {
    enabled: true,
    autoBlock: true,
    showNotifications: true,
    selectedFirewallId: null,
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'queryshield_token',
    SETTINGS: 'queryshield_settings',
    FIREWALL_ID: 'queryshield_firewall_id',
  },
};

// DOM Elements
let currentView = 'login';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});

async function initializePopup() {
  try {
    // Check if user is logged in
    const { [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: token } = await chrome.storage.local.get(
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN
    );

    if (token) {
      await loadMainView();
    } else {
      showView('login');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showView('login');
  }
}

function showView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
  
  const viewMap = {
    login: 'loginView',
    main: 'mainView',
  };
  
  const targetView = document.getElementById(viewMap[viewName]);
  if (targetView) {
    targetView.classList.remove('hidden');
  }
}

async function loadMainView() {
  try {
    showView('main');
    
    // Load settings
    const settings = await loadSettings();
    updateUIFromSettings(settings);
    
    // Load firewalls
    await loadFirewalls();
    
    // Load stats
    await loadStats();
    
    // Update status
    updateProtectionStatus(settings.enabled);
  } catch (error) {
    console.error('Error loading main view:', error);
    // Still show main view even if some parts fail
    showView('main');
  }
}

async function loadSettings() {
  const { [CONFIG.STORAGE_KEYS.SETTINGS]: settings } = await chrome.storage.local.get(
    CONFIG.STORAGE_KEYS.SETTINGS
  );
  return settings || CONFIG.DEFAULT_SETTINGS;
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: settings });
  
  // Notify content scripts of settings change
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SETTINGS_UPDATED',
      settings
    }).catch(() => {});  // Ignore errors for tabs without content script
  });
}

function updateUIFromSettings(settings) {
  const protectionToggle = document.getElementById('protectionToggle');
  const autoBlockToggle = document.getElementById('autoBlockToggle');
  const notificationToggle = document.getElementById('notificationToggle');
  
  if (protectionToggle) protectionToggle.checked = settings.enabled;
  if (autoBlockToggle) autoBlockToggle.checked = settings.autoBlock;
  if (notificationToggle) notificationToggle.checked = settings.showNotifications;
}

function updateProtectionStatus(enabled) {
  const indicator = document.getElementById('statusIndicator');
  if (!indicator) return;
  
  const statusText = indicator.querySelector('.status-text');
  if (!statusText) return;
  
  if (enabled) {
    indicator.classList.remove('inactive');
    statusText.textContent = 'Active';
  } else {
    indicator.classList.add('inactive');
    statusText.textContent = 'Inactive';
  }
}

async function loadFirewalls() {
  const select = document.getElementById('firewallSelect');
  select.innerHTML = '<option value="">Loading...</option>';
  
  try {
    const { [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: token } = await chrome.storage.local.get(
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN
    );
    
    const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.FIREWALLS}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to load firewalls');
    
    const data = await response.json();
    const firewalls = data.data;
    
    select.innerHTML = '<option value="">Select a firewall...</option>';
    firewalls.forEach(firewall => {
      const option = document.createElement('option');
      option.value = firewall.id;
      option.textContent = `${firewall.name}${firewall.isActive ? '' : ' (Inactive)'}`;
      select.appendChild(option);
    });
    
    // Set current selection
    const { [CONFIG.STORAGE_KEYS.FIREWALL_ID]: selectedId } = await chrome.storage.local.get(
      CONFIG.STORAGE_KEYS.FIREWALL_ID
    );
    if (selectedId) {
      select.value = selectedId;
    }
  } catch (error) {
    console.error('Error loading firewalls:', error);
    select.innerHTML = '<option value="">Error loading firewalls</option>';
  }
}

async function loadStats() {
  const stats = await chrome.storage.local.get(['blockedCount', 'scannedCount']);
  document.getElementById('blockedCount').textContent = stats.blockedCount || 0;
  document.getElementById('scannedCount').textContent = stats.scannedCount || 0;
}

function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  loginForm?.addEventListener('submit', handleLogin);
  
  // Protection toggle
  const protectionToggle = document.getElementById('protectionToggle');
  protectionToggle?.addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.enabled = e.target.checked;
    await saveSettings(settings);
    updateProtectionStatus(settings.enabled);
  });
  
  // Auto-block toggle
  const autoBlockToggle = document.getElementById('autoBlockToggle');
  autoBlockToggle?.addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.autoBlock = e.target.checked;
    await saveSettings(settings);
  });
  
  // Notifications toggle
  const notificationToggle = document.getElementById('notificationToggle');
  notificationToggle?.addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.showNotifications = e.target.checked;
    await saveSettings(settings);
  });
  
  // Firewall selection
  const firewallSelect = document.getElementById('firewallSelect');
  firewallSelect?.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.FIREWALL_ID]: e.target.value });
  });
  
  // Refresh firewalls
  const refreshButton = document.getElementById('refreshFirewalls');
  refreshButton?.addEventListener('click', loadFirewalls);
  
  // Open dashboard
  const dashboardButtons = [
    document.getElementById('openDashboard'),
    document.getElementById('openDashboardMain')
  ];
  dashboardButtons.forEach(btn => {
    btn?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
    });
  });
  
  // Logout
  const logoutButton = document.getElementById('logoutButton');
  logoutButton?.addEventListener('click', handleLogout);
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  const loginButton = document.getElementById('loginButton');
  
  errorMessage.classList.add('hidden');
  loginButton.disabled = true;
  loginButton.innerHTML = '<span>Signing in...</span>';
  
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Save token
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: data.data.accessToken,
    });
    
    // Load main view
    await loadMainView();
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove('hidden');
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = '<span>Sign In</span>';
  }
}

async function handleLogout() {
  await chrome.storage.local.clear();
  showView('login');
}
