import logging

import celery

from settings import config
from worker import models

app = celery.Celery()
app.config_from_object(config.get_settings())

log = logging.getLogger(__name__)


@celery.signals.worker_process_init.connect
def configure_workers(**kwargs: object) -> None:
    log.info("Preloading model into the worker process")
    models.OptModel.from_settings()
    log.info("Model preloaded")


@app.task
def ready() -> None:
    return


@app.task
def complete(prompt: str, max_tokens: int) -> str:
    log.info("Getting the model")
    opt_model = models.OptModel.from_settings()
    log.info("Prompting the model")
    return opt_model.complete(prompt, max_tokens)
