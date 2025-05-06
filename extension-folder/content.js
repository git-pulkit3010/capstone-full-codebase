console.log('Content script loaded');

// Declare keywordMap globally
if (typeof window.keywordMap === 'undefined') {
    window.keywordMap = {
        piCollection: ['collect', 'collection', 'gather', 'input', 'form', 'sign-up', 'provide information', 'gathering', 'submission', 'capture', 'request', 'survey', 'registration', 'ask for details', 'data entry', 'acquire', 'obtain', 'receive'],
        piHandling: ['process', 'processing', 'use', 'handle', 'access', 'manage', 'operate', 'utilize', 'apply', 'distribute', 'administer', 'deal with', 'examine', 'analyze', 'store temporarily', 'work with'],
        piStorage: ['store', 'storage', 'retain', 'duration', 'archive', 'keep', 'preserve', 'hold', 'maintain', 'save', 'repository', 'back-up', 'secure', 'keep on file', 'deposit', 'data retention', 'secure storage', 'data warehouse'],
        piSharing: ['share', 'disclose', 'third party', 'affiliate', 'distribute', 'transfer', 'communicate', 'send', 'forward', 'release', 'provide access', 'exchange', 'pass on', 'offer', 'publish', 'share with partners', 'make available'],
        dataConfidentiality: ['confidentiality', 'security', 'encrypt', 'protect', 'safe', 'privacy', 'secure', 'shield', 'restrict access', 'mask', 'guard', 'lock', 'safeguard', 'secure access', 'control access', 'prevent exposure', 'classify'],
        breachNotice: ['breach', 'unauthorized access', 'incident', 'notify', 'alert', 'inform', 'notify about breach', 'data leak', 'security breach', 'disclosure', 'notification', 'report', 'vulnerability', 'compromise', 'exposure', 'warning', 'fail to protect'],
        summarizeWholePage: [],
        withdrawConsent: ['consent', 'opt-out', 'opt out', 'opt-in', 'opt in', 'unsubscribe', 'withdraw', 'reject', 'decline', 'refuse', 'manage preferences', 'change consent', 'adjust privacy', 'accept', 'deny']

    };
}

function expandToggleSections() {
    const detailsElements = document.querySelectorAll('details');
    detailsElements.forEach(detail => detail.setAttribute('open', 'open'));

    const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
    hiddenElements.forEach(element => element.style.display = '');

    const toggleButtons = document.querySelectorAll('[aria-expanded="false"], .expand-toggle');
    toggleButtons.forEach(button => {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        button.dispatchEvent(event);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'extractText') {
        expandToggleSections();
        setTimeout(() => {
            const extracted = extractText(message.categories || []);
            sendResponse({ content: extracted });
        }, 1000); // Wait to allow toggle expansion
        return true;
    }
});



function extractText(categories) {
    const url = window.location.href;
    if (url.endsWith('.pdf')) {
        return '__PDF_URL__:' + url;
    }

    const text = document.body.innerText;

    if (categories.includes('summarizeWholePage') || categories.includes('custom')) {
        return text;
    }

    let sections = [];
    categories.forEach(cat => {
        const keywords = window.keywordMap[cat] || [];
        document.querySelectorAll('p, div').forEach(el => {
            const lower = el.innerText.toLowerCase();
            if (keywords.some(k => lower.includes(k))) {
                sections.push(el.innerText);
            }
        });
    });

    return sections.join('\n').slice(0, 12000); // prevent overload
}



// In content.js, replace the scrollToSource handler with this improved version:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'scrollToSource') {
        const sourceText = message.sourceText.toLowerCase().trim();
        
        // First try to find exact heading matches
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const exactMatch = headings.find(h => 
            h.textContent.toLowerCase().trim() === sourceText
        );
        
        if (exactMatch) {
            highlightAndScroll(exactMatch);
            sendResponse({ success: true });
            return true;
        }

        // Then try partial matches in headings
        const partialMatch = headings.find(h => 
            h.textContent.toLowerCase().includes(sourceText) ||
            sourceText.includes(h.textContent.toLowerCase())
        );
        
        if (partialMatch) {
            highlightAndScroll(partialMatch);
            sendResponse({ success: true });
            return true;
        }

        // Finally search all elements for the text
        const allElements = Array.from(document.querySelectorAll('*'));
        const elementMatch = allElements.find(el => {
            const elText = el.textContent.toLowerCase().trim();
            return elText === sourceText || 
                   elText.includes(sourceText) || 
                   sourceText.includes(elText);
        });

        if (elementMatch) {
            highlightAndScroll(elementMatch);
            sendResponse({ success: true });
            return true;
        }

        sendResponse({ success: false, error: 'Source not found' });
        return true;
    }

    function highlightAndScroll(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the element and its content until next heading
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = 'rgba(127, 90, 240, 0.2)';
        element.style.transition = 'background-color 0.3s ease';
        
        // Also highlight subsequent content until next heading
        let nextElement = element.nextElementSibling;
        while (nextElement && !/^h[1-6]$/i.test(nextElement.tagName)) {
            nextElement.style.backgroundColor = 'rgba(127, 90, 240, 0.1)';
            nextElement.style.transition = 'background-color 0.3s ease';
            nextElement = nextElement.nextElementSibling;
        }
        
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
            nextElement = element.nextElementSibling;
            while (nextElement && !/^h[1-6]$/i.test(nextElement.tagName)) {
                nextElement.style.backgroundColor = '';
                nextElement = nextElement.nextElementSibling;
            }
        }, 3000);
    }
});
  
  