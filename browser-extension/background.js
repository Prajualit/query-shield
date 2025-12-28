// Background Service Worker - Handles API communication
console.log('QueryShield: Background service worker started');

const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'queryshield_token',
    SETTINGS: 'queryshield_settings',
    FIREWALL_ID: 'queryshield_firewall_id',
  },
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VALIDATE_TEXT') {
    handleValidateText(message.text)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleValidateText(text) {
  try {
    // Get settings and firewall ID
    const storage = await chrome.storage.local.get([
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      CONFIG.STORAGE_KEYS.FIREWALL_ID,
      CONFIG.STORAGE_KEYS.SETTINGS,
    ]);
    
    const token = storage[CONFIG.STORAGE_KEYS.ACCESS_TOKEN];
    const firewallId = storage[CONFIG.STORAGE_KEYS.FIREWALL_ID];
    const settings = storage[CONFIG.STORAGE_KEYS.SETTINGS];
    
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated. Please login to QueryShield extension.',
      };
    }
    
    if (!firewallId) {
      return {
        success: false,
        error: 'No firewall selected. Please select a firewall in the extension.',
      };
    }
    
    // Call QueryShield API to validate text
    const response = await fetch(`${CONFIG.API_BASE_URL}/proxy/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firewallId: firewallId,
        text: text,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        await chrome.storage.local.remove(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Structure: { success, data: { blocked, sanitized, detections, sanitizedText } }
    return {
      success: true,
      data: {
        blocked: data.data.blocked || false,
        sanitized: data.data.sanitized || false,
        detections: data.data.detections || [],
        sanitizedText: data.data.sanitizedText || text,
      },
    };
  } catch (error) {
    console.error('QueryShield: Validation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Install/Update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('QueryShield: Extension installed/updated', details.reason);
  
  // Initialize default settings if not exists
  chrome.storage.local.get([CONFIG.STORAGE_KEYS.SETTINGS], (result) => {
    if (!result[CONFIG.STORAGE_KEYS.SETTINGS]) {
      chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.SETTINGS]: {
          enabled: true,
          autoBlock: true,
          showNotifications: true,
          selectedFirewallId: null,
        },
      });
    }
  });
  
  // Initialize stats
  chrome.storage.local.get(['blockedCount', 'scannedCount'], (result) => {
    if (!result.blockedCount) {
      chrome.storage.local.set({ blockedCount: 0 });
    }
    if (!result.scannedCount) {
      chrome.storage.local.set({ scannedCount: 0 });
    }
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (default behavior, this is just a fallback)
  chrome.action.openPopup();
});

// Periodic cleanup of old data (optional)
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    // Reset daily stats at midnight
    const now = new Date();
    if (now.getHours() === 0) {
      chrome.storage.local.set({
        blockedCount: 0,
        scannedCount: 0,
      });
    }
  }
});
