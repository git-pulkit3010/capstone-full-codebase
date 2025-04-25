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
  piSharing: `You are a privacy assistant. Please read and analyze the following terms and conditions. Summarize the sections related to how personal information is shared with third parties. Focus on who the data is shared with, under what circumstances, and for what purposes.
Structure your output using the following section titles. Do not use bullet points or markdown formatting.
**Key Takeaways**  
Summarize the main message users should understand about data sharing.
**Detailed Explanation**  
Explain who the data is shared with, when, and why, using plain language and examples from the terms.
**Implications for Users**  
Discuss what these sharing practices mean for users in terms of control and privacy.
**Source References**  
Clearly state which sections of the terms your summary is based on. Include quoted headers or phrases like “Section 3: Information Sharing Practices” to help users trace the origin.
Text:
`,

  piCollection: `You are a privacy assistant. Please summarize how personal information is collected based on the following terms and conditions. Include what types of data are collected, how they are collected, and why.
Organize your summary into the following clearly labeled sections. Do not use bullet points or markdown syntax.
**Key Takeaways**  
What users need to know about the collection of their data.
**How Information is Collected**  
Provide details on collection methods (e.g., cookies, forms) and examples of data types gathered.
**What This Means for the User**  
Explain the significance of these practices for privacy, consent, and tracking.
**Source References**  
List specific sections or clauses that describe data collection, using quotes like “Cookies and Tracking Technologies.”
Text:
`,

  dataConfidentiality: `You are a privacy assistant. Please review and simplify the terms and conditions related to data confidentiality and security. Explain how user data is protected and whether the protections appear effective.
Use the following section titles. Write in full paragraphs without bullet points or markdown formatting.
**Security Overview**  
Explain the core data protection practices mentioned.
**Technologies and Safeguards Used**  
Describe encryption, access controls, and other technologies in plain terms.
**Reflections and Clarity**  
Assess whether these measures seem sufficient and clearly communicated.
**Source References**  
Cite the section titles or clauses from the terms like “Security Measures” or “Your Data Protection.”
Text:
`,

  summarizeWholePage: `You are a privacy assistant. Please summarize the entire terms and conditions in plain English. Focus on the main themes: data collection, usage, sharing, storage, security, and user rights.
Organize the summary into the following sections. Use paragraph format without markdown.
**Overall Summary**  
Capture the main purpose and scope of the document.
**Key Policies Explained**  
Go into more detail about data use, sharing, and user rights.
**What Users Should Be Aware Of**  
Discuss the overall impact of the policies on the user.
**Source References**  
Clearly mention which sections were summarized, using phrases like “Section 2: Data Collection” or “User Rights.”
Text:
`,

  piHandling: `You are a privacy assistant. Please summarize how personal information is handled internally, including how it is accessed, processed, transferred, or anonymized.
Divide your summary into four clearly titled sections. Use full paragraphs and avoid markdown.
**Key Takeaways on Handling**  
What users should understand about internal data handling practices.
**Detailed Processing Practices**  
Explain how the data is accessed and used internally, including transfers or transformations.
**User Impact and Recommendations**  
Describe what this means for user control, trust, and transparency.
**Source References**  
Name and quote the specific sections, like “Employee Access Policies” or “Internal Use of Data.”
Text:
`,

  piStorage: `You are a privacy assistant. Please summarize how personal data is stored, including where it is stored, for how long, and how it is protected.
Structure your output into the following titled sections. Do not use markdown formatting or bullets.
**Main Storage Practices**  
Summarize where and how personal data is stored.
**Storage Duration and Protections**  
Explain how long data is kept, where, and under what security measures.
**Implications for Privacy**  
Discuss what these storage practices mean for user security and data retention.
**Source References**  
Include direct references to clauses like “Storage and Retention Policy” or “Where We Store Your Data.”
Text:
`,

  breachNotice: `You are a privacy assistant. Please summarize the breach notification policy from the terms and conditions. Explain how users are informed, the timelines, and mitigation efforts.
Write the response in the following four sections. Use plain English paragraphs with no numbered headings or markdown formatting.
**Breach Notification Commitment**  
Describe the company’s general approach to informing users of data breaches.
**Timeline and Response Actions**  
Explain how quickly the company commits to informing users and what steps are taken afterward.
**User Considerations**  
Discuss what users should expect or do if their data is affected.
**Source References**  
List the section titles or clauses like “Breach Notification Policy” or “Section 9” that explain these responsibilities.
Text:
`,

