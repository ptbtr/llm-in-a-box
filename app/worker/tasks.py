import logging
import functools

import celery
from transformers import GPT2Tokenizer, OPTForCausalLM

app = celery.Celery()
app.config_from_object("worker.celeryconfig")

log = logging.getLogger(__name__)


class OptModel:
    def __init__(self) -> None:
        self.tokenizer = GPT2Tokenizer.from_pretrained("facebook/opt-350m")
        self.opt = OPTForCausalLM.from_pretrained("facebook/opt-350m")

    def generate(self, prompt: str) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt")
        generate_ids = self.opt.generate(inputs.input_ids, max_length=30)
        return self.tokenizer.batch_decode(
            generate_ids,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]


@functools.lru_cache(maxsize=1)
def get_opt_model() -> OptModel:
    return OptModel()


@celery.signals.worker_process_init.connect
def configure_workers(**kwargs: object) -> None:
    log.info("Preloading model into the worker process")
    get_opt_model()
    log.info("Model preloaded")


@app.task
def generate(prompt: str) -> str:
    log.info("Getting the model")
    opt_model = get_opt_model()
    log.info("Prompting the model")
    return opt_model.generate(prompt)
