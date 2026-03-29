from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

# Get API key from Replit Secrets
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message")

    if not user_message:
        return jsonify({"content": "No message received"})

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
                    {"role": "system", "content": "You are Radiant AI, a helpful assistant."},
                    {"role": "user", "content": user_message},
                ],
            },
        )

        result = response.json()

        print(result)  # DEBUG

        ai_reply = result["choices"][0]["message"]["content"]

    except Exception as e:
        ai_reply = f"Error: {str(e)}"

    return jsonify({"content": ai_reply})


app.run(host="0.0.0.0", port=3000)
