import logging

import celery

from worker import models

app = celery.Celery()
app.config_from_object("worker.celeryconfig")

log = logging.getLogger(__name__)


@celery.signals.worker_process_init.connect
def configure_workers(**kwargs: object) -> None:
    log.info("Preloading model into the worker process")
    models.OptModel.from_settings()
    log.info("Model preloaded")


@app.task
def generate(prompt: str) -> str:
    log.info("Getting the model")
    opt_model = models.OptModel.from_settings()
    log.info("Prompting the model")
    return opt_model.generate(prompt)
