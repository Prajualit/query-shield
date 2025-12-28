# 🚀 QueryShield Browser Extension - Installation & Usage Guide

## ✅ Complete! All Phases Done

The QueryShield browser extension is fully functional and ready to use. It will automatically intercept and scan messages before they're sent to AI chatbots.

---

## 📦 Installation Steps

### 1. **Prepare Icons** (Optional but Recommended)

The extension needs icons. You have two options:

**Option A: Use Placeholder (Quick Start)**
- The extension will work without icons, but Chrome may show a default icon

**Option B: Add Proper Icons**
1. Create or download a shield icon (yellow/amber colored)
2. Generate at these sizes: 16x16, 32x32, 48x48, 128x128
3. Save as PNG files in `browser-extension/icons/`
4. Name them: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

### 2. **Load Extension in Chrome/Edge**

1. Open Chrome or Edge browser
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Navigate to: `c:\NITH\WD\query-shield\browser-extension`
6. Select the folder and click **"Select Folder"**

✅ The QueryShield icon should appear in your extensions toolbar!

### 3. **Start Your Backend**

Make sure your QueryShield server is running:

```powershell
cd c:\NITH\WD\query-shield\server
npm run dev
```

The server should be running on `http://localhost:5000`

### 4. **Start Your Frontend** (Optional, for settings)

```powershell
cd c:\NITH\WD\query-shield\client
npm run dev
```

---

## 🎯 How to Use

### First Time Setup

1. **Click the QueryShield extension icon** in your toolbar
2. **Login** with your QueryShield account credentials
3. **Select a firewall** from the dropdown
4. **Enable protection** (should be ON by default)

### Settings

- **Protection Status**: Toggle protection on/off
- **Auto-block**: Automatically block messages with sensitive data
- **Show Notifications**: Get alerts when data is blocked
- **Select Firewall**: Choose which firewall rules to apply

### Using with AI Chatbots

1. **Go to ChatGPT** (chat.openai.com) or **Claude** (claude.ai)
2. **Type a message** with sensitive data (e.g., "My email is john@example.com")
3. **Click Send** or press Enter
4. **QueryShield intercepts!** A modal will appear showing:
   - What sensitive data was detected
   - Type of data (email, credit card, etc.)
   - Options to edit, send anyway, or cancel

### What Gets Detected?

✅ Email addresses
✅ Phone numbers
✅ Credit card numbers
✅ Social Security Numbers (SSN)
✅ API keys & tokens
✅ Passwords
✅ IP addresses
✅ URLs
✅ Custom patterns (configured in your firewall)

---

## 🎨 Features Showcase

### 1. **Real-time Interception**
- Messages are scanned BEFORE sending to AI
- No data leaves your browser without approval

### 2. **Visual Warnings**
- Beautiful modal overlays with QueryShield branding
- Clear detection details
- Multiple action options

### 3. **Smart Sanitization**
- Option to replace sensitive data with placeholders
- Example: `john@example.com` → `***@***.com`

### 4. **Statistics Tracking**
- See how many messages were blocked today
- Track total scanned messages
- View stats in the extension popup

---

## 🔧 Troubleshooting

### Extension Not Working?

1. **Check if backend is running**: Visit `http://localhost:5000/api`
2. **Check browser console**: Right-click page → Inspect → Console
3. **Reload extension**: Go to `chrome://extensions/` → Click reload icon
4. **Re-login**: Click extension icon → Logout → Login again

### Not Detecting Sensitive Data?

1. **Check firewall is active**: Extension popup → Verify firewall selected
2. **Check firewall rules**: Go to dashboard → Firewalls → Edit rules
3. **Try test data**: Enter "test@email.com" to verify detection works

### Modal Not Appearing?

1. **Refresh the AI chatbot page**
2. **Check if protection is enabled** in extension popup
3. **Look for QueryShield console logs** (should say "Interceptor loaded")

---

## 🚀 Next Steps

### Enhance Your Protection

1. **Create Custom Rules**
   - Go to Dashboard → Firewalls → Rules
   - Add patterns specific to your data

2. **Configure Multiple Firewalls**
   - Work firewall (strict)
   - Personal firewall (moderate)
   - Testing firewall (permissive)

3. **Review Audit Logs**
   - Dashboard → Audit Logs
   - See what was blocked and when

### Share with Team

The extension can be:
- Shared as a `.zip` file
- Published to Chrome Web Store (after review)
- Deployed via enterprise policy

---

## 📝 Architecture Overview

```
┌─────────────────────┐
│   AI Chatbot Page   │
│  (ChatGPT/Claude)   │
└──────────┬──────────┘
           │
           │ Message typed
           ↓
┌─────────────────────┐
│  Content Script     │◄─── Intercepts before send
│  (chatgpt.js)       │
└──────────┬──────────┘
           │
           │ Sends to background
           ↓
┌─────────────────────┐
│  Background Worker  │◄─── Manages state & API calls
│  (background.js)    │
└──────────┬──────────┘
           │
           │ API Request
           ↓
┌─────────────────────┐
│  QueryShield API    │◄─── POST /api/proxy/validate
│  (localhost:5000)   │
└──────────┬──────────┘
           │
           │ Scan with rules
           ↓
┌─────────────────────┐
│   Rules Engine      │◄─── Check against firewall
│   Detector Service  │
└──────────┬──────────┘
           │
           │ Return result
           ↓
      ┌────────┐
      │ Result │
      ├────────┤
      │ ✅ Safe │
      │ ⚠️ Block│
      │ 🔧 Sanitize│
      └────────┘
```

---

## 🎉 Supported Platforms

- ✅ **ChatGPT** (chat.openai.com, chatgpt.com)
- ✅ **Claude** (claude.ai)
- ✅ **Google Gemini** (gemini.google.com)
- 🔜 **Microsoft Copilot** (Coming soon)
- 🔜 **Perplexity** (Coming soon)

---

## 💡 Pro Tips

1. **Keep extension pinned**: Right-click extension icon → Pin
2. **Check stats daily**: Monitor how much data you're protecting
3. **Test before trusting**: Try with fake sensitive data first
4. **Update firewalls regularly**: Add new patterns as needed
5. **Use different firewalls**: Switch based on context (work/personal)

---

## ❓ FAQ

**Q: Does QueryShield store my messages?**
A: Only metadata is logged (detection type, timestamp). Actual message content is not stored unless audit logging is enabled.

**Q: Can I use this offline?**
A: No, the extension needs connection to your QueryShield backend to validate messages.

**Q: Will this slow down my chatbot?**
A: Minimal delay (typically <500ms). The scan happens locally on your server.

**Q: Can I whitelist certain phrases?**
A: Yes! Create custom rules in your firewall with "ALLOW" action.

**Q: Does this work with ChatGPT Plus/Pro?**
A: Yes! The extension works with all ChatGPT tiers.

---

## 🐛 Known Issues

- Modal styling may vary slightly between different AI platforms
- Some chatbot UI updates might temporarily break detection
- Extension needs to be reloaded after changing settings

---

## 📧 Support

Need help? 
- Check server logs: `c:\NITH\WD\query-shield\server` console
- Check browser console: F12 → Console tab
- Review firewall rules in dashboard

---

**You're all set! 🎉**

Open ChatGPT, type something sensitive, and watch QueryShield protect you in real-time!
