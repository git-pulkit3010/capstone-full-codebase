const categoryLabels = {
  summarizeWholePage: 'Whole Page Summary',
  piCollection: 'Personal Information Collection',
  piHandling: 'Personal Information Handling',
  piStorage: 'Personal Information Storage',
  piSharing: 'Personal Information Sharing',
  dataConfidentiality: 'Data Confidentiality & Security',
  breachNotice: 'Data Breach Notification'
};

document.addEventListener('DOMContentLoaded', () => {
  const summarizeButton = document.getElementById('summarizeButton');
  const backButton = document.getElementById('backButton');
  const categories = Object.fromEntries(
    Object.keys(categoryLabels).map(k => [k, document.getElementById(k)])
  );

  // const summarizeButton = document.getElementById('summarizeButton');
  // const backButton = document.getElementById('backButton');
  const readButton = document.getElementById('readButton');
  const restartButton = document.getElementById('restartButton');
  const container = document.getElementById('categoryContainer');
  const summaryUI = document.getElementById('summaryContainer');
  const loadingText = document.getElementById('loadingText');
  const loadingBarContainer = document.getElementById('loadingBarContainer');
  const progressPercent = document.getElementById('progressPercent');
  const outputBox = document.getElementById('summarizedTextContainer');
  const statusMsg = document.getElementById('loadingText');
  const customCheckbox = document.getElementById('customInquiry');
  const customTextInput = document.getElementById('customTextInput');
  const customTextContainer = document.getElementById('customTextContainer');

  if (customCheckbox) {
    customCheckbox.addEventListener('change', () => {
      customTextContainer.style.display = customCheckbox.checked ? 'block' : 'none';
    });
  }
  

  let selected = [];

  let speech = null;
  let isPaused = false;
  let currentText = '';


  const readSummary = (text) => {
    window.speechSynthesis.cancel();
    speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    currentText = text;
    isPaused = false;
    readButton.textContent = 'Pause';
  
    speech.onend = () => {
      readButton.textContent = 'Read Summary';
      isPaused = false;
    };
  
    window.speechSynthesis.speak(speech);
  };
  
  readButton.addEventListener('click', () => {
    if (!speech || (!window.speechSynthesis.speaking && !window.speechSynthesis.paused)) {
      readSummary(currentText);
    } else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      isPaused = true;
      readButton.textContent = 'Play';
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isPaused = false;
      readButton.textContent = 'Pause';
    }
  });
  
  restartButton.addEventListener('click', () => {
    if (currentText) {
      window.speechSynthesis.cancel();
      readSummary(currentText);
    }
  });
  


  const toggleCheckboxes = () => {
    const fullPage = categories.summarizeWholePage.checked;
    Object.entries(categories).forEach(([k, el]) => {
      if (k !== 'summarizeWholePage') el.disabled = fullPage;
    });
    categories.summarizeWholePage.disabled = Object.values(categories).some((el, i) =>
      Object.keys(categories)[i] !== 'summarizeWholePage' && el.checked
    );
  };

  Object.values(categories).forEach(cb => cb.addEventListener('change', toggleCheckboxes));
  toggleCheckboxes();

  summarizeButton.addEventListener('click', () => {
    // selected = Object.keys(categories).filter(k => categories[k].checked);
    selected = Object.keys(categories).filter(k => categories[k].checked);
if (customCheckbox && customCheckbox.checked) {
  selected.push('custom');
}
if (selected.includes('custom') && (!customTextInput.value || customTextInput.value.trim() === '')) {
  alert("Please enter a custom question for your inquiry.");
  return;
}

    if (selected.length === 0) return alert("Select at least one category.");

    container.style.display = 'none';
    summaryUI.style.display = 'block';
    backButton.style.display = 'none';
    loadingText.innerText = 'Summarizing in progress...';
    outputBox.innerHTML = '';

    // Start measuring time
    const startTime = new Date();

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'extractText',
          categories: selected
        }, (res) => {
          if (!res || !res.content) {
            outputBox.innerText = '❌ Error extracting content.';
            return;
          }

          // Perform the summarization after extracting the text
          summarize(res.content, startTime);
        });
      });
    });
  });

  backButton.addEventListener('click', () => {
    container.style.display = 'block';
    summaryUI.style.display = 'none';
    window.speechSynthesis.cancel();
    readButton.textContent = 'Read Summary';
    isPaused = false;

  });

  const summarize = (text, startTime) => {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) loadingBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (loadingBarContainer) loadingBarContainer.style.display = 'block';
    document.getElementById('progressPercentLabel').style.display = 'block';

    let percent = 0;
    const interval = 100;
    const maxBeforeStop = 95;
    let isSummaryReady = false;

    const progressInterval = setInterval(() => {
      if (percent < maxBeforeStop && !isSummaryReady) {
        percent++;
        if (loadingBar) loadingBar.style.width = percent + '%';
        if (progressPercent) progressPercent.textContent = percent + '%';
      }
    }, interval);

    chrome.runtime.sendMessage({
      type: 'summarizeText',
      content: text,
      selectedCategories: selected,
      customPrompt: customTextInput?.value || ''
    }, (res) => {
      isSummaryReady = true;
      clearInterval(progressInterval);
      if (loadingBar) loadingBar.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
      if (!res || !res.summaries) {
        outputBox.innerText = '❌ No summaries received.';
        return;
      }

      // Measure the time taken for the entire summarization process
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000; // Duration in seconds
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const formattedDuration = `${minutes}m ${seconds}s`;

      // Display the result summaries
      backButton.style.display = 'block';
      loadingText.innerText = '';
      outputBox.innerHTML = '';

      selected.forEach(cat => {
        const label = categoryLabels[cat] || cat;
        const full = res.summaries[cat] || 'No summary returned.';
        const first = full.split(/[.?!]/)[0] + '.';

        outputBox.innerHTML += `
          <div class="summary-block">
            <h3>Summary for ${label}</h3>
            <p><strong>Result -</strong> ${first}</p>
            <button class="expandButton" data-cat="${cat}">Expand Summary</button>
            <div class="fullSummary" id="sum-${cat}" style="display:none;">
              <p>${full.replace(/\*/g, '')}</p>
            </div>
          </div>`;
      });

      // Append the duration at the bottom of the summary
      outputBox.innerHTML += `
        <div class="duration">
          <strong>Time taken: ${formattedDuration}</strong>
        </div>
      `;

      readButton.style.display = 'inline-block';
restartButton.style.display = 'inline-block';

const allSummariesText = selected.map(cat => {
  const label = categoryLabels[cat] || cat;
  const full = res.summaries[cat] || 'No summary returned.';
  return `Summary for ${label}: ${full}`;
}).join(' ');
currentText = allSummariesText;


      // Handle expand/collapse button
      document.querySelectorAll('.expandButton').forEach(btn => {
        btn.addEventListener('click', () => {
          const div = document.getElementById(`sum-${btn.dataset.cat}`);
          const show = div.style.display === 'none';
          div.style.display = show ? 'block' : 'none';
          btn.textContent = show ? 'Collapse Summary' : 'Expand Summary';
        });
      });
    });
  };
});