// Claude Content Script - Similar interceptor for Claude.ai
console.log('QueryShield: Claude interceptor loaded');

let settings = null;
let isProcessing = false;

chrome.storage.local.get(['queryshield_settings'], (result) => {
  settings = result.queryshield_settings || { enabled: true, autoBlock: true, showNotifications: true };
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    settings = message.settings;
  }
});

function initializeInterceptor() {
  // Claude uses a contenteditable div
  const selectors = [
    'div[contenteditable="true"]',
    'textarea',
  ];
  
  for (const selector of selectors) {
    const inputs = document.querySelectorAll(selector);
    for (const input of inputs) {
      // Find the main chat input (usually the largest one)
      if (input.offsetHeight > 50 || input.className.includes('ProseMirror')) {
        console.log('QueryShield: Found Claude input element');
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
      if (!settings?.enabled || isProcessing) return;
      
      const text = getInputText(inputElement);
      if (!text || text.trim().length === 0) return;
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      await handleMessageSend(text, inputElement, sendButton);
    }, true);
    
    inputElement.addEventListener('keydown', async (e) => {
      if (!settings?.enabled || isProcessing) return;
      
      // Claude uses Enter to send (Shift+Enter for new line)
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const text = getInputText(inputElement);
        if (!text || text.trim().length === 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        await handleMessageSend(text, inputElement, sendButton);
      }
    }, true);
    
    console.log('QueryShield: Interceptor attached to Claude');
  }
}

function findSendButton() {
  // Claude's send button
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(btn => {
    const ariaLabel = btn.getAttribute('aria-label');
    return ariaLabel && (
      ariaLabel.toLowerCase().includes('send') ||
      ariaLabel.toLowerCase().includes('submit')
    );
  });
}

function getInputText(element) {
  return element.textContent || element.innerText || element.value || '';
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
    const response = await chrome.runtime.sendMessage({
      type: 'VALIDATE_TEXT',
      text: text,
    });
    
    if (!response.success) {
      clickOriginalButton(sendButton);
      return;
    }
    
    await updateStats('scanned');
    
    if (response.data.blocked) {
      await updateStats('blocked');
      showBlockModal(response.data.detections, text, inputElement, sendButton);
    } else if (response.data.sanitized) {
      showSanitizeModal(response.data.sanitizedText, response.data.detections, inputElement, sendButton);
    } else {
      clickOriginalButton(sendButton);
    }
  } catch (error) {
    console.error('QueryShield: Error validating message:', error);
  } finally {
    isProcessing = false;
  }
}

// Reuse modal functions from chatgpt.js (same implementation)
function showBlockModal(detections, originalText, inputElement, sendButton) {
  // Same implementation as ChatGPT
  const event = new CustomEvent('queryshield-show-modal', {
    detail: { type: 'block', detections, inputElement, sendButton }
  });
  document.dispatchEvent(event);
}

function clickOriginalButton(button) {
  isProcessing = true;
  button.click();
  setTimeout(() => { isProcessing = false; }, 1000);
}

async function updateStats(type) {
  const key = type === 'blocked' ? 'blockedCount' : 'scannedCount';
  const stats = await chrome.storage.local.get([key]);
  const count = (stats[key] || 0) + 1;
  await chrome.storage.local.set({ [key]: count });
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

setInterval(() => {
  if (!isProcessing) {
    initializeInterceptor();
  }
}, 3000);
