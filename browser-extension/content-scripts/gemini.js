// Gemini Content Script - Intercepts messages before sending to Google Gemini
console.log('QueryShield: Gemini interceptor loaded');

let settings = null;
let isProcessing = false;
let allowNextSend = false;
let extensionContextValid = true;

function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

chrome.storage.local.get(['queryshield_settings'], (result) => {
  settings = result.queryshield_settings || { enabled: true, autoBlock: true, showNotifications: true };
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    settings = message.settings;
  }
});

function initializeInterceptor() {
  const selectors = [
    'div.ql-editor[contenteditable="true"]',
    'rich-textarea div[contenteditable="true"]',
    'div[contenteditable="true"]',
    'textarea',
  ];
  
  for (const selector of selectors) {
    const inputs = document.querySelectorAll(selector);
    for (const input of inputs) {
      if (input.offsetHeight > 30) {
        console.log('QueryShield: Found Gemini input element');
        attachInterceptor(input);
        observeInputChanges(input);
        return true;
      }
    }
  }
  return false;
}

function attachInterceptor(inputElement) {
  const sendButton = findSendButton();
  
  if (sendButton) {
    sendButton.addEventListener('click', async (e) => {
      if (!isExtensionContextValid()) { extensionContextValid = false; return; }
      if (!settings?.enabled || allowNextSend || isProcessing) { allowNextSend = false; return; }
      
      const text = getInputText(inputElement);
      if (!text || text.trim().length === 0) return;
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      await handleMessageSend(text, inputElement, sendButton);
    }, true);
    
    inputElement.addEventListener('keydown', async (e) => {
      if (!isExtensionContextValid()) { extensionContextValid = false; return; }
      if (!settings?.enabled || allowNextSend || isProcessing) { allowNextSend = false; return; }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        const text = getInputText(inputElement);
        if (!text || text.trim().length === 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        await handleMessageSend(text, inputElement, sendButton);
      }
    }, true);
    
    console.log('QueryShield: Interceptor attached to Gemini');
  }
}

function findSendButton() {
  // Gemini's send button selectors
  const selectors = [
    'button[aria-label="Send message"]',
    'button.send-button',
    'button[data-test-id="send-button"]',
  ];
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) return button;
  }
  
  // Fallback
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(btn => {
    const ariaLabel = btn.getAttribute('aria-label');
    const text = btn.textContent.toLowerCase();
    return (ariaLabel && ariaLabel.toLowerCase().includes('send')) ||
           text.includes('send') ||
           text.includes('submit');
  });
}

function getInputText(element) {
  if (element.tagName === 'TEXTAREA') {
    return element.value;
  }
  return element.textContent || element.innerText || '';
}

function setInputText(element, text) {
  if (element.tagName === 'TEXTAREA') {
    element.value = text;
  } else {
    element.textContent = text;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

async function handleMessageSend(text, inputElement, sendButton) {
  if (isProcessing) return;
  isProcessing = true;
  
  try {
    let response;
    try {
      response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_TEXT',
        text: text,
      });
    } catch (contextError) {
      console.warn('QueryShield: Cannot validate message - extension error.', contextError);
      if (settings?.showNotifications) {
        showToast('⚠️ Extension error - message sent without validation', 'warning');
      }
      clickOriginalButton(sendButton, inputElement);
      return;
    }
    
    if (!response || !response.success) {
      console.warn('QueryShield: Invalid response. Allowing message through.');
      if (settings?.showNotifications) {
        showToast('⚠️ Validation error - message sent without validation', 'warning');
      }
      clickOriginalButton(sendButton, inputElement);
      return;
    }
    
    await updateStats('scanned');
    
    if (response.data.blocked) {
      await updateStats('blocked');
      isProcessing = false;
      showBlockModal(response.data.detections, text, inputElement, sendButton);
    } else if (response.data.sanitized) {
      isProcessing = false;
      showSanitizeModal(response.data.sanitizedText, response.data.detections, inputElement, sendButton);
    } else {
      clickOriginalButton(sendButton, inputElement);
    }
  } catch (error) {
    console.error('QueryShield: Unexpected error:', error);
    if (settings?.showNotifications) {
      showToast('⚠️ Unexpected error - message sent without validation', 'warning');
    }
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
  
  actions.forEach(action => {
    const btn = overlay.querySelector(`[data-action="${action.label}"]`);
    btn?.addEventListener('click', action.action);
  });
  
  return overlay;
}

function removeModal() {
  const modal = document.getElementById('queryshield-modal');
  if (modal) modal.remove();
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
  allowNextSend = true;
  isProcessing = true;
  
  setTimeout(() => {
    if (button) button.click();
    
    setTimeout(() => {
      const currentText = getInputText(inputElement);
      if (currentText && currentText.trim().length > 0) {
        allowNextSend = true;
        inputElement.focus();
        
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true, composed: true
        });
        inputElement.dispatchEvent(enterEvent);
        
        setTimeout(() => {
          if (button) { allowNextSend = true; button.click(); }
        }, 50);
      }
      
      setTimeout(() => { isProcessing = false; allowNextSend = false; }, 500);
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
    if (!document.contains(inputElement)) {
      observer.disconnect();
      setTimeout(initializeInterceptor, 1000);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeInterceptor, 1000);
  });
} else {
  setTimeout(initializeInterceptor, 1000);
}

// Retry initialization periodically (Gemini is a SPA)
setInterval(() => {
  if (!isProcessing && !document.getElementById('queryshield-modal')) {
    initializeInterceptor();
  }
}, 3000);
