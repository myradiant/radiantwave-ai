from flask import Flask, request, jsonify, render_template
import os
import requests

app = Flask(__name__)

# Toggle between test mode and real AI
USE_API = False  # Change to True when your API key is ready

# Read API key from Replit Secrets
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_msg = data.get("message")

    if not user_msg:
        return jsonify({"content": "No message received"})

    if not USE_API:
        # Test mode (no AI)
        return jsonify({"content": f"(Test Mode) You said: {user_msg}"})

    # Real AI mode
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
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": user_msg}
                ],
            },
        )
        result = response.json()
        print("DEBUG:", result)

        if "choices" in result:
            reply = result["choices"][0]["message"]["content"]
        else:
            reply = "API Error: " + str(result)

    except Exception as e:
        reply = f"Error: {str(e)}"

    return jsonify({"content": reply})
