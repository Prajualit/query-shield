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
