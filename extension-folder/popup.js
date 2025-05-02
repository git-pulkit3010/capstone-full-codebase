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
    // UI Elements
  const welcomeScreen = document.getElementById('welcomeScreen');
  const startButton = document.getElementById('startButton');
  const summarizeButton = document.getElementById('summarizeButton');
  const backButton = document.getElementById('backButton');
  const readButton = document.getElementById('readButton');
  const restartButton = document.getElementById('restartButton');
  const container = document.getElementById('categoryContainer');
  const summaryUI = document.getElementById('summaryContainer');
  const loadingText = document.getElementById('loadingText');
  const loadingBarContainer = document.getElementById('loadingBarContainer');
  const progressPercent = document.getElementById('progressPercent');
  const outputBox = document.getElementById('summarizedTextContainer');
  const customCheckbox = document.getElementById('customInquiry');
  const customTextInput = document.getElementById('customTextInput');
  const customTextContainer = document.getElementById('customTextContainer');

  backButton.style.display = 'none';

  const categories = Object.fromEntries(
    Object.keys(categoryLabels).map(k => [k, document.getElementById(k)])
  );

  const themeToggle = document.getElementById('themeToggle');

  welcomeScreen.style.display = 'flex';
  container.style.display = 'none';
  summaryUI.style.display = 'none';

  startButton.addEventListener('click', () => {
    welcomeScreen.style.display = 'none';
    container.style.display = 'block';
  });

// Apply saved theme on load
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode');
  themeToggle.checked = true;
}

