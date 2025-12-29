// ChatGPT Content Script - Intercepts messages before sending to OpenAI
console.log('QueryShield: ChatGPT interceptor loaded');

let settings = null;
let isProcessing = false;
let allowNextSend = false; // Flag to allow the next send through without interception
let extensionContextValid = true; // Track if extension context is still valid

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    // This will throw if context is invalidated
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

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
      // Check if extension context is still valid
      if (!isExtensionContextValid()) {
        extensionContextValid = false;
        return; // Let the event through normally
      }
      
      // If extension disabled, allow next send flag is set, or we're sending programmatically, let it through
      if (!settings?.enabled || allowNextSend || isProcessing) {
        allowNextSend = false; // Reset the flag
        return;
      }
      
      const text = getInputText(inputElement);
      if (!text || text.trim().length === 0) return;
      
      // Prevent the original send
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      await handleMessageSend(text, inputElement, sendButton);
    }, true); // Use capture phase
    
    // Also intercept Enter key
    inputElement.addEventListener('keydown', async (e) => {
      // Check if extension context is still valid
      if (!isExtensionContextValid()) {
        extensionContextValid = false;
        return; // Let the event through normally
      }
      
      // If extension disabled, allow next send flag is set, or we're sending programmatically, let it through
      if (!settings?.enabled || allowNextSend || isProcessing) {
        allowNextSend = false; // Reset the flag
        return;
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        const text = getInputText(inputElement);
        if (!text || text.trim().length === 0) return;
        
        // Prevent the original send
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
    // Send to background script for validation
    let response;
    try {
      response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_TEXT',
        text: text,
      });
    } catch (contextError) {
      // Extension context invalidated or other communication errors
      // Allow the message through since we can't validate it
      console.warn('QueryShield: Cannot validate message - extension error. Allowing message through.', contextError);
      if (settings?.showNotifications) {
        showToast('⚠️ Extension error - message sent without validation', 'warning');
      }
      clickOriginalButton(sendButton, inputElement);
      return;
    }
    
    console.log('QueryShield: Validation response:', response);
    
    // Handle case where response is undefined or invalid
    if (!response || !response.success) {
      console.warn('QueryShield: Invalid response from background script. Allowing message through.');
      if (settings?.showNotifications) {
        showToast('⚠️ Validation error - message sent without validation', 'warning');
      }
      clickOriginalButton(sendButton, inputElement);
      return;
    }
    
    // Update stats
    await updateStats('scanned');
    
    if (response.data.blocked) {
      // Show blocking modal
      await updateStats('blocked');
      isProcessing = false;
      showBlockModal(response.data.detections, text, inputElement, sendButton);
    } else if (response.data.sanitized) {
      // Show sanitization modal
      isProcessing = false;
      showSanitizeModal(response.data.sanitizedText, response.data.detections, inputElement, sendButton);
    } else {
      // Safe to send - allow through immediately
      // Don't reset isProcessing yet, clickOriginalButton will handle it
      clickOriginalButton(sendButton, inputElement);
    }
  } catch (error) {
    console.error('QueryShield: Unexpected error validating message:', error);
    if (settings?.showNotifications) {
      showToast('⚠️ Unexpected error - message sent without validation', 'warning');
    }
    // Allow the message through on unexpected errors
    clickOriginalButton(sendButton, inputElement);
  }
}

function showBlockModal(detections, originalText, inputElement, sendButton) {
  const actions = [
    {
      label: 'Edit Message',
      type: 'primary',
      action: () => {
        removeModal();
        isProcessing = false;
        allowNextSend = false;
        inputElement.focus();
      }
    }
  ];
  
  // Only show "Send Anyway" if autoBlock is disabled
  if (!settings?.autoBlock) {
    actions.push({
      label: 'Send Anyway',
      type: 'danger',
      action: () => {
        removeModal();
        if (settings.showNotifications) {
          showToast('⚠️ Sent without protection', 'warning');
        }
        clickOriginalButton(sendButton, inputElement);
      }
    });
  }
  
  actions.push({
    label: 'Cancel',
    type: 'secondary',
    action: () => {
      removeModal();
      isProcessing = false;
      allowNextSend = false;
    }
  });
  
  const modal = createModal({
    title: 'Sensitive Data Detected',
    subtitle: settings?.autoBlock ? 'QueryShield blocked this message' : 'QueryShield detected sensitive data',
    type: 'block',
    detections: detections,
    actions: actions
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
          // Wait for input to be updated, then send
          setTimeout(() => clickOriginalButton(sendButton, inputElement), 100);
        }
      },
      {
        label: 'Edit Message',
        type: 'secondary',
        action: () => {
          removeModal();
          isProcessing = false;
          allowNextSend = false;
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

function clickOriginalButton(button, inputElement) {
  // Set flag to allow the next send through our interceptor
  allowNextSend = true;
  isProcessing = true;
  
  // Small delay to ensure flags are set
  setTimeout(() => {
    // Try multiple methods to trigger the send
    
    // Method 1: Click the send button directly
    if (button) {
      button.click();
    }
    
    // Method 2: If button click didn't work, try triggering Enter key
    // with proper event properties that ChatGPT expects
    setTimeout(() => {
      // Check if the input still has content (meaning send didn't work)
      const currentText = getInputText(inputElement);
      if (currentText && currentText.trim().length > 0) {
        // Button click didn't work, try Enter key approach
        allowNextSend = true; // Reset flag for retry
        
        // Focus the input first
        inputElement.focus();
        
        // Create and dispatch Enter key events
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        
        const keypressEvent = new KeyboardEvent('keypress', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        
        const keyupEvent = new KeyboardEvent('keyup', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        
        inputElement.dispatchEvent(keydownEvent);
        inputElement.dispatchEvent(keypressEvent);
        inputElement.dispatchEvent(keyupEvent);
        
        // Also try clicking the button again after key events
        setTimeout(() => {
          if (button) {
            allowNextSend = true;
            button.click();
          }
        }, 50);
      }
      
      // Reset flags after send should have completed
      setTimeout(() => {
        isProcessing = false;
        allowNextSend = false;
      }, 500);
    }, 100);
  }, 10);
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
      setTimeout(initializeInterceptor, 0);
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
    setTimeout(initializeInterceptor, 0);
  });
} else {
  setTimeout(initializeInterceptor, 0);
}

// Retry initialization periodically (ChatGPT is a SPA)
setInterval(() => {
  if (!isProcessing && !document.getElementById('queryshield-modal')) {
    initializeInterceptor();
  }
}, 3000);
