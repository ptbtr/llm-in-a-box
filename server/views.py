from typing import TypedDict

from flask import request, Blueprint

from server import models

server = Blueprint("server", __name__)


class Prediction(TypedDict):
    response: str


@server.route("/generate", methods=["POST"])
def predict() -> Prediction:
    prompt = request.get_json()["prompt"]
    opt_model = models.get_opt_model()
    return {"response": opt_model.generate(prompt)}


class HealthCheck(TypedDict):
    ...


@server.route("/health", methods=["GET"])
def health() -> HealthCheck:
    return {}
