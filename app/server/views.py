from typing import TypedDict

from flask import current_app, request, Blueprint

from server import models

server = Blueprint("server", __name__)


class Prediction(TypedDict):
    response: str


@server.route("/generate", methods=["POST"])
def predict() -> Prediction:
    prompt = request.get_json()["prompt"]
    current_app.logger.info("Getting the model")
    opt_model = models.get_opt_model()
    current_app.logger.info("Prompting the model")
    response = opt_model.generate(prompt)
    return {"response": response}


class HealthCheck(TypedDict):
    ...


@server.route("/health", methods=["GET"])
def health() -> HealthCheck:
    return {}
