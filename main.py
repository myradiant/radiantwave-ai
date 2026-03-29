from flask import Flask, request, jsonify, render_template
import os

app = Flask(__name__)

print("🔥 NEW VERSION RUNNING 🔥")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_msg = data.get("message")

    if not user_msg:
        return jsonify({"content": "No message received"})

    # ✅ PURE TEST MODE (NO API AT ALL)
    return jsonify({"content": f"You said: {user_msg}"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
