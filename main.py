from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

# 🔑 Replace this with your OpenAI API key
OPENAI_API_KEY = "YOUR_API_KEY"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": """
You are Radiant AI, a smart, friendly, and approachable AI assistant. 
You always respond in a warm, positive, and helpful tone. 
You explain things clearly, give thoughtful advice, and make users feel supported. 
You can answer questions, help brainstorm ideas, guide learning, and provide suggestions. 
You remember the conversation during the session and respond like a personal companion.
""" },
                {"role": "user", "content": user_message},
            ],
        },
    )

    return jsonify(response.json()["choices"][0]["message"])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
