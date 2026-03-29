from flask import Flask, request, jsonify, render_template
import os
import requests

app = Flask(__name__)

# Toggle between test mode and real AI
USE_API = True  # Set to True to use OpenAI, False for test mode

# Get API key from Replit Secrets
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

print("🔥 RADIANT AI RUNNING 🔥")
print("USE_API =", USE_API)
if USE_API and not OPENAI_API_KEY:
    print("⚠️ WARNING: OPENAI_API_KEY not found. Running in test mode.")
    USE_API = False

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
        # Test mode (no API)
        return jsonify({"content": f"(Test Mode) You said: {user_msg}"})

    # Real AI mode with safe handling
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
        print("DEBUG RESPONSE:", result)  # <-- very important for troubleshooting

        if "choices" in result and len(result["choices"]) > 0:
            ai_reply = result["choices"][0]["message"]["content"]
        else:
            ai_reply = "API returned unexpected response: " + str(result)

    except Exception as e:
        ai_reply = f"Error calling API: {str(e)}"

    return jsonify({"content": ai_reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
