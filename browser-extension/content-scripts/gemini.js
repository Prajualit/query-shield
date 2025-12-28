// Gemini Content Script - Interceptor for Google Gemini
console.log('QueryShield: Gemini interceptor loaded');

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
  const selectors = [
    'div[contenteditable="true"]',
    'textarea',
    'div.ql-editor'
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
      // Show modal (implement if needed)
    } else if (response.data.sanitized) {
      setInputText(inputElement, response.data.sanitizedText);
      setTimeout(() => clickOriginalButton(sendButton), 100);
    } else {
      clickOriginalButton(sendButton);
    }
  } catch (error) {
    console.error('QueryShield: Error validating message:', error);
  } finally {
    isProcessing = false;
  }
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
