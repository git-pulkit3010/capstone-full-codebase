【LLM-based Interactive Consent】- LLM-Based Interactive Consent Summarizer

## Project Overview

LLM-based Interactive Consent is a Chrome Extension designed to assist users in understanding online Terms & Conditions and Privacy Policies. It automatically extracts relevant content from webpages or PDFs, categorizes privacy-related sections, and generates easy-to-read summaries using an LLM (Large Language Model). Users can also input custom privacy-related inquiries.

The project leverages OpenAI's GPT-3.5-turbo model and includes caching mechanisms to reduce API usage. Backend servers are implemented using both Flask (for LLM interaction) and Express.js (for database management).

## Features

- **Automated Text Extraction**: Capture visible content or embedded PDFs.
- **Categorized Summarization**:
  - Personal Information Collection
  - Personal Information Handling
  - Personal Information Storage
  - Personal Information Sharing
  - Data Confidentiality & Security
  - Data Breach Notification
  - Whole Page Summary
- **Custom Inquiry**: Users can ask free-form privacy questions.
- **Simplified Explanations**: Select text on a webpage and simplify it with one click.
- **Light/Dark Theme**: UI automatically supports both themes.
- **Voice Readout**: Summaries can be read aloud.
- **Progress Tracking**: Display processing percentage during summarization.
- **Database Caching**: Summaries are cached using MySQL for faster future access.

## System Architecture

### Frontend (Chrome Extension)

- **popup.html**: Main interface for user interaction.
- **popup.js**: Handles UI logic, text-to-speech, communicating with content and background scripts.
- **popup.css**: Responsive styling for light/dark modes.
- **background.js**: Handles API communication with backend servers and summary caching.
- **content.js**: Extracts webpage text based on keywords or full-page scan.
- **manifest.json**: Chrome Extension configuration.

### Backend Servers

- **server.py (Flask)**:
  - Accepts text and generates summaries via OpenAI GPT.
  - Supports summarization and text simplification.
- **server.js (Express.js)**:
  - Connects to MySQL database.
  - Stores and retrieves cached summaries.

## Setup Instructions

### Prerequisites

- Node.js (for server.js)
- Python 3.10+ (for server.py)
- Chrome browser (for testing the extension)
- MySQL database (Railway, local, or any compatible server)

### Environment Variables

To connect the database, the user needs to create a `.env` file including following information. (The information contains our member's database authentication details, the user can replace it with their own details. If just for testing purpose, feel free to use it.)

```
DB_HOST=yamabiko.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=ZgTkRGOkrSiAXMllOZLYTQoqMGJBHYQH
DB_NAME=railway
DB_PORT=39474
```

### Install Dependencies

#### Node.js backend

```bash
cd project_root
npm install
```

#### OpenAI Module

```
pip install openai
```

#### Python backend

```bash
pip install flask openai pymupdf requests python-dotenv
```

### Running the Servers

#### Start Express.js server

```bash
node server.js
```

(Default port: 3000)

#### Start Flask server

```bash
flask --app server.py run --port 5001
```

### Load Extension

- Go to `chrome://extensions`.
- Enable "Developer Mode".
- Click "Load unpacked".
- Select the `extension-folder/` directory and upload it.

## Known Issues

- If trying to summarize a Chrome system page (`chrome://` URL), extension cannot access.
- If the OpenAI API returns an empty or malformed response, an error will be displayed.
- Site-specific dynamic content (like embedded settings panels) might get incorrectly extracted. This is normal for aggressive scraping.

## Recent Updates

- **Custom Inquiry Handling Fixed**: Proper prompt combination and separate hash generation to prevent cache collision.
- **Back Button Issue Fixed**: UI now correctly displays the "Back to Categories" button after summarization.
- **Scrollable Summary Panel**: Improved UX when many summaries are generated.
- **Initial Welcome Screen Added**: New first screen before category selection.
- **Icons Added**: Buttons now include emoji icons for better UI clarity.

## Future Improvements (Optional)

- Add more granular error messages.
- Optimize prompt templates for better LLM summarization quality.
- Support storing full prompt + input text combinations in the database.
- Provide fallback behavior when database server is unreachable.

## Contributors


- **Backend & Integration**: Zihan Zhou, Peizhou Zhao, Pukit Jain, Juwita Adelina
- **Frontend UI Development & Improvements**: Peizhou Zhao, Jing Qi, Cariana, Pulkit Jain
- **Documentation**: Juwita Adelina, Jing Qi, Ziheng Wang
- **Testing**: Juwita Adelina, Peizhou Zhao, Zihan Zhou

## License

This project is for educational purposes under the University of Sydney Capstone Project CS30-2-2025-S1.

## Acknowledgments

- OpenAI API
- Flask and Express.js frameworks
- Chrome Extensions API
- Railway Cloud Hosting

------

Thank you for using ConsentBuddy!