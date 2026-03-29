from flask import Flask, request, jsonify, render_template
import os
import openai

app = Flask(__name__)

# 🔑 Get API key from environment variable (Replit secret)
openai.api_key = os.environ.get("OPENAI_API_KEY")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message")

    if not user_message:
        return jsonify({"content": "Please enter a message."})

    try:
        # Call OpenAI API (GPT-3.5-Turbo or GPT-4)
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are Kimi, a helpful AI assistant."},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=200
        )
        reply = response['choices'][0]['message']['content'].strip()
        return jsonify({"content": reply})
    except Exception as e:
        return jsonify({"content": f"Error: {str(e)}"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
