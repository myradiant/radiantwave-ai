from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

# ✅ Read OpenAI API key from environment
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found. Add it in Replit Secrets.")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"content": "No message received."})

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are Radiant AI, a smart, friendly, and helpful AI assistant."},
                    {"role": "user", "content": user_message},
                ],
            },
        )
        data = response.json()
        ai_message = data["choices"][0]["message"]["content"]
    except Exception as e:
        ai_message = f"Error: {e}"

    return jsonify({"content": ai_message})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
