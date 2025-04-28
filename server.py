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
    content = data.get("content")
    category = data.get("category", "custom")
    prompt = data.get("prompt", "")
    custom_prompt = data.get("customPrompt", "")

    try:
        if content.startswith("__PDF_URL__:"):
            pdf_url = content.replace("__PDF_URL__:", "")
            content = extract_text_from_pdf(pdf_url)[:10000]

        text_hash = data.get("textHash") or generate_hash(content)


        if task == "summarize":
            if category == "custom" and custom_prompt:
                final_prompt = f"""{prompt}

The user's inquiry is:

"{custom_prompt}"

Please respond appropriately based on the inquiry and the following Terms and Conditions content.
"""
            else:
                if category == "custom" and custom_prompt:
                    final_prompt = prompt + "\n\nUser's inquiry:\n" + custom_prompt + "\n\nTerms and Conditions Text:\n" + content
                else:
                    final_prompt = prompt + content



            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a privacy assistant."},
                    {"role": "user", "content": final_prompt}
                ],
                max_tokens=2048,
                temperature=0.7
            )

            summary = response.choices[0].message.content.strip()

            return jsonify({
                "summary": summary,
                "textHash": text_hash,
                "category": category
            })
        else:
            return jsonify({ "error": "Unknown task" }), 400

    except Exception as e:
        return jsonify({ "error": f"LLM summarization failed: {str(e)}" }), 500


@app.route("/simplify", methods=["POST"])
# def simplify_text():
#     data = request.get_json()
#     text = data.get("text", "")

#     if not text:
#         return jsonify({"error": "No text provided"}), 400

#     prompt = f"""Please explain the following text in the simplest possible terms as if explaining to a 10-year-old child:
    
#     Original Text: "{text}"
    
#     Simplified Explanation:
#     1. Use only very common words (maximum 1st-4th grade vocabulary)
#     2. Break complex ideas into small, bite-sized pieces
#     3. Use everyday analogies and examples where possible
#     4. Keep sentences short (max 10-12 words)
#     5. Avoid all legal/technical jargon completely
#     6. Structure as: "This means...[simple explanation]...For example...[concrete example]"
    
#     Your simplified version:"""

#     response = client.chat.completions.create(
#         model="gpt-3.5-turbo",
#         messages=[
#             {"role": "system", "content": "You are an expert at explaining complex concepts in extremely simple terms."},
#             {"role": "user", "content": prompt}
#         ],
#         temperature=0.7,
#         max_tokens=500
#     )

#     simplified = response.choices[0].message.content.strip()
#     return jsonify({"simplified": simplified})

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
