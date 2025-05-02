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
        summarizeWholePage: []
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

// function extractText(categories) {
//   const url = window.location.href;
//   if (url.endsWith('.pdf')) {
//     return '__PDF_URL__:' + url;
//   }

//   if (categories.includes('custom')) {
//     return document.body.innerText;
//   } if (categories.includes('summarizeWholePage')) {
//     return text;
//   }


//   let sections = [];
//   const text = document.body.innerText;

//   if (categories.includes('summarizeWholePage')) {
//     return text;
//   }

//   categories.forEach(cat => {
//     const keywords = window.keywordMap[cat] || []; // Access the global keywordMap
//     document.querySelectorAll('p, div').forEach(el => {
//       const lower = el.innerText.toLowerCase();
//       if (keywords.some(k => lower.includes(k))) {
//         sections.push(el.innerText);
//       }
//     });
//   });

//   return sections.join('\n').slice(0, 12000); // avoid overload
// }

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

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.type === 'scrollToSource') {
//       const targetText = message.sourceText.trim().toLowerCase();
//       const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b, th'));
//       const allElements = Array.from(document.querySelectorAll('body *')); // to collect full section content
  
//       for (let i = 0; i < headings.length; i++) {
//         const heading = headings[i];
//         const headingText = heading.innerText.trim().toLowerCase();
  
//         if (
//             headingText === targetText ||
//             headingText.includes(targetText) ||
//             targetText.includes(headingText)
//           ) 
//            {
//           heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
//           // Highlight section content until the next heading of same or higher level
//           const startIndex = allElements.indexOf(heading);
//           let endIndex = allElements.length;
//         //   const currentLevel = parseInt(heading.tagName.charAt(1));
//         let currentLevel = 6; // default if not a heading

//         if (/H[1-6]/.test(heading.tagName)) {
//         currentLevel = parseInt(heading.tagName.charAt(1));
//         }

  
//           for (let j = startIndex + 1; j < allElements.length; j++) {
//             const tag = allElements[j].tagName;
//             if (/H[1-6]/.test(tag) && parseInt(tag.charAt(1)) <= currentLevel) {
//               endIndex = j;
//               break;
//             }
//           }
  
//           for (let k = startIndex; k < endIndex; k++) {
//             const el = allElements[k];
//             el.style.backgroundColor = 'rgba(127, 90, 240, 0.15)';
//             el.style.transition = 'background-color 0.5s ease';
//           }
  
//           setTimeout(() => {
//             for (let k = startIndex; k < endIndex; k++) {
//               allElements[k].style.backgroundColor = '';
//             }
//           }, 3000);
  
//           sendResponse({ success: true });
//           return true;
//         }
//       }
  
//       sendResponse({ success: false });
//       return true;
//     }
//   });

// content.js
// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'scrollToSource') {
        const sourceText = message.sourceText;
        
        // Try to find the element containing the source text
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.textContent.includes(sourceText);
        });
        
        if (elements.length > 0) {
            // Scroll to the first matching element
            elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight it temporarily
            const originalBg = elements[0].style.backgroundColor;
            elements[0].style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            setTimeout(() => {
                elements[0].style.backgroundColor = originalBg;
            }, 2000);
            
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Source not found' });
        }
    }
    return true; // Required for async response
});
  
  