// Toggle theme on switch
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    document.body.classList.add('light-mode');
    localStorage.setItem('theme', 'light');
    themeEmoji.textContent = '🌞';
  } else {
    document.body.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
    themeEmoji.textContent = '🌙';
  }
});


  // function enforceExclusiveSelection() {
  //   const wholePageChecked = categories.summarizeWholePage.checked;
  //   const customChecked = customCheckbox?.checked;
  
  //   // Disable/enable all category checkboxes
  //   Object.entries(categories).forEach(([key, el]) => {
  //     if (
  //       (wholePageChecked && key !== 'summarizeWholePage') ||
  //       (customChecked && key !== 'customInquiry')
  //     ) {
  //       el.disabled = true;
  //     } else {
  //       el.disabled = false;
  //     }
  //   });
  
  //   // Handle Custom Inquiry checkbox state
  //   customCheckbox.disabled = wholePageChecked;
  
  //   // Handle Summarize Whole Page checkbox state
  //   categories.summarizeWholePage.disabled = customChecked;
  
  //   // Enable/disable custom text input
  //   customTextInput.disabled = !customChecked || wholePageChecked;
  // }

  function enforceExclusiveSelection() {
    const wholePageChecked = categories.summarizeWholePage.checked;
    const customChecked = customCheckbox.checked;
  
    // Disable "Summarize Whole Page" and "Custom Inquiry" based on mutual exclusivity
    categories.summarizeWholePage.disabled = customChecked || Object.entries(categories).some(([key, el]) => key !== 'summarizeWholePage' && key !== 'customInquiry' && el.checked);
    customCheckbox.disabled = wholePageChecked || Object.entries(categories).some(([key, el]) => key !== 'summarizeWholePage' && key !== 'customInquiry' && el.checked);
  
    // Disable all other categories if either special one is selected
    Object.entries(categories).forEach(([key, el]) => {
      if (key !== 'summarizeWholePage' && key !== 'customInquiry') {
        el.disabled = wholePageChecked || customChecked;
      }
    });
  
    // Handle custom text input
    customTextInput.disabled = !customChecked || wholePageChecked;
  }
  
  
  customCheckbox.addEventListener('change', enforceExclusiveSelection);
  categories.summarizeWholePage.addEventListener('change', enforceExclusiveSelection);
  Object.values(categories).forEach(cb => cb.addEventListener('change', enforceExclusiveSelection));


  // Initialize checkboxes


  let selected = [];
  let speech = null;
  let isPaused = false;
  let currentText = '';

  // Toggle custom text input visibility
  if (customCheckbox) {
    customCheckbox.addEventListener('change', () => {
      customTextContainer.style.display = customCheckbox.checked ? 'block' : 'none';
      if (customCheckbox.checked) {
        customTextInput.focus();
      }
    });
  }

  // Text-to-speech functionality
  const readSummary = (text) => {
    window.speechSynthesis.cancel();
    speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    speech.rate = 0.9;
    speech.pitch = 1;
    currentText = text;
    isPaused = false;
    readButton.innerHTML = '<span class="button-text">Pause</span> <span class="button-icon">❚❚</span>';
  
    speech.onend = () => {
      readButton.innerHTML = '<span class="button-text">Read</span> <span class="button-icon">▶</span>';
      isPaused = false;
    };
  
    window.speechSynthesis.speak(speech);
  };

  // Toggle speech playback
  readButton.addEventListener('click', () => {
    if (!speech || (!window.speechSynthesis.speaking && !window.speechSynthesis.paused)) {
      readSummary(currentText);
    } else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      isPaused = true;
      readButton.innerHTML = '<span class="button-text">Play</span> <span class="button-icon">▶</span>';
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isPaused = false;
      readButton.innerHTML = '<span class="button-text">Pause</span> <span class="button-icon">❚❚</span>';
    }
  });

  // Restart speech
  restartButton.addEventListener('click', () => {
    if (currentText) {
      window.speechSynthesis.cancel();
      readSummary(currentText);
    }
  });

  // Toggle checkbox states
  const toggleCheckboxes = () => {
    const fullPage = categories.summarizeWholePage.checked;
    Object.entries(categories).forEach(([k, el]) => {
      if (k !== 'summarizeWholePage') el.disabled = fullPage;
    });
    categories.summarizeWholePage.disabled = Object.values(categories).some((el, i) =>
      Object.keys(categories)[i] !== 'summarizeWholePage' && el.checked
    );
  };

  // Set up checkbox event listeners
  Object.values(categories).forEach(cb => cb.addEventListener('change', toggleCheckboxes));
  toggleCheckboxes();

  // Main summarize button handler
  summarizeButton.addEventListener('click', () => {
    selected = Object.keys(categories).filter(k => categories[k].checked);
    if (customCheckbox && customCheckbox.checked) {
      selected.push('custom');
    }
    
    if (selected.includes('custom') && (!customTextInput.value || customTextInput.value.trim() === '')) {
      outputBox.innerHTML = '<div style="color: var(--error-color); text-align: center; padding: 12px;">Please enter a custom question</div>';
      customTextContainer.style.animation = 'shake 0.4s ease';
      setTimeout(() => customTextContainer.style.animation = '', 400);
      return;
    }

    if (selected.length === 0) {
      outputBox.innerHTML = '<div style="color: var(--error-color); text-align: center; padding: 12px;">Select at least one category</div>';
      return;
    }

    // Animate transition to summary view
    container.style.opacity = '0';
    container.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      container.style.display = 'none';
      summaryUI.style.display = 'block';
      backButton.style.display = 'block';
      setTimeout(() => {
        summaryUI.style.opacity = '1';
        summaryUI.style.transform = 'translateY(0)';
      }, 50);
    }, 200);

    loadingText.textContent = 'Analyzing page content...';
    outputBox.innerHTML = '';
    backButton.style.display = 'none';
    readButton.style.display = 'none';
    restartButton.style.display = 'none';

    const startTime = new Date();

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      loadingText.textContent = 'Preparing document...';
      loadingBarContainer.style.display = 'block';

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'extractText',
          categories: selected
        }, (res) => {
          if (!res || !res.content) {
            outputBox.innerHTML = '<div style="color: var(--error-color); text-align: center; padding: 12px;">Error extracting content</div>';
            return;
          }
          summarize(res.content, startTime);
        });
      });
    });
  });

  // Back button handler
  backButton.addEventListener('click', () => {
    summaryUI.style.opacity = '0';
    summaryUI.style.transform = 'translateY(10px)';
    setTimeout(() => {
      summaryUI.style.display = 'none';
      container.style.display = 'block';
      backButton.style.display = 'none';
      setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 50);
    }, 200);
    
    window.speechSynthesis.cancel();
    readButton.innerHTML = '<span class="button-text">Read</span> <span class="button-icon">▶</span>';
    isPaused = false;
  });

  // Main summarization function
  const summarize = (text, startTime) => {
    const loadingBar = document.getElementById('loadingBar');
    loadingBar.style.width = '0%';
    progressPercent.textContent = '0%';
    loadingBarContainer.style.display = 'block';
    document.getElementById('progressPercentLabel').style.display = 'block';

    let percent = 0;
    const maxBeforeStop = 95;
    let isSummaryReady = false;
    let dotCount = 0;
    const interval = 100;
    
    const progressInterval = setInterval(() => {
        if (percent < maxBeforeStop && !isSummaryReady) {
            percent++;
            loadingBar.style.width = percent + '%';
            progressPercent.textContent = percent + '%';
        } else if (!isSummaryReady) {
            // Stop incrementing percent, but shimmer loading text
            dotCount = (dotCount + 1) % 4;
            const dots = '.'.repeat(dotCount);
            loadingText.textContent = `Analyzing page content${dots}`;
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
      loadingBar.style.width = '100%';
      progressPercent.textContent = '100%';
      loadingBarContainer.style.display = 'none';
      document.getElementById('progressPercentLabel').style.display = 'none';

      
      if (!res || !res.summaries) {
        outputBox.innerHTML = '<div style="color: var(--error-color); text-align: center; padding: 12px;">No summaries received</div>';
        return;
      }

      // Calculate duration
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const formattedDuration = `${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;

      // Update UI
      backButton.style.display = 'block';
      loadingText.textContent = '';
      outputBox.innerHTML = '';

      // Display summaries
      selected.forEach((cat, index) => {
        const label = categoryLabels[cat] || (cat === 'custom' ? 'Answer to Inquiry' : cat);
        let full = res.summaries[cat] || 'No summary available for this section.';
        full = full.replace(/Source:\s*([^\n]+)/g, (match, sourceText) => {
          const cleanSource = sourceText.trim()
            .replace(/^["']+|["']+$/g, '') // Remove surrounding quotes if any
            .replace(/\.$/, ''); // Remove trailing period
          return `Source: <a href="#" class="source-link" data-source="${encodeURIComponent(cleanSource)}">${cleanSource}</a>`;
        });

        const first = full.split(/[.?!]/)[0].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + (full.match(/[.?!]/) ? '' : '.');

        const summaryBlock = document.createElement('div');
        summaryBlock.className = 'summary-block';
        summaryBlock.style.animationDelay = `${index * 0.1}s`;
        summaryBlock.innerHTML = `
          <h3>${label}</h3>
          <p>${first}</p>
          <button class="expandButton" data-cat="${cat}" aria-expanded="false">
            <span class="button-text">Show Full Summary</span>
            <span class="button-icon">▼</span>
          </button>
          <div class="fullSummary" id="sum-${cat}" style="display:none;">
          ${full.replace(/\*/g, '').split(/\n{2,}/).map(section => {
            section = section.trim();
            
            if (!section.includes('\n')) {
              // No newline, treat entire thing as paragraph
              return `<p style="margin-bottom:12px;">${section}</p>`;
            } else {
              const [heading, ...rest] = section.split('\n');
              return `
                <h4 style="font-weight:600; font-size:15px; color:var(--text-primary); margin-top:20px; margin-bottom:6px;">${heading.trim()}</h4>
                <p style="margin-bottom:12px;">${rest.join(' ').trim()}</p>
              `;
            }
          }).join('')
          }
          
        </div>
        
        `;
        outputBox.appendChild(summaryBlock);
      });

      // Add click handlers for source links - NEW SECTION
      document.querySelectorAll('.source-link').forEach(link => {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          const sourceText = decodeURIComponent(link.dataset.source);

      
      // Visual feedback
      link.style.color = 'var(--accent-hover)';
      link.style.fontWeight = '600';

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'scrollToSource',
          sourceText: sourceText
        });

        if (!response || !response.success) {
          throw new Error('Source not found');
        }
      } catch (err) {
        console.error('Failed to locate source:', err);
        link.style.color = 'var(--error-color)';
        setTimeout(() => {
          link.style.color = 'var(--accent-color)';
          link.style.fontWeight = '';
        }, 2000);
      }
    });
  });

      // Add duration
      const durationElement = document.createElement('div');
      durationElement.className = 'duration';
      durationElement.innerHTML = `<strong>Processed in ${formattedDuration}</strong>`;
      outputBox.appendChild(durationElement);

      // Set up text-to-speech content
      currentText = selected.map(cat => {
        const label = categoryLabels[cat] || cat;
        const full = res.summaries[cat] || 'No summary available.';
        return `Section: ${label}. Summary: ${full}`;
      }).join(' ');

      // Show action buttons
      readButton.style.display = 'inline-block';
      restartButton.style.display = 'inline-block';

      // Set up expand/collapse functionality
      document.querySelectorAll('.expandButton').forEach(btn => {
        btn.addEventListener('click', () => {
          const div = document.getElementById(`sum-${btn.dataset.cat}`);
          const show = div.style.display === 'none';
          div.style.display = show ? 'block' : 'none';
          btn.setAttribute('aria-expanded', show);
          btn.innerHTML = show 
            ? '<span class="button-text">Hide Summary</span> <span class="button-icon">▲</span>'
            : '<span class="button-text">Show Full Summary</span> <span class="button-icon">▼</span>';
        });
      });
    });
  };
});


// document.addEventListener("mouseup", () => {
//   const sel = window.getSelection();
//   const selectedText = sel.toString().trim();
//   if (!selectedText) return;

//   const outputBox = document.getElementById("summarizedTextContainer");
//   const range = sel.getRangeAt(0);
//   if (!outputBox.contains(range.commonAncestorContainer)) return;

//   // Remove existing button if any
//   const existingBtn = document.getElementById("simplifyPopupButton");
//   if (existingBtn) existingBtn.remove();

//   // Preserve selection details
//   const rect = range.getBoundingClientRect();
//   const capturedText = selectedText;
//   const scrollY = window.scrollY || window.pageYOffset;

//   const btn = document.createElement("button");
//   btn.id = "simplifyPopupButton";
//   btn.textContent = "Simplify";
//   Object.assign(btn.style, {
//     position: "fixed",
//     top: `${rect.top + window.scrollY - 50}px`,
//     left: `${rect.left + window.scrollX + rect.width / 2}px`,
//     transform: "translateX(-50%)",
//     background: "var(--accent-color)",
//     color: "#fff",
//     border: "none",
//     padding: "6px 12px",
//     borderRadius: "6px",
//     cursor: "pointer",
//     zIndex: 10000,
//     boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
//     fontSize: "13px",
//     whiteSpace: "nowrap",
//     textAlign: "center",
//     minWidth: "auto",  // <--- important change
//     maxWidth: "140px", // <--- keeps it neat
//   });
  
//   document.body.appendChild(btn);
  

//   btn.onclick = async () => {
//     // Preserve selection before any DOM changes
//     const selection = window.getSelection();
//     if (selection.rangeCount > 0) {
//       selection.removeAllRanges();
//       selection.addRange(range);
//     }

//     btn.textContent = "Simplifying...";
//     try {
//       const resp = await fetch("http://127.0.0.1:5001/simplify", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text: capturedText })
//       });
//       const { simplified, error } = await resp.json();
//       if (error) throw new Error(error);

//       // Create tooltip
//       const isLightMode = document.body.classList.contains('light-mode');
//       const tooltip = document.createElement("div");
// tooltip.innerHTML = `
//   <div style="position:absolute;
//               top:${Math.max(rect.top + window.scrollY - 220, 10)}px;
//               left:${rect.left}px;
//               background: var(--bg-tertiary);
//               color: var(--text-primary);
//               border: 1px solid var(--border-color);
//               padding: 12px;
//               border-radius: 8px;
//               max-width: 300px;
//               max-height: 200px;
//               overflow-y: auto;
//               box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//               z-index: 10001;">
//     <div style="margin-bottom:6px;">
//       <strong style="color: var(--accent-color);">Simplified Explanation</strong>
//     </div>
//     <div style="font-size:13px;line-height:1.4;">
//       ${simplified}
//     </div>
//   </div>
// `;

//       document.body.appendChild(tooltip);
      
//       // Close tooltip when clicking outside
//       const closeTooltip = (e) => {
//         if (!tooltip.contains(e.target) && e.target !== btn) {
//           tooltip.remove();
//           document.removeEventListener('click', closeTooltip);
//         }
//       };
//       setTimeout(() => document.addEventListener('click', closeTooltip), 100);

//     } catch (err) {
//       console.error("Simplification failed:", err);
//       // Show error message
//       const errorTooltip = document.createElement("div");
//       errorTooltip.innerHTML = `
//         <div style="position:absolute;
//                     top:${rect.bottom + 30}px;
//                     left:${rect.left}px;
//                     background:var(--error-bg);
//                     color:var(--error-color);
//                     padding:8px 12px;
//                     border-radius:4px;
//                     z-index:10001;">
//           Failed to simplify. Please try again.
//         </div>
//       `;
//       document.body.appendChild(errorTooltip);
//       setTimeout(() => errorTooltip.remove(), 3000);
//     } finally {
//       btn.remove();
//       sel.removeAllRanges();
//     }
//   };
// });


document.addEventListener("mouseup", () => {
  setTimeout(() => {  // <-- WRAP EVERYTHING HERE
    const sel = window.getSelection();
    const selectedText = sel.toString().trim();
    if (!selectedText) return;

    const outputBox = document.getElementById("summarizedTextContainer");
    const range = sel.getRangeAt(0);
    if (!outputBox.contains(range.commonAncestorContainer)) return;

    const existingBtn = document.getElementById("simplifyPopupButton");
    if (existingBtn) existingBtn.remove();

    const rect = range.getBoundingClientRect();
    const capturedText = selectedText;

    const btn = document.createElement("button");
    btn.id = "simplifyPopupButton";
    btn.textContent = "Simplify";
    Object.assign(btn.style, {
      position: "fixed",
      // top: `${rect.top + window.scrollY - 50}px`,
      top: `${Math.max(rect.top + window.scrollY - 50, 10)}px`,
      left: `${rect.left + window.scrollX + rect.width / 2}px`,
      transform: "translateX(-50%)",
      background: "var(--accent-color)",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      zIndex: 10000,
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      fontSize: "13px",
      whiteSpace: "nowrap",
      textAlign: "center",
      minWidth: "auto",
      maxWidth: "140px",
    });

    document.body.appendChild(btn);

    // your btn.onclick code (simplification logic) continues here...
    btn.onclick = async () => {
      // Preserve selection before any DOM changes
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      btn.disabled = true;

// Create a small "Simplifying..." overlay
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'simplifyLoadingOverlay';
      loadingOverlay.textContent = 'Simplifying...';
      Object.assign(loadingOverlay.style, {
        position: 'fixed',
        top: `${Math.max(rect.top + window.scrollY - 80, 10)}px`,
        left: `${rect.left + window.scrollX + rect.width / 2}px`,
        transform: 'translateX(-50%)',
        background: 'var(--accent-color)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        zIndex: '10002',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
      });
      document.body.appendChild(loadingOverlay);
      btn.remove()

      const spinnerStyle = document.createElement('style');
      spinnerStyle.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      `;

      try {
        const resp = await fetch("http://127.0.0.1:5001/simplify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: capturedText })
        });
        const { simplified, error } = await resp.json();
        if (error) throw new Error(error);
  
        // Create tooltip
        const isLightMode = document.body.classList.contains('light-mode');
        const tooltip = document.createElement("div");
  tooltip.innerHTML = `
    <div style="position:absolute;
                top:${Math.max(rect.top + window.scrollY - 220, 10)}px;
                left:${rect.left}px;
                background: var(--bg-tertiary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                padding: 12px;
                border-radius: 8px;
                max-width: 300px;
                max-height: 200px;
                overflow-y: auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10001;">
      <div style="margin-bottom:6px;">
        <strong style="color: var(--accent-color);">Simplified Explanation</strong>
      </div>
      <div style="font-size:13px;line-height:1.4;">
        ${simplified}
      </div>
    </div>
  `;
  
  setTimeout(() => {
    document.body.appendChild(tooltip);
    if (btn) btn.remove();
  
    // Remove the loading overlay after tooltip appears
    const overlay = document.getElementById('simplifyLoadingOverlay');
    if (overlay) overlay.remove();
  }, 600);
        
        // Close tooltip when clicking outside
        const closeTooltip = (e) => {
          if (!tooltip.contains(e.target) && e.target !== btn) {
            tooltip.remove();
            document.removeEventListener('click', closeTooltip);
          }
        };
        setTimeout(() => document.addEventListener('click', closeTooltip), 100);
  
      } catch (err) {
        console.error("Simplification failed:", err);
        // Show error message
        const errorTooltip = document.createElement("div");
        errorTooltip.innerHTML = `
          <div style="position:absolute;
                      top:${rect.bottom + 30}px;
                      left:${rect.left}px;
                      background:var(--error-bg);
                      color:var(--error-color);
                      padding:8px 12px;
                      border-radius:4px;
                      z-index:10001;">
            Failed to simplify. Please try again.
          </div>
        `;
        document.body.appendChild(errorTooltip);
        setTimeout(() => errorTooltip.remove(), 3000);
      } finally {
        sel.removeAllRanges();
      }
    };
  }, 50);  // <-- 50ms slight delay
});

document.addEventListener("mousedown", (e) => {
  const simplifyBtn = document.getElementById("simplifyPopupButton");
  if (simplifyBtn && !simplifyBtn.contains(e.target)) {
    simplifyBtn.remove();
  }
});
