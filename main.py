from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    msg = data.get("message")
    if not msg:
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
                    {"role": "system", "content": "You are Kimi, a friendly AI assistant."},
                    {"role": "user", "content": msg}
                ],
                "temperature": 0.7,
                "max_tokens": 200
            }
        )
        result = response.json()
        reply = result["choices"][0]["message"]["content"]
    except Exception as e:
        reply = f"Error: {str(e)}"

    return jsonify({"content": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
