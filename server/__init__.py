from typing import TypedDict

from flask import Flask
from flask import request

from server import models

app = Flask(__name__)


class Prediction(TypedDict):
    response: str


class HealthCheck(TypedDict):
    ...


@app.route("/generate", methods=["POST"])
def predict() -> Prediction:
    prompt = request.get_json()["prompt"]
    opt_model = models.get_opt_model()
    return {"response": opt_model.generate(prompt)}


@app.route("/health", methods=["GET"])
def health() -> HealthCheck:
    return {}