custom:`You are a privacy assistant helping users understand website Terms and Conditions.

A user has entered the following custom inquiry:  
**"${message.customPrompt}"**

Your task has two parts:

1. **Validation**:  
   First, determine whether the input is a valid and meaningful privacy-related question or keyword. If it is vague, offensive, or unrelated to privacy, consent, data protection, or terms and conditions, reply with:  
   **"Sorry, your question is invalid."**  
   Do not proceed with analysis if the inquiry is clearly irrelevant (e.g., contains words like "bullshit", "lol", "pizza", etc.).

2. **Contextual Summarization** (Only if input is valid):  
   If the input is valid, identify what aspect of the terms and conditions the inquiry relates to (e.g., data sharing, personal information collection, retention, breach notification, etc.).

   Then, summarize the relevant parts of the Terms and Conditions below using **plain English** and organize your response into four sections. Do not use numbered headings or markdown. Do not invent any information not found in the content.

   Write your answer using the following structure:

   **Focused Summary**  
   Clearly explain the part of the terms that relate to the user’s inquiry. Provide a high-level summary based on their keywords or question.

   **Details and Explanation**  
   Explain specific policies, conditions, or practices relevant to the inquiry. Paraphrase important points and provide context using examples from the terms.

   **User Considerations**  
   Briefly describe what this means for users — what they should know, expect, or watch out for.

   **Source References**  
   Point out exactly where this information came from in the terms. Mention the section titles or quote lines such as “Section 4: Data Use” or “under ‘Information Retention Policy’”.

Terms and Conditions Text:
`
};

// async function summarizeWithOpenAI(prompt, text, category, callback) {
//   try {
//     let actualText = text;

//     // ✅ If it's a PDF URL, fetch and extract the text first
//     if (text.startsWith('__PDF_URL__:')) {
//       const pdfUrl = text.replace('__PDF_URL__:', '');
//       console.log('📄 PDF detected. Extracting text from:', pdfUrl);

//       const extractRes = await fetch('http://localhost:5001/extract-pdf-text', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ url: pdfUrl })
//       });

//       const extractData = await extractRes.json();
//       if (!extractData.text) {
//         throw new Error('No text extracted from PDF.');
//       }

//       actualText = extractData.text.slice(0, 10000); // limit length for token safety
//       prompt = prompts[category] + actualText; // rebuild prompt for LLM
//     }

//     const textHash = await generateHash(actualText);

//     const readableCategory = categoryLabels[category] || category;
//     const cachedSummary = await getCachedSummary(textHash, readableCategory);

//     if (cachedSummary) {
//       console.log(`📦 LOADED FROM CACHE → Category: ${readableCategory}`);
//       callback(cachedSummary, true);
//       return;
//     }

//     if (!openaiApiKey || openaiApiKey === 'YOUR_API_KEY') {
//       callback('API key is not set.');
//       return;
//     }

//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${openaiApiKey}`,
//       },
//       body: JSON.stringify({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           { role: 'system', content: 'You are a privacy assistant.' },
//           { role: 'user', content: prompt }
//         ],
//         max_tokens: 2048,
//         temperature: 0.7
//       })
//     });

//     if (!response.ok) {
//       throw new Error(`OpenAI API error: ${response.status}`);
//     }

//     const json = await response.json();
//     const content = json.choices?.[0]?.message?.content?.trim() || 'No summary returned.';

//     if (content && !content.includes('Error')) {
//       await storeSummary(textHash, readableCategory, content);
//     }

//     callback(content, false);
//   } catch (err) {
//     console.error('Summarization error:', err);
//     callback('Error during summarization: ' + err.message);
//   }
// }

async function summarizeWithMCP(prompt, text, category, callback) {
  try {
    const isPDF = text.startsWith('__PDF_URL__:');
    const payload = {
      task: 'summarize',
      category,
      content: text,
      prompt,
      customPrompt: category === 'custom' ? prompt : ''
    };

    const response = await fetch('http://localhost:5001/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const existing = await getCachedSummary(data.textHash, category);
if (existing) {
  console.log(`📦 Skipping store — already exists for ${category}`);
  callback(existing, true);
  return;
}

    await storeSummary(data.textHash, category, data.summary);
    callback(data.summary, false);
  } catch (err) {
    console.error('MCP Summarization Error:', err);
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
      summarizeWithMCP(
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
      summarizeWithMCP(prompt, text, category, (summary) => {
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