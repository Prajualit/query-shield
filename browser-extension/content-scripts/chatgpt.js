// ChatGPT Content Script - Intercepts messages before sending to OpenAI
console.log('QueryShield: ChatGPT interceptor loaded');

let settings = null;
let isProcessing = false;

// Load settings
chrome.storage.local.get(['queryshield_settings'], (result) => {
  settings = result.queryshield_settings || { enabled: true, autoBlock: true, showNotifications: true };
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    settings = message.settings;
  }
});

// Find and monitor the input textarea
function initializeInterceptor() {
  // ChatGPT uses a contenteditable div or textarea
  const selectors = [
    'textarea[data-id]',
    'textarea#prompt-textarea',
    'div[contenteditable="true"]#prompt-textarea',
    'textarea',
  ];
  
  for (const selector of selectors) {
    const input = document.querySelector(selector);
    if (input) {
      console.log('QueryShield: Found ChatGPT input element');
      attachInterceptor(input);
      observeInputChanges(input);
      return true;
    }
  }
  return false;
}

function attachInterceptor(inputElement) {
  // Find the send button
  const sendButton = findSendButton();
  
  if (sendButton) {
    // Intercept send button click
    sendButton.addEventListener('click', async (e) => {
      if (!settings?.enabled || isProcessing) return;
      
      const text = getInputText(inputElement);
      if (!text || text.trim().length === 0) return;
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      await handleMessageSend(text, inputElement, sendButton);
    }, true); // Use capture phase
    
    // Also intercept Enter key
    inputElement.addEventListener('keydown', async (e) => {
      if (!settings?.enabled || isProcessing) return;
      
      if (e.key === 'Enter' && !e.shiftKey) {
        const text = getInputText(inputElement);
        if (!text || text.trim().length === 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        await handleMessageSend(text, inputElement, sendButton);
      }
    }, true);
    
    console.log('QueryShield: Interceptor attached to ChatGPT');
  }
}

function findSendButton() {
  const selectors = [
    'button[data-testid="send-button"]',
    'button[data-testid="fruitjuice-send-button"]',
    'button svg[data-icon="arrow-up"]',
  ];
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) {
      return button.tagName === 'BUTTON' ? button : button.closest('button');
    }
  }
  
  // Fallback: find button near textarea
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(btn => {
    const svg = btn.querySelector('svg');
    return svg && (
      svg.getAttribute('data-icon') === 'arrow-up' ||
      btn.getAttribute('aria-label')?.toLowerCase().includes('send')
    );
  });
}

function getInputText(element) {
  if (element.tagName === 'TEXTAREA') {
    return element.value;
  } else {
    return element.textContent || element.innerText;
  }
}

