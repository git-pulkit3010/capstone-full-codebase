# server.py
from flask import Flask, request, jsonify
import requests
from io import BytesIO
import fitz  # PyMuPDF

app = Flask(__name__)

@app.route('/extract-pdf-text', methods=['POST'])
def extract_pdf_text():
    data = request.get_json()
    pdf_url = data.get('url')

    try:
        # Download the PDF
        response = requests.get(pdf_url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch PDF'}), 400

        # Extract text
        pdf_file = BytesIO(response.content)
        doc = fitz.open(stream=pdf_file, filetype='pdf')
        text = "\n".join([page.get_text() for page in doc])
        return jsonify({ "text": text })

    except Exception as e:
        return jsonify({ "error": str(e) }), 500


