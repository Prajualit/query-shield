# QueryShield Browser Extension

Protect sensitive data from being leaked to AI models. Automatically scans and blocks sensitive information before it reaches ChatGPT, Claude, and other AI chatbots.

## Features

- 🛡️ **Real-time Protection** - Scans messages before sending to AI chatbots
- 🚫 **Auto-block** - Prevents sensitive data from leaving your browser
- 🔍 **Detection** - Identifies emails, credit cards, SSNs, API keys, and more
- 🎨 **Visual Warnings** - Clear indicators when sensitive data is detected
- ⚙️ **Customizable** - Choose which firewalls and rules to apply

## Supported Platforms

- ✅ ChatGPT (chat.openai.com)
- ✅ Claude (claude.ai)
- ✅ Google Gemini (gemini.google.com)
- ✅ Microsoft Copilot (copilot.microsoft.com)

## Installation

### Development Mode

1. Clone the QueryShield repository
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `browser-extension` folder
6. The extension icon should appear in your toolbar

### Configuration

1. Click the QueryShield extension icon
2. Login with your QueryShield account
3. Select a firewall to use
4. Start chatting safely!

## How It Works

```
Your Message → QueryShield Extension → QueryShield API → Scan for Sensitive Data
                                              ↓
                                    Block if detected / Sanitize
                                              ↓
                                    Forward to AI (if safe)
```

## Development

### Project Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── config.js             # API configuration
├── content-scripts/      # Scripts injected into web pages
│   ├── chatgpt.js       # ChatGPT interceptor
│   ├── claude.js        # Claude interceptor
│   └── gemini.js        # Gemini interceptor
├── styles/
│   ├── popup.css        # Popup styling
│   └── overlay.css      # In-page warning styles
└── icons/               # Extension icons
```

## Permissions

- `storage` - Save settings and auth tokens
- `activeTab` - Detect current AI chatbot
- `notifications` - Show block/warning alerts
- `host_permissions` - Access AI chatbot sites and QueryShield API

## Privacy

QueryShield only scans text you're about to send to AI chatbots. Nothing is stored or transmitted unless you explicitly send a message.
