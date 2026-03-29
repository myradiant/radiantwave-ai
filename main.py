from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

# Toggle this:
USE_API = False   # ❗ change to True when your API key is ready

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

    # ✅ TEST MODE (no API needed)
    if not USE_API:
        return jsonify({"content": f"(Test Mode) You said: {user_msg}"})

    # ✅ REAL API MODE
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
