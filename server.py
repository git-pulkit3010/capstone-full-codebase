# server.py
from flask import Flask, request, jsonify
from io import BytesIO
from openai import OpenAI
import requests
import fitz  # PyMuPDF
import hashlib
import os
from dotenv import load_dotenv

# load_dotenv()
client = OpenAI(api_key="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")

app = Flask(__name__)

def extract_text_from_pdf(pdf_url):
    response = requests.get(pdf_url)
    if response.status_code != 200:
        raise Exception("Failed to fetch PDF")
    pdf_file = BytesIO(response.content)
    doc = fitz.open(stream=pdf_file, filetype='pdf')
    return "\n".join([page.get_text() for page in doc])

def generate_hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

@app.route('/extract-pdf-text', methods=['POST'])
def extract_pdf_text():
    data = request.get_json()
    pdf_url = data.get('url')

    try:
        text = extract_text_from_pdf(pdf_url)
        return jsonify({ "text": text })
    except Exception as e:
        return jsonify({ "error": str(e) }), 500

@app.route("/mcp", methods=["POST"])
def mcp_handler():
    data = request.get_json()
    task = data.get("task")
    content = data.get("content", "")
    category = data.get("category", "custom")
    prompt = data.get("prompt", "")
    custom_prompt = data.get("customPrompt", "")

    try:
        if content.startswith("__PDF_URL__:"):
            pdf_url = content.replace("__PDF_URL__:", "")
            content = extract_text_from_pdf(pdf_url)

        text_hash = data.get("textHash") or generate_hash(content)

        if task != "summarize":
            return jsonify({ "error": "Unknown task" }), 400

        # max_content_per_chunk = 16000

        # def chunk_text(text, size):
        #     return [text[i:i+size] for i in range(0, len(text), size)]

        # def summarize_chunks(chunks, prompt_base, custom_prompt_inner=""):
        #     summaries = []
            
            
        if category == "custom" and custom_prompt:
            full_prompt = f"""You are a legal assistant. The user has a question about a Terms and Conditions document.

Question: "{custom_prompt}"

Document:
"{content}"

If the question is nonsense (random characters, not a real query), respond with:
Answer: Please ask a valid question
Key Point: N/A
Source: N/A

If the question is clear and meaningful:
- If a short answer is sufficient, give a concise answer in 3 lines:
  Answer: [up to 50 words]
  Key Point: [most critical takeaway]
  Source: [section name or quote]
- If a detailed explanation is needed, follow the same structure, but allow the **Answer** section to span 4-6 sentences (max 150 words).

Never go outside the document. Only answer based on what the document contains.
Use plain English. Avoid legal jargon.
"""
        else:
            full_prompt = prompt + "\n\n" + content

        # if len(full_prompt) > 12000:
        #     full_prompt = full_prompt[:12000]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a privacy assistant helping users understand legal documents."},
                {"role": "user", "content": full_prompt}
            ],
            max_tokens=2048,
            temperature=0.3
        )

        summary = response.choices[0].message.content.strip()

        #         if ("not covered" in summary.lower() and 
        #             summary.startswith("Answer: Not covered")):
        #             return ["Answer: Not covered\nKey Point: N/A\nSource: N/A"]

        #         summaries.append(summary)

        #     return summaries

        # # First try with full content before chunking
        # # try:
        # #     initial_response = summarize_chunks([content], prompt, custom_prompt)
        # #     if not any("Not covered" in s for s in initial_response):
        # #         return jsonify({
        # #             "summary": "\n\n".join(initial_response),
        # #             "textHash": text_hash,
        # #             "category": category
        # #         })
        # # except Exception as e:
        # #     print(f"Full content summarization attempt failed, falling back to chunks: {str(e)}")

        # # # Fall back to chunking if full content attempt failed
        # # chunks = chunk_text(content, max_content_per_chunk)
        # # summaries = summarize_chunks(chunks, prompt, custom_prompt)

        # # Optional re-summarize if still too long
        # while len("\n\n".join(summaries)) > 12000:
        #     summaries = summarize_chunks(chunk_text("\n\n".join(summaries), max_content_per_chunk), "Summarize these partial summaries:")

        # final_summary = "\n\n".join(summaries)

        return jsonify({
            "summary": summary,
            "textHash": text_hash,
            "category": category
        })

    except Exception as e:
        return jsonify({ "error": f"LLM summarization failed: {str(e)}" }), 500






@app.route("/simplify", methods=["POST"])
def simplify_text():
    data = request.get_json()
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    prompt = f"Explain the following in simpler terms:\n\n{text}\n\nSimplified:"
    response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )

    simplified = response.choices[0].message.content.strip()
    return jsonify({"simplified": simplified})


@app.route('/explain', methods=['POST'])
def explain_snippet():
    data = request.get_json() or {}
    snippet = data.get('snippet', '').strip()
    context = data.get('context', '').strip()

    if not snippet or not context:
        return jsonify({ 'error': 'Both snippet and context are required.' }), 400

    # Build a prompt that asks the model to explain the snippet in the context of the document
    prompt = (
        "Rewrite the highlighted text below as if you were explaining it to someone with no legal or technical background. "
        "Use short sentences, simple words, and avoid jargon.\n\n"
        f"Context:\n{context}\n\n"
        f"Text to simplify:\n{snippet}\n\n"
        "Simplified explanation:"
    )


    try:
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=512
        )
        explanation = resp.choices[0].message.content.strip()
        return jsonify({ 'explanation': explanation })
    except Exception as e:
        return jsonify({ 'error': f"LLM call failed: {e}" }), 500

if __name__ == "__main__":
    app.run(port=5001)
