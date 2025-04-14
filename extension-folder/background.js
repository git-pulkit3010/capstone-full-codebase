const openaiApiKey = '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';
const API_BASE_URL = 'http://localhost:3000'; // Replace with your backend API URL


const categoryLabels = {
  summarizeWholePage: 'Whole Page Summary',
  piCollection: 'Personal Information Collection',
  piHandling: 'Personal Information Handling',
  piStorage: 'Personal Information Storage',
  piSharing: 'Personal Information Sharing',
  dataConfidentiality: 'Data Confidentiality & Security',
  breachNotice: 'Data Breach Notification'
};


console.log('Extension loaded, API base:', API_BASE_URL);
// Helper function to generate hash using Web Crypto API
async function generateHash(text) {
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Cache functions that call your backend API

async function getCachedSummary(textHash, category) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textHash, category })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON, got: ${contentType}`);
    }

    const data = await response.json();
    return data.summary;
  } catch (err) {
    console.error('Failed to check cache:', {
      error: err,
      message: err.message,
      stack: err.stack
    });
    return null;
  }
}


async function storeSummary(textHash, category, summary) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageUrl = tab?.url || 'unknown';
    const response = await fetch(`${API_BASE_URL}/api/store-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textHash, category, summary, url:pageUrl })
    });
    
    if (!response.ok) throw new Error('Failed to store summary');
  } catch (err) {
    console.error('Failed to store summary:', err);
  }
}

const prompts = {
  summarizeWholePage: `Please summarize the following terms and conditions in plain English, focusing on all key areas: personal data collection, sharing, user rights, and security. Structure the output into three paragraphs (total ~400 words):\nParagraph 1: Main takeaway.\nParagraph 2: Details.\nParagraph 3: Conclusion.\nText:\n`,

  piCollection: `Please summarize how personal information is collected. Highlight types of data collected, how, and for what purposes. Structure in 3 paragraphs (400 words): Key takeaway, detailed summary, conclusion.\nText:\n`,

  piHandling: `Please summarize how personal data is handled internally, including processing, access, transfer, and anonymization. Structure in 3 paragraphs (400 words): Key takeaway, details, implications.\nText:\n`,

  piStorage: `Please summarize how personal data is stored, including location, duration, and protection. Structure in 3 paragraphs (400 words): Key takeaway, technical details, conclusion.\nText:\n`,

  piSharing: `Please summarize how personal data is shared with third parties. Focus on who, why, and when. Structure in 3 paragraphs (400 words): Key takeaway, explanation, user considerations.\nText:\n`,

  dataConfidentiality: `Please summarize how user data is protected, including encryption, access control, or third-party handling. Structure in 3 paragraphs (400 words): Key takeaway, methods, final evaluation.\nText:\n`,

  breachNotice: `Please summarize the breach notification policy. Include how, when, and what actions are taken. Structure in 3 paragraphs (400 words): Key takeaway, explanation, user consideration.\nText:\n`, 

  custom: ''
};

async function summarizeWithOpenAI(prompt, text, category, callback) {
  try {
    let actualText = text;

    // ✅ If it's a PDF URL, fetch and extract the text first
    if (text.startsWith('__PDF_URL__:')) {
      const pdfUrl = text.replace('__PDF_URL__:', '');
      console.log('📄 PDF detected. Extracting text from:', pdfUrl);

      const extractRes = await fetch('http://localhost:5001/extract-pdf-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pdfUrl })
      });

      const extractData = await extractRes.json();
      if (!extractData.text) {
        throw new Error('No text extracted from PDF.');
      }

      actualText = extractData.text.slice(0, 10000); // limit length for token safety
      prompt = prompts[category] + actualText; // rebuild prompt for LLM
    }

    const textHash = await generateHash(actualText);

    const readableCategory = categoryLabels[category] || category;
    const cachedSummary = await getCachedSummary(textHash, readableCategory);

    if (cachedSummary) {
      console.log(`📦 LOADED FROM CACHE → Category: ${readableCategory}`);
      callback(cachedSummary, true);
      return;
    }

    if (!openaiApiKey || openaiApiKey === 'YOUR_API_KEY') {
      callback('API key is not set.');
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a privacy assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content?.trim() || 'No summary returned.';

    if (content && !content.includes('Error')) {
      await storeSummary(textHash, readableCategory, content);
    }

    callback(content, false);
  } catch (err) {
    console.error('Summarization error:', err);
    callback('Error during summarization: ' + err.message);
  }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'summarizeText') {
    const text = message.content;
    const selected = message.selectedCategories || [];

    if (!openaiApiKey || openaiApiKey === 'YOUR_API_KEY') {
      console.error('Missing or invalid OpenAI API key.');
      sendResponse({ summaries: { error: 'API key is not set.' } });
      return true;
    }

    // Whole page summary shortcut
    if (selected.includes('summarizeWholePage')) {
      summarizeWithOpenAI(
        prompts.summarizeWholePage + text, 
        text, 
        'summarizeWholePage', 
        (summary) => {
          sendResponse({ summaries: { summarizeWholePage: summary } });
        }
      );
      return true;
    }

    // Multi-category summarization
    const summaries = {};
    let completed = 0;

    selected.forEach(category => {
      const prompt = category === 'custom'
      ? message.customPrompt + '\n\nText:\n' + text
      : prompts[category] + text;
      summarizeWithOpenAI(prompt, text, category, (summary) => {
        summaries[category] = summary;
        completed++;
        if (completed === selected.length) {
          sendResponse({ summaries });
        }
      });
    });

    return true; // Required for async
  }
});