function setInputText(element, text) {
  if (element.tagName === 'TEXTAREA') {
    element.value = text;
  } else {
    element.textContent = text;
  }
  
  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

async function handleMessageSend(text, inputElement, sendButton) {
  if (isProcessing) return;
  isProcessing = true;
  
  try {
    showInputBadge(inputElement, 'Scanning...');
    
    // Send to background script for validation
    const response = await chrome.runtime.sendMessage({
      type: 'VALIDATE_TEXT',
      text: text,
    });
    
    hideInputBadge(inputElement);
    
    if (!response.success) {
      showToast('Error scanning message. Proceeding without protection.', 'error');
      clickOriginalButton(sendButton);
      return;
    }
    
    // Update stats
    await updateStats('scanned');
    
    if (response.data.blocked) {
      // Show blocking modal
      await updateStats('blocked');
      showBlockModal(response.data.detections, text, inputElement, sendButton);
    } else if (response.data.sanitized) {
      // Show sanitization modal
      showSanitizeModal(response.data.sanitizedText, response.data.detections, inputElement, sendButton);
    } else {
      // Safe to send
      clickOriginalButton(sendButton);
    }
  } catch (error) {
    console.error('QueryShield: Error validating message:', error);
    showToast('Protection error. Message not sent.', 'error');
  } finally {
    isProcessing = false;
  }
}

function showBlockModal(detections, originalText, inputElement, sendButton) {
  const modal = createModal({
    title: 'Sensitive Data Detected',
    subtitle: 'QueryShield blocked this message',
    type: 'block',
    detections: detections,
    actions: [
      {
        label: 'Edit Message',
        type: 'primary',
        action: () => {
          removeModal();
          inputElement.focus();
        }
      },
      {
        label: 'Send Anyway',
        type: 'danger',
        action: () => {
          removeModal();
          if (settings.showNotifications) {
            showToast('⚠️ Sent without protection', 'warning');
          }
          clickOriginalButton(sendButton);
        }
      },
      {
        label: 'Cancel',
        type: 'secondary',
        action: () => {
          removeModal();
        }
      }
    ]
  });
  
  document.body.appendChild(modal);
}

function showSanitizeModal(sanitizedText, detections, inputElement, sendButton) {
  const modal = createModal({
    title: 'Data Sanitized',
    subtitle: 'Sensitive information will be replaced',
    type: 'sanitize',
    detections: detections,
    actions: [
      {
        label: 'Send Sanitized',
        type: 'primary',
        action: () => {
          removeModal();
          setInputText(inputElement, sanitizedText);
          setTimeout(() => clickOriginalButton(sendButton), 100);
        }
      },
      {
        label: 'Edit Message',
        type: 'secondary',
        action: () => {
          removeModal();
          inputElement.focus();
        }
      }
    ]
  });
  
  document.body.appendChild(modal);
}

function createModal({ title, subtitle, type, detections, actions }) {
  const overlay = document.createElement('div');
  overlay.className = 'queryshield-overlay';
  overlay.id = 'queryshield-modal';
  
  const alertColor = type === 'block' ? '#ef4444' : '#f59e0b';
  const alertIcon = type === 'block' ? 
    '<path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' :
    '<path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  
  overlay.innerHTML = `
    <div class="queryshield-modal">
      <div class="queryshield-modal-header">
        <div class="queryshield-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 class="queryshield-title">${title}</h2>
          <p class="queryshield-subtitle">${subtitle}</p>
        </div>
      </div>
      
      <div class="queryshield-content">
        <div class="queryshield-alert">
          <div class="queryshield-alert-title">
            <svg class="queryshield-alert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              ${alertIcon}
            </svg>
            ${detections.length} Sensitive ${detections.length === 1 ? 'Item' : 'Items'} Found
          </div>
          <div class="queryshield-alert-message">
            ${type === 'block' ? 
              'This message contains sensitive data that could be leaked to the AI model.' :
              'Sensitive data will be automatically replaced with safe placeholders.'
            }
          </div>
        </div>
        
        <div class="queryshield-detections">
          <div class="queryshield-detections-title">Detected Items</div>
          ${detections.map(d => `
            <div class="queryshield-detection-item">
              <svg class="queryshield-detection-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="queryshield-detection-content">
                <div class="queryshield-detection-type">${formatDetectionType(d.type)}</div>
                <div class="queryshield-detection-value">${escapeHtml(d.value)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="queryshield-actions">
        ${actions.map(action => `
          <button class="queryshield-btn queryshield-btn-${action.type}" data-action="${action.label}">
            ${action.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  // Attach action listeners
  actions.forEach(action => {
    const btn = overlay.querySelector(`[data-action="${action.label}"]`);
    btn?.addEventListener('click', action.action);
  });
  
  return overlay;
}

function removeModal() {
  const modal = document.getElementById('queryshield-modal');
  if (modal) {
    modal.remove();
  }
}

function showInputBadge(inputElement, text) {
  hideInputBadge(inputElement);
  
  const badge = document.createElement('div');
  badge.className = 'queryshield-badge';
  badge.id = 'queryshield-input-badge';
  badge.innerHTML = `
    <svg class="queryshield-badge-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    ${text}
  `;
  
  const parent = inputElement.parentElement;
  parent.style.position = 'relative';
  parent.appendChild(badge);
}

function hideInputBadge(inputElement) {
  const badge = document.getElementById('queryshield-input-badge');
  if (badge) {
    badge.remove();
  }
}

function showToast(message, type = 'info') {
  if (!settings?.showNotifications) return;
  
  const toast = document.createElement('div');
  toast.className = 'queryshield-toast';
  toast.innerHTML = `
    <div class="queryshield-toast-content">
      <svg class="queryshield-toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="queryshield-toast-message">${message}</div>
      <button class="queryshield-toast-close">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  
  const closeBtn = toast.querySelector('.queryshield-toast-close');
  closeBtn.addEventListener('click', () => toast.remove());
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function clickOriginalButton(button) {
  // Remove our interceptor temporarily
  isProcessing = true;
  
  // Trigger the original click
  button.click();
  
  setTimeout(() => {
    isProcessing = false;
  }, 1000);
}

async function updateStats(type) {
  const key = type === 'blocked' ? 'blockedCount' : 'scannedCount';
  const stats = await chrome.storage.local.get([key]);
  const count = (stats[key] || 0) + 1;
  await chrome.storage.local.set({ [key]: count });
}

function formatDetectionType(type) {
  const map = {
    'EMAIL': 'Email Address',
    'PHONE': 'Phone Number',
    'CREDIT_CARD': 'Credit Card',
    'SSN': 'Social Security Number',
    'API_KEY': 'API Key',
    'PASSWORD': 'Password',
    'IP_ADDRESS': 'IP Address',
    'URL': 'URL',
  };
  return map[type] || type;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function observeInputChanges(inputElement) {
  const observer = new MutationObserver(() => {
    // Re-attach if input element is replaced
    if (!document.contains(inputElement)) {
      observer.disconnect();
      setTimeout(initializeInterceptor, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeInterceptor, 1000);
  });
} else {
  setTimeout(initializeInterceptor, 1000);
}

// Retry initialization periodically (ChatGPT is a SPA)
setInterval(() => {
  if (!isProcessing && !document.getElementById('queryshield-modal')) {
    initializeInterceptor();
  }
}, 3000);
