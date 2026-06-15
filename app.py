
from flask import Flask, render_template, request, jsonify
from db import conn, cursor

import nltk
import string

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

from rapidfuzz import fuzz

app = Flask(__name__)

# Download NLTK resources
nltk.download('punkt')
nltk.download('stopwords')


# -----------------------------
# Text Preprocessing
# -----------------------------
def preprocess(text):

    text = text.lower()

    text = text.translate(
        str.maketrans(
            '',
            '',
            string.punctuation
        )
    )

    tokens = word_tokenize(text)

    stop_words = set(
        stopwords.words('english')
    )

    tokens = [
        word
        for word in tokens
        if word not in stop_words
    ]

    return " ".join(tokens)


# -----------------------------
# Home Page
# -----------------------------
@app.route("/")
def home():
    return render_template("index.html")


# -----------------------------
# Chatbot API
# -----------------------------
@app.route("/ask", methods=["POST"])
def ask():

    user_question = request.form.get(
        "question",
        ""
    ).strip()

    if not user_question:

        return jsonify({
            "answer": "Please enter a question.",
            "score": 0
        })

    try:

        cursor.execute(
            """
            SELECT
                question,
                answer
            FROM faq
            """
        )

        rows = cursor.fetchall()

        print("Total FAQs:", len(rows))

        if not rows:

            return jsonify({
                "answer": "No FAQs found in database.",
                "score": 0
            })

        processed_user_question = preprocess(
            user_question
        )

        best_score = 0
        best_answer = "Sorry, I don't know the answer."

        for q, a in rows:

            processed_q = preprocess(q)

            score = fuzz.token_set_ratio(
                processed_user_question,
                processed_q
            )

            if score > best_score:

                best_score = score
                best_answer = a

        print("Question:", user_question)
        print("Processed:", processed_user_question)
        print("Best Score:", best_score)
        print("Best Answer:", best_answer)

        if best_score < 40:

            best_answer = (
                "Sorry, I don't know the answer."
            )

        return jsonify({
            "answer": best_answer,
            "score": round(best_score, 2)
        })

    except Exception as e:

        print("Error:", str(e))

        return jsonify({
            "answer": str(e),
            "score": 0
        })


if __name__ == "__main__":
    app.run(debug=True